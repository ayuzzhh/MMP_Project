# LandGuard – Land Verification & Intelligence Platform
## Document 06: Official Data Sources, Ingestion Protocols & Legal Framework

---

### 1. Primary Government Data Repositories (Rajasthan)

LandGuard identifies and designs ingestion connectors for the following statutory land repositories:

#### 1.1 Apna Khata / e-Dharti (Revenue Department, Government of Rajasthan)
- **Portal URL:** `https://apnakhata.rajasthan.gov.in`
- **Statutory Authority:** Board of Revenue for Rajasthan (Ajmer), established under the Rajasthan Land Revenue Act, 1956.
- **Records Provided:**
  - **Jamabandi (RoR / Record of Rights):** Current tenure holders (*Khatedars*), ancestral parentage, residential address, Khata number, Khasra number, land category (*Chahi, Barani, Siway Chak, Charagah*), and revenue assessment.
  - **Namantaran (Mutation Register / P-21):** Chronological log of title transfers resulting from sale, inheritance (*Virasat*), court decree, or partition.
- **Access Protocol:** Captcha-protected web interface, district-tehsil-village drill-down. For automated enterprise synchronization, state-level API integration under the Digital India Land Records Modernization Programme (DILRMP) is targeted.

#### 1.2 Bhunaksha Rajasthan (National Informatics Centre / Board of Revenue)
- **Portal URL:** `https://bhunaksha.rajasthan.gov.in`
- **Records Provided:**
  - Digitized vector cadastral maps (Khasra maps / *Naksha*) for Ranpur village, Ladpura Tehsil.
  - Spatial parcel attributes: Plot boundary coordinates, adjoining Khasras, village periphery, public cart-tracks (*Rasta*), and water bodies.
- **Ingestion Strategy:** Vector GeoJSON / ESRI Shapefile extraction, CRS normalization to EPSG:4326, topology verification with PostGIS `ST_IsValidReason`, and automated attribution mapping.

#### 1.3 IGRS Rajasthan (Inspector General of Registration & Stamps - E-Panjiyan)
- **Portal URL:** `https://igrs.rajasthan.gov.in`
- **Jurisdictional Office:** Sub-Registrar Office (SRO), Ladpura / Kota.
- **Records Provided:**
  - Registered conveyance deeds (Sale, Gift, Release, Partition).
  - Encumbrance certificates (EC): Search of books maintained under Section 51 of the Registration Act, 1908.
  - Registered Mortgages (*Dharohar Nama*): Bank charges, home loan liens, and equitable mortgage registrations under Section 89 of the Registration Act.
- **Legal Authority:** Public right of inspection of Book 1 and Indexes under Section 57 of the Registration Act, 1908.

#### 1.4 e-Courts Services (National Judicial Data Grid / e-Committee, Supreme Court of India)
- **Portal URL:** `https://ecourts.gov.in` & `https://services.ecourts.gov.in`
- **Jurisdictions for Ranpur:**
  - Revenue Courts: Tehsildar Ladpura Court, Sub-Divisional Officer (SDO) Kota, Revenue Appellate Authority (RAA) Kota, Board of Revenue Ajmer.
  - Civil Courts: Court of Civil Judge (Junior Division) Kota, Additional District Judge (ADJ) Kota.
  - Constitutional Court: High Court of Judicature for Rajasthan (Jaipur Bench).
- **Primary Identifier:** Case Number Record (CNR) – an immutable 16-character alphanumeric key (e.g., `RJKO010045212023`).
- **Litigation Intelligence:** Tracking injunctions, interim stay orders, partition disputes, and *Lis Pendens* notices governed by Section 52 of the Transfer of Property Act, 1882.

#### 1.5 RIICO & Kota Development Authority (KDA / UIT Kota)
- **Portal URL:** `https://riico.onlinerevenue.rajasthan.gov.in` & `https://urban.rajasthan.gov.in`
- **Scope:** Ranpur hosts the extensive RIICO Industrial Area (Growth Centre Ranpur) and expanding institutional/residential sectors under KDA master plan 2031.
- **Records Provided:** Industrial plot allotment letters, lease agreements (99-year leasehold conditions), non-encumbrance certificates, and land use zoning changes under Section 90-A of the Rajasthan Land Revenue Act.

---

### 2. Document OCR Extraction Pipeline (Tesseract & Structured Heuristics)

When property documents (Jamabandis, registry deeds, court order sheets) are uploaded by Admins:
1. **Sanitization & Conversion:** PDF or TIFF converted to 300 DPI multi-page grayscale PNGs.
2. **Pre-processing:** Contrast enhancement, deskewing, and noise removal using Sharp/Jimp.
3. **Dual-Language Tesseract OCR:** Configured with `hin+eng` (Hindi + English) trained data models.
4. **Regex & Heuristic Key-Value Entity Extraction:**
   - Khasra extraction: `खसरा संख्या\s*[:\-]?\s*([0-9\/\-]+)`
   - Khata extraction: `खाता संख्या\s*[:\-]?\s*([0-9]+)`
   - Land area: `क्षेत्रफल\s*[:\-]?\s*([0-9.]+)\s*(हेक्टेयर|बीघा)`
   - CNR number: `[A-Z]{4}[0-9]{12}`
   - SRO Deed number: `दस्तावेज क्रमांक\s*[:\-]?\s*([0-9]+)`
5. **Human Verification Quarantine:** Extracted fields are stored in `property_documents.ocr_extracted_fields` in `PENDING` state. Admins review extracted values side-by-side with original document scans prior to publishing.

---

### 3. Legal, Statutory & Regulatory Compliance Framework

#### 3.1 Digital Personal Data Protection Act, 2023 (DPDPA)
- Land ownership records in India are public statutory records under Section 74-76 of the Indian Evidence Act, 1872 and the Rajasthan Land Revenue Act, 1956.
- To honor privacy best practices under DPDPA, LandGuard strictly masks:
  - Landowner Aadhaar numbers (first 8 digits redacted).
  - Private mobile telephone numbers and bank account numbers.
  - Personal biometric or photographic identifiers not necessary for title verification.

#### 3.2 Disclaimer & Platform Independence
LandGuard operates strictly as an independent analytics and due-diligence facilitation platform. Every screen, PDF report, and export includes the mandatory statutory disclaimer:

> **IMPORTANT STATUTORY NOTICE:**
> LandGuard is an independent private technology platform and is NOT affiliated with, authorized by, or endorsed by the Government of Rajasthan, Board of Revenue, RIICO, or any government department.
>
> All intelligence reports, Khasra details, and legal analyses are compiled for informational and due diligence purposes only. They do NOT constitute certified copies under Section 76 of the Indian Evidence Act, 1872, nor do they substitute for formal title inspection, SRO search certificates under the Registration Act, 1908, or independent legal counsel from an advocate. Users are strongly advised to obtain certified government copies prior to executing any financial or legal commitment.

#### 3.3 Intermediary Safe Harbor (Section 79, IT Act, 2000)
- LandGuard maintains an active grievance redressal mechanism (`user_reports` table).
- Disputed or erroneous records flagged by registered users are placed under review within 36 hours.
