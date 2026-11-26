# e-Stahl – Land Verification & Intelligence Platform
## Geographic Jurisdiction: Ranpur Revenue Village, Ladpura Tehsil, Kota District, Rajasthan (PIN 325003)

e-Stahl is a specialized full-stack geographical land intelligence platform engineered to combat property fraud across India. By combining cadastral GIS mapping (Leaflet, PostGIS, GeoJSON) with synthesized revenue records (Apna Khata / Jamabandi), encumbrance registers (IGRS), and judicial records (e-Courts), e-Stahl enables buyers, citizens, and legal professionals to perform rigorous due diligence before committing capital.

---

### Key Architectural Highlights

1. **Exact Revenue Cadastral Standard:** Explicit anchoring to Ranpur Revenue Village (Census 2011 Code `03807600`, LGD Code `100452`, Ladpura Tehsil, Kota District, Rajasthan) rather than relying on postal PIN code 325003 (which is documented strictly as a postal delivery zone).
2. **PostGIS Cadastral Spatial Engine:** Spatial parcel lookups via point-in-polygon queries (`ST_Intersects`), coordinate reference systems (`EPSG:4326`, metric area in `EPSG:32643`), centroid badge computation, and boundary geometry validation (closed ring, orientation).
3. **Four-Pillar Land Intelligence:**
   - **Khatedari & Ownership Title Lineage**: Primary registered owners, parentage, tenure types, and historical chain of transfers.
   - **Government Land & Commons**: Public utility classifications (Siway Chak, Charagah / pasture, RIICO industrial leasehold, forest buffer).
   - **Litigation & e-Courts Verification**: Civil suits, partition disputes, 16-digit e-Courts CNR numbers, and Order 39 Rules 1 & 2 CPC status quo injunctions (Lis Pendens under Section 52 Transfer of Property Act).
   - **Registered Financial Encumbrances**: Institutional bank mortgages (IGRS Rajasthan, SRO Ladpura), credit charges, and satisfaction records.
4. **Institutional Two-Man Rule (Maker-Checker):** Verification Officers (Admin role) can draft cadastral alterations and propose record mutations, but cannot self-approve. Only a Super Admin can approve and merge changes into live records.
5. **Document Storage & Tesseract OCR Pipeline:** Multipart file uploads (`multer`), Devanagari Hindi / English regex revenue parsing (Khasra, Khata, Khatedar name, CNR), discrepancy auditing, and human-in-the-loop review console.
6. **Token Monetization & Razorpay Integration:** Flexible investigative token wallet, Razorpay checkout with server-side HMAC-SHA256 signature verification, idempotency protection against double deduction, and **Zero Token Deduction Guarantee** (tokens are never charged if requested data is absent).
7. **Official Due Diligence PDF / Printable Certificate:** High-resolution printable dossier with institutional certification reference, QR verification stamp, cadastral breakdown, and statutory disclaimer under the Rajasthan Tenancy Act 1955.

---

### Project Structure

```
e-Stahl/
├── backend/                  # Node.js + Express + TypeScript Backend
│   ├── migrations/           # PostgreSQL + PostGIS DDL and Seed migrations
│   │   ├── 001_initial_schema.sql
│   │   └── 002_seed_ranpur_cadastre.sql
│   ├── src/
│   │   ├── config/           # Database pool, migrations runner, seed dataset
│   │   ├── controllers/      # Village, Property, Wallet, Auth, Admin, Document controllers
│   │   ├── middleware/       # JWT Auth, RBAC, Zod validation, Multer upload
│   │   ├── routes/           # Central API routing
│   │   ├── services/         # GIS spatial queries, RecordService, DocumentService, WalletService
│   │   └── index.ts          # Server initialization & health diagnostics
│   ├── tests/                # 6 Automated Integration Test Suites (100% Pass Rate)
│   │   ├── api.test.ts       # Suite 1: Core API & Health
│   │   ├── auth.test.ts      # Suite 2: Authentication & RBAC
│   │   ├── gis.test.ts       # Suite 3: PostGIS Spatial Queries & Cadastre
│   │   ├── records.test.ts   # Suite 4: Four-Pillar Domain Intelligence & Two-Man Rule
│   │   ├── documents.test.ts # Suite 5: Document Storage & OCR Pipeline
│   │   ├── wallet.test.ts    # Suite 6: Token Wallet & Razorpay Verification
│   │   └── runAll.ts         # Master Test Runner
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React 18 + TypeScript + Tailwind CSS + Leaflet
│   ├── src/
│   │   ├── components/       # InteractiveMap, PropertyDrawer, WalletModal,
│   │   │                     # AdminMapEditorModal, AdminRecordEditorModal,
│   │   │                     # AdminDocumentReviewModal, DueDiligenceReportModal, Navbar, Footer
│   │   ├── context/          # AuthContext with live prototype persona switcher
│   │   ├── pages/            # LandingPage, MapExplorerPage, AdminDashboardPage, LoginPage, RegisterPage, AboutPage
│   │   ├── services/         # Axios API client
│   │   ├── types/            # TypeScript domain interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── documentation/            # 10 Architectural & Statutory Documentation Guides
│   ├── 01_PROJECT_REQUIREMENTS_ANALYSIS.md
│   ├── 02_TECHNICAL_ARCHITECTURE.md
│   ├── 03_ENTITY_RELATIONSHIP_DIAGRAM.md
│   ├── 04_DATABASE_SCHEMA_AND_MIGRATIONS.md
│   ├── 05_GEOGRAPHICAL_DATA_SPECIFICATION_RANPUR.md
│   ├── 06_OFFICIAL_DATA_SOURCES_AND_LEGAL_INTEGRATION.md
│   ├── 07_TWO_MAN_RULE_AND_VERIFICATION_WORKFLOW.md
│   ├── 08_DOCUMENT_STORAGE_AND_OCR_PIPELINE.md
│   ├── 09_TOKEN_MONETIZATION_AND_WALLET_SYSTEM.md
│   └── 10_SYSTEM_VERIFICATION_AND_DEPLOYMENT_MANUAL.md
├── README.md
└── .gitignore
```

---

### Evaluation Personas for Live Testing

| Persona | Email | Password | Permissions & Role |
|---|---|---|---|
| **Citizen Property Buyer** | `user@landguard.in` | `User@123` | Role: `USER`<br>Wallet: 10 Tokens<br>Can explore map, unlock intelligence, purchase tokens, print PDF reports |
| **Verification Officer** | `admin@landguard.in` | `Admin@123` | Role: `ADMIN` (Maker)<br>Can edit cadastral boundaries, propose record mutations, run OCR reviews |
| **Super Administrator** | `superadmin@landguard.in` | `SuperAdmin@123` | Role: `SUPER_ADMIN` (Checker)<br>Unilateral approval authority over Two-Man Rule queue, audit log inspector, direct committer |

---

### Automated Test Suite Execution

Run the master test runner executing all 6 test suites:
```bash
cd backend
npm test
```
All 6 test suites pass with a 100% success rate across API, Auth & RBAC, GIS Cadastre, Two-Man Rule Domain Records, OCR Document Pipeline, and Razorpay Token Monetization.
