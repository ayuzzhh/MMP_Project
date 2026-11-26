# LandGuard – Land Verification & Intelligence Platform
## Document 01: Project Requirements & Domain Analysis

---

### 1. Executive Summary & Problem Space

LandGuard is an interactive geographical land intelligence platform engineered to combat property fraud in India by enabling citizens, prospective property buyers, legal professionals, and financial institutions to access cadastral-level parcel intelligence, ownership records, encumbrance history, and legal dispute status prior to executing real estate transactions.

In the Indian real estate and land revenue ecosystem, ordinary purchasers encounter systemic vulnerabilities including:
1. **Illegal sale of government or communal land:** Encroachment and fraudulent sale of *Siway Chak* (government revenue land), *Charagah* (pasture land), *Gair Mumkin* (unusable/public easement land), and *Abadi* expansions without title.
2. **Concealed legal disputes (*Lis Pendens*):** Sale of properties actively disputed in Civil Courts, Revenue Courts (SDM, Collector, Revenue Board), or the High Court without disclosing ongoing litigation.
3. **Undisclosed mortgages & bank encumbrances:** Property owners pledging original registered sale deeds to multiple banks or non-banking financial companies (NBFCs) while executing unregistered or fraudulent secondary sales.
4. **Multiple ownership claims & fraudulent power of attorneys (PoAs):** Concurrent claims stemming from forged title deeds, revoked General Power of Attorneys (GPAs), or unprobated partition claims among co-sharers (*Khatedars*).
5. **Cadastral & measurement discrepancies:** Inconsistencies between ground demarcations and the official Revenue Khasra map (*Bhunaksha*), causing boundary overlapping, area shortfall, and right-of-way disputes.
6. **Absence of a unified verification provenance:** Lack of transparent timestamps, data sources, and explicit status distinctions between *verified*, *unverified*, and *unavailable* information.

LandGuard addresses these critical issues by integrating cadastral Geographic Information Systems (GIS) with digitized revenue records and an auditable, token-monetized intelligence model.

---

### 2. Stakeholders & User Roles

The platform enforces a strict Role-Based Access Control (RBAC) model with three distinct personas:

```
+-----------------------------------------------------------------------------------+
|                                 PLATFORM PERSONAS                                 |
+-----------------------------------------------------------------------------------+
|  1. PUBLIC USER (Citizen, Buyer, Broker, Advocate, Bank Surveyor)                 |
|     - Browse interactive Ranpur village cadastral map (Satellite & Street).       |
|     - Search parcels by Khasra number or geographic coordinates.                  |
|     - Inspect free basic property metadata (Khasra, Area, Classification, Status).|
|     - Purchase and maintain a pre-paid token wallet via Razorpay.                 |
|     - Pay tokens to unlock granular intelligence tiers (Ownership, Legal, etc.).  |
|     - Download cryptographically signed, timestamped Due Diligence Reports.       |
|     - Report data discrepancies with supporting evidence.                         |
+-----------------------------------------------------------------------------------+
|  2. DATA VERIFICATION ADMIN (Revenue Specialist, GIS Operator, Legal Auditor)     |
|     - Digitally ingest and digitize land parcels, Khasra boundaries, and metadata.|
|     - Upload title deeds, Jamabandi extracts, and encumbrance certificates.       |
|     - Review and correct automated Tesseract OCR field extractions.               |
|     - Record court cases (e-Courts CNR, court name, status, lis pendens).         |
|     - Record registered mortgages, charges, and deed releases.                    |
|     - Submit all material mutations/edits as Change Requests (Two-Man Rule).      |
|     - Triage and investigate user discrepancy complaints.                         |
+-----------------------------------------------------------------------------------+
|  3. SUPER ADMIN (System Administrator, Legal Compliance Director)                 |
|     - Two-man rule gatekeeper: Approve/reject all sensitive data modifications.   |
|     - Admin lifecycle management (Role assignment, permission activation).        |
|     - Configure dynamic token pricing per report category and token packages.     |
|     - Monitor financial transactions, ledger consistency, and refunds.            |
|     - Audit comprehensive platform access logs and immutable provenance records.  |
|     - Oversee geographical coverage expansion beyond Ranpur.                      |
+-----------------------------------------------------------------------------------+
```

---

### 3. Functional Requirements

#### 3.1 Geographic Information System (GIS) & Cadastral Mapping
- **Cadastral Boundary Rendering:** Render verified village boundary and internal cadastral land parcels (Khasras) as responsive vector polygons.
- **Dual Map Views:** Dynamic toggle between high-resolution Satellite imagery (Esri World Imagery / Google Hybrid) and OpenStreetMap Carto vector tiles.
- **Spatial Parcel Querying:** Point-in-polygon identification (`ST_Intersects`) allowing users to click any coordinate on the map and immediately identify the underlying parcel.
- **Khasra Search Engine:** Instant autocompletion and zoom-to-parcel search by Khasra number (including split/fractional Khasras such as `101/1`).
- **Cadastral Editing Suite (Admin only):** Polygon draw, split, merge, vertex modification, and GeoJSON upload with PostGIS geometry validation (`ST_IsValid`).

#### 3.2 Property Information Architecture
Every parcel is indexed with an immutable, cryptographically verifiable UUID and a human-readable platform Property ID (e.g., `LG-RJ-KOT-RAN-00101`). Information is segregated into five distinct categories:
1. **Basic Property Metadata (Free tier):**
   - Property ID, Khasra Number, Village (Ranpur), Tehsil (Ladpura), District (Kota).
   - Total Area (in Hectares, Pucca Bighas, and Sq. Metres).
   - Official Land Classification (*Khatedari / Bilanam / Siway Chak / Charagah / Industrial RIICO / Abadi*).
   - Data verification badge & last audited date.
2. **Ownership & Title Intelligence (Token-gated: 1 Token):**
   - Current recorded tenure holders (*Khatedars* / Owners).
   - Ownership share/percentage and tenure type (*Bhumidhar, Asami, Government Allottee*).
   - Provenance chain: Historical mutation records (*Namantaran*), previous registered conveyances, and title transfer deed references.
3. **Government & Public Land Status (Token-gated: 1 Token):**
   - Explicit classification of state ownership (Revenue Department, Forest Department, RIICO, UIT/KDA, Gram Panchayat).
   - Protected public easements, water bodies (*Nallah / Talab*), and pasture reservations.
   - Non-alienable and acquisition notification flags under Land Acquisition Acts.
4. **Legal Disputes & Court Litigation (Token-gated: 2 Tokens):**
   - Active and historical litigation records linked to the Khasra.
   - Court details (Revenue Board Ajmer, District Court Kota, Rajasthan High Court).
   - Case tracking: CNR number, suit type (partition, injunction, title dispute), filing date, last order summary, and *Lis Pendens* warning flags.
5. **Financial Charges & Encumbrances (Token-gated: 2 Tokens):**
   - Registered mortgages, equitable bank liens, agricultural Kisan Credit Card (KCC) charges.
   - Sub-Registrar Office (SRO) registration reference numbers and dates.
   - Mortgage satisfaction/reconveyance status and discharge certificates.

#### 3.3 Token Economy, Wallet & Razorpay Monetization
- **Pre-paid Token Wallet:** Users hold an integer token balance tied to their UUID.
- **Flexible Token Packages:** Configurable pricing tiers (e.g., 5 tokens for ₹299, 15 tokens for ₹799, 50 tokens for ₹1,999).
- **Payment Verification:** Razorpay checkout with server-side HMAC-SHA256 signature verification and webhook idempotency.
- **Availability Pre-Check:** The engine evaluates database records prior to token deduction. **Tokens are never deducted for empty or unavailable information categories.**
- **Atomic Deduction:** Database transactions (`SERIALIZABLE` or `SELECT ... FOR UPDATE`) ensure zero risk of double spending or race conditions.
- **Lifetime Access Preservation:** Once an intelligence tier or complete property report is unlocked for a parcel, the user retains perpetual access without subsequent re-billing.

#### 3.4 Verification & Document Processing Pipeline
- **Dual Intake Modes:** Manual revenue entry by authorized admins and batch import from official datasets (Shapefiles / GeoJSON / Jamabandi CSVs).
- **Two-Man Rule (Dual-Authorization):** All edits submitted by an Admin remain in `PENDING_APPROVAL` status until a Super Admin formally reviews the diff and approves or rejects the change.
- **Optical Character Recognition (OCR):** Ingestion of property title documents (PDF/JPEG), OCR extraction of Hindi and English revenue terms via Tesseract, side-by-side verification interface, and human-in-the-loop validation prior to persistence.
- **Provenance Transparency:** Every published data point records its legal authority, document source, recording date, reviewing admin, and approving super admin.

---

### 4. Non-Functional Requirements

- **Spatial Performance:** Sub-100ms response time for spatial queries (`ST_Intersects`) over the entire Ranpur cadastral dataset using PostGIS GiST spatial indexing.
- **Data Integrity & Immutability:** Foreign key constraints, UUID v4 primary keys, PostgreSQL check constraints, and historical append-only logs for all ownership transitions.
- **Security & Threat Mitigation:**
  - Password hashing with bcrypt (cost factor 12) or Argon2id.
  - JWT storage in Secure, HTTP-Only, SameSite cookies to mitigate XSS and CSRF.
  - Express rate limiting (`express-rate-limit`) on authentication and spatial discovery endpoints.
  - Parameterized queries to eliminate SQL injection.
  - Strict input sanitization and Zod/Joi schema validation.
- **Regulatory & Legal Compliance:**
  - Compliance with the Digital Personal Data Protection Act, 2023 (DPDPA).
  - Explicit disclaimers stating that LandGuard intelligence reports are analytical due-diligence aids and do not substitute certified copies issued under Section 76 of the Indian Evidence Act, 1872 or official search certificates under the Registration Act, 1908.
