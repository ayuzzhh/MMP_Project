# LandGuard System Verification & Deployment Manual

## 1. Quick Start & Execution Guide

### Prerequisites
- Node.js v18+ (tested on Node.js v24.18.0)
- npm v10+ (tested on npm 11.16.0)
- PostgreSQL 14+ with PostGIS extension (optional; robust automated hybrid spatial fallback active when database is offline)

### Starting the Backend
```bash
cd "LandGuard/backend"
npm install
npm run build
npm start
# Or for live hot-reload development:
npm run dev
```
Backend binds to: `http://localhost:5000/api`
Health check: `http://localhost:5000/api/health`

### Starting the Frontend
```bash
cd "LandGuard/frontend"
npm install
npm run build
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 2. Test Suite Execution & Coverage

The platform features an automated end-to-end integration test runner orchestrating 6 comprehensive test suites:

```bash
cd "LandGuard/backend"
npm test
```

### The 6 Automated Test Suites:
1. **Core API Integration Suite (`api.test.ts`)**:
   - Health check endpoints
   - Village catalog retrieval
   - GeoJSON cadastral FeatureCollection parsing
   - Khasra searches and spatial bounds
2. **Authentication & RBAC Security Suite (`auth.test.ts`)**:
   - bcrypt password hashing & Zod validation
   - JWT tokens in HTTP-Only cookies & Bearer headers
   - Role-Based Access Control (`USER`, `ADMIN`, `SUPER_ADMIN`)
   - Pre-seeded evaluation personas
3. **GIS & Cadastral Spatial Operations Suite (`gis.test.ts`)**:
   - PostGIS / in-memory point-in-polygon (`ST_Intersects`)
   - Centroid computation for Khasra polygon badges
   - Category filtering (`AGRICULTURAL_IRRIGATED`, `COMMERCIAL`, `CHARAGAH`)
   - Polygon geometry validation (closed ring, orientation, vertex bounds)
4. **Domain Records & Two-Man Rule Suite (`records.test.ts`)**:
   - Four revenue pillars: Khatedari ownership, e-Courts litigation with CNR numbers, SRO mortgages, government lands
   - Maker-Checker quarantine & review
   - Super Admin approval merging into live public dataset
   - Cryptographic `AUDIT_LOGS` tracing
5. **Document Storage & OCR Pipeline Suite (`documents.test.ts`)**:
   - Multipart document upload via `multer`
   - Rajasthan revenue regex extraction (Jamabandi, Sale Deed, Court Orders)
   - Human-in-the-loop field review & verification
   - Discrepancy flagging and Super Admin direct commit
6. **Token Monetization & Razorpay Verification Suite (`wallet.test.ts`)**:
   - Razorpay order generation & HMAC-SHA256 signature verification
   - Atomic wallet balance credit and deduction
   - Idempotent unlock (prevention of double token deduction)
   - Zero Token Deduction Guarantee on unavailable categories

---

## 3. Evaluation Personas for Live Testing

| Persona | Email | Password | Permissions & Role |
|---|---|---|---|
| **Citizen Property Buyer** | `user@landguard.in` | `User@123` | Role: `USER`<br>Wallet: 10 Tokens<br>Can explore map, unlock intelligence, purchase tokens, print PDF reports |
| **Verification Officer** | `admin@landguard.in` | `Admin@123` | Role: `ADMIN` (Maker)<br>Can edit cadastral boundaries, propose record mutations, run OCR reviews |
| **Super Administrator** | `superadmin@landguard.in` | `SuperAdmin@123` | Role: `SUPER_ADMIN` (Checker)<br>Unilateral approval authority over Two-Man Rule queue, audit log inspector, direct committer |
