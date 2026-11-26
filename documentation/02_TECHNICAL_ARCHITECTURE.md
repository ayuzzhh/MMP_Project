# LandGuard – Land Verification & Intelligence Platform
## Document 02: Technical Architecture & System Design

---

### 1. High-Level Architectural Pattern

LandGuard is architected as a **Modular Monolith** designed for high cohesion, low coupling, auditability, and immediate development velocity, while allowing clean horizontal decomposition into microservices (e.g., dedicated GIS Tile Server, OCR Ingestion Worker, Payment Webhook Service) as geographic coverage scales across Rajasthan and India.

```
+-----------------------------------------------------------------------------------------------+
|                                      CLIENT LAYER (SPA)                                       |
|  React 18+ (TypeScript) | Tailwind CSS | React-Leaflet / Leaflet | Lucide Icons | Axios       |
+-----------------------------------------------------------------------------------------------+
                                                |
                                        HTTPS / REST API
                                                |
+-----------------------------------------------------------------------------------------------+
|                                    GATEWAY & MIDDLEWARE                                       |
|  CORS | Helmet Security Headers | Rate Limiter | Cookie/JWT Parser | RBAC Authorization Guard |
+-----------------------------------------------------------------------------------------------+
                                                |
+-----------------------------------------------------------------------------------------------+
|                               APPLICATION & BUSINESS LOGIC LAYER                              |
|                                                                                               |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
|  |   Auth & User      |  |  GIS & Cadastral   |  |     Property       |  |  Verification   |  |
|  |     Service        |  |     Service        |  |  Intelligence Svc  |  |  & Audit Svc    |  |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
|            |                       |                       |                      |           |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
|  |  Wallet & Token    |  |     Razorpay       |  |   Document OCR     |  | Change Request  |  |
|  |     Service        |  |   Payment Svc      |  |   Extraction Svc   |  | (Two-Man Rule)  |  |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
+-----------------------------------------------------------------------------------------------+
                                                |
+-----------------------------------------------------------------------------------------------+
|                                    DATA ACCESS LAYER                                          |
|      Connection Pool (node-pg) | Parameterized Query Builder | Transaction Manager (ACID)     |
+-----------------------------------------------------------------------------------------------+
                                                |
+-----------------------------------------------------------------------------------------------+
|                                  PERSISTENCE & STORAGE                                        |
|  +---------------------------------------------+   +---------------------------------------+  |
|  | PostgreSQL 16+ with PostGIS 3.4+ Extensions |   | S3-Compatible Encrypted Object Store  |  |
|  | (Spatial Polygons, GiST Indexes, RDBMS)     |   | (Title Deeds, Jamabandis, Case Files) |  |
|  +---------------------------------------------+   +---------------------------------------+  |
+-----------------------------------------------------------------------------------------------+
```

---

### 2. Layered Component Responsibilities

#### 2.1 Presentation Layer (Frontend)
- **Framework:** React 18+ with TypeScript, bundled with Vite for fast HMR.
- **Styling:** Tailwind CSS with a cohesive, professional palette designed for institutional trust (Navy, Slate, Emerald for verified badges, Amber for pending, Rose for disputes/restrictions).
- **Mapping Engine:** Leaflet coupled with React-Leaflet:
  - Custom vector styling for cadastral parcels based on land tenure (Agricultural, Residential, Commercial, State Owned).
  - Spatial layer switching: Esri Satellite World Imagery vs. Carto Light OSM vector tiles.
  - Interactive click handlers with coordinate transformation, highlighting selected parcels, and rendering popup/sidebar intelligence cards.
  - Khasra live search box with auto-zoom and bounding box pan transitions.
- **State & Communication:** React Context for Auth and Wallet State, Axios with automatic interceptors for JWT renewal and unified error notifications.

#### 2.2 Application / API Layer (Backend)
- **Runtime & Framework:** Node.js v20+ / v24+ with Express.js written in strict TypeScript.
- **Modularity:** Domain-driven directory isolation:
  - `controllers/`: HTTP protocol mapping, request handling, response structuring.
  - `middleware/`: Authentication (`verifyJwt`), Role-Based Authorization (`requirePermission`), Input Validation (`zod`), Rate Limiting (`express-rate-limit`), File Uploads (`multer`).
  - `services/`: Encapsulated domain logic containing pure business rules, transaction boundaries, and spatial SQL queries.
  - `models/`: TypeScript interfaces and data mapping definitions.
  - `utils/`: Spatial calculation helpers (EPSG:4326 to UTM conversion, area calculation), crypto helpers, currency formatters.

#### 2.3 Spatial Data Processing & PostGIS Integration
- **Coordinate Reference Systems (CRS):**
  - **EPSG:4326 (WGS 84):** Storage format for all vector coordinates, GeoJSON transfer format between server and browser Leaflet maps.
  - **EPSG:3857 (Web Mercator):** Projected CRS used by Leaflet web tiles.
  - **EPSG:32643 (WGS 84 / UTM Zone 43N):** Used for precise metric calculations (Area in sq. metres, Bighas, Hectares, and polygon perimeter) within Rajasthan:
    ```sql
    -- Precise metric area calculation in PostGIS
    ST_Area(ST_Transform(boundary, 32643)) AS area_sqm;
    ```
- **Spatial Queries:**
  - `ST_Intersects`: Identify parcel clicked by user latitude/longitude.
  - `ST_AsGeoJSON`: Serialize geometries directly inside PostgreSQL for zero-overhead JSON delivery.
  - `ST_MakeValid` & `ST_IsValid`: Automatic geometry self-intersection repair.
  - `GiST (Generalized Search Tree)` indexing on all polygon columns to guarantee $O(\log N)$ spatial lookup times.

#### 2.4 Token Economy & Financial Integrity Engine
- **Atomic Operations:** Token deductions are guarded by PostgreSQL transactional locks:
  ```sql
  BEGIN;
  SELECT balance FROM token_wallets WHERE user_id = $1 FOR UPDATE;
  -- Validate balance >= cost
  -- Deduct tokens and write to token_transactions ledger
  -- Grant report access entry
  COMMIT;
  ```
- **Information Availability Gate:** Before spending tokens, the backend executes an availability probe across the requested category (`ownership_records`, `legal_disputes`, etc.). If no records exist or the parcel is unverified, the transaction aborts safely with `400 INFO_CATEGORY_UNAVAILABLE`.
- **Payment Verification:** Webhook and client payment callback verification using HMAC-SHA256 signature checking:
  $$\text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{razorpay\_secret})$$

#### 2.5 Two-Man Rule Approval Workflow (Audit & Integrity)
In real-world land administration, unverified unilateral edits lead to fraud. LandGuard implements the **Two-Man Rule (Maker-Checker Architecture)**:
1. When an Admin adds or edits ownership, Khasra boundaries, or court dispute data, the database writes the change to `property_change_requests` in `PENDING` state with a JSON payload of the proposed delta.
2. The live property record remains unmodified.
3. A Super Admin inspects the audit queue, reviews the diff side-by-side with uploaded source documents, and triggers `approve` or `reject`.
4. Upon approval, an atomic transaction applies the changes to the live table, logs the Super Admin's ID, and appends to `ownership_history` and `admin_activity_logs`.

---

### 3. Security, Privacy & Data Provenance Strategy

| Threat Vector | Mitigation Strategy |
|---|---|
| Broken Authentication | HTTP-Only, Secure, SameSite=Strict JWT cookies with 15-minute access token lifespan and rotating refresh tokens. |
| Privilege Escalation | Explicit permission checks on each route (e.g. `hasPermission('properties:approve')`) rather than basic string role checks. |
| SQL Injection | 100% Parameterized queries across all database drivers and Knex/PostGIS query builders. No raw SQL concatenation. |
| Fraudulent Document Ingestion | Anti-virus MIME validation, random UUID storage keys on S3, private pre-signed URLs with 5-minute expiry. |
| Data Poisoning / Forgery | Every record requires a foreign key reference to `property_sources` (source department, URL, physical file reference, date). |
| Race Condition in Wallet | Database row-level locking (`FOR UPDATE`) and unique constraints on `(user_id, property_id, category_unlocked)`. |
| PII Exposure (DPDPA 2023) | Masking of sensitive personal identifiers (Aadhaar, phone numbers) of landowners in public view. |

---

### 4. Deployment & Infrastructure Strategy

- **Frontend:** Vercel / Cloudflare Pages with global Edge CDN caching for static Leaflet assets and vector GeoJSON tiles.
- **Backend:** Node.js service running on Render, Railway, AWS ECS, or DigitalOcean App Platform with automated health checks.
- **Database:** Managed PostgreSQL 16+ with PostGIS enabled (AWS RDS, Neon, Supabase, or self-hosted PostgreSQL with PostGIS).
- **Object Storage:** AWS S3 or Cloudflare R2 for cadastral maps, Jamabandi scans, and deed PDFs with presigned URL access.
