# LandGuard – Land Verification & Intelligence Platform
## Document 05: Geographical Data Specifications – Ranpur, Rajasthan (325003)

---

### 1. Official Revenue Identity & Administrative Hierarchy

To ensure accuracy, the postal PIN code (325003) must not be confused with the cadastral revenue village boundary. A PIN code is a postal delivery jurisdiction that spans multiple revenue villages (e.g., Ranpur, Baori Khera, Shyampura, Lakhawa).

LandGuard explicitly anchors its data to the **Official Revenue Village** hierarchy recognized by the Revenue Department of Rajasthan and the Census of India / Local Government Directory (LGD):

| Administrative Level | Name | Official Government Code |
|---|---|---|
| **Country** | India | IN |
| **State** | Rajasthan | 08 (Census) / RJ |
| **Division** | Kota Division | 04 |
| **District** | Kota | 108 (Census) |
| **Sub-District / Tehsil** | Ladpura | 00539 |
| **Revenue Village (Patwar Circle)** | Ranpur | Census Code: `03807600` / LGD: `100452` |
| **Delivery Post Office** | Ranpur Sub-Post Office | PIN: `325003` |
| **Development Authority** | Kota Development Authority (KDA) / RIICO | Ranpur Industrial Area / Growth Centre |

---

### 2. Geographic Coordinates, Extents & Projections

- **Centroid Coordinates:** Latitude $25.0485^\circ\text{ N}$, Longitude $75.8360^\circ\text{ E}$
- **Bounding Box (BBOX):**
  - Minimum Longitude (West): $75.8150^\circ\text{ E}$
  - Minimum Latitude (South): $25.0280^\circ\text{ N}$
  - Maximum Longitude (East): $75.8650^\circ\text{ E}$
  - Maximum Latitude (North): $25.0750^\circ\text{ N}$
- **Coordinate Reference Systems (CRS):**
  - **Storage & GeoJSON Exchange:** `EPSG:4326` (WGS 84 Ellipsoidal Latitude/Longitude).
  - **Web Tile Rendering:** `EPSG:3857` (Spherical Mercator).
  - **Metric Geodesic Area Calculation:** `EPSG:32643` (UTM Zone 43N, WGS 84).

---

### 3. Rajasthan Land Revenue Measurement Units & Conversions

The Board of Revenue for Rajasthan standardizes land area into metric units (Hectares and Square Metres) in all contemporary computerized *Jamabandis*, alongside traditional units (*Bigha*, *Biswa*, *Biswansi*):

$$\begin{aligned}
1\text{ Hectare} &= 10,000\text{ m}^2 \\
1\text{ Pucca Bigha (Kota/Hadoti Region)} &= 2,529.3\text{ m}^2 \ (165\text{ ft} \times 165\text{ ft} = 27,225\text{ sq. ft}) \\
1\text{ Hectare} &\approx 3.95368\text{ Pucca Bigha} \\
1\text{ Bigha} &= 20\text{ Biswa} \ (1\text{ Biswa} \approx 126.465\text{ m}^2) \\
1\text{ Biswa} &= 20\text{ Biswansi} \ (1\text{ Biswansi} \approx 6.323\text{ m}^2)
\end{aligned}$$

LandGuard's database automatically computes and exposes both Metric ($m^2$, Hectares) and Local Revenue ($Bigha-Biswa$) measurements to eliminate buyer confusion during negotiations.

---

### 4. Cadastral Boundary Structure & Khasra Types

In Ranpur village, parcels are divided into:
1. **Original Khasras:** Integer numbers (e.g., Khasra `101`, `102`, `103`).
2. **Subdivided Khasras (*Batankan / Min-Khasras*):** Created when an ancestral parcel is partitioned among co-sharers or partly acquired (e.g., Khasra `102/1`, `102/2`).
3. **Abadi Deh (Residential Settlement):** Village cluster inhabited by original villagers, traditionally un-surveyed under agricultural khasras, now surveyed under SVAMITVA drone mapping.
4. **RIICO Industrial Plots:** Planned industrial subdivisions within the Ranpur Industrial Area (e.g., RIICO Phase-I & Phase-II parcels).
5. **Siway Chak (State Revenue Land):** Uncultivated land vested in the State of Rajasthan.
6. **Charagah (Village Commons):** Communal grazing land protected by Supreme Court precedents (*Jagpal Singh v. State of Punjab*) prohibiting commercial transfer.

---

### 5. Cadastral Demonstration Mode vs. Certified Survey Ingestion

To maintain ethical and legal transparency (Rule 9 & Section 5 of Project Requirements):
- When official vector shapefiles from *Bhunaksha* are not legally loaded or verified, LandGuard explicitly flags boundaries with:
  ```json
  "is_demo_data": true,
  "is_verified": false,
  "disclaimer": "DEMONSTRATION CADASTRE: Geometry rendered for prototype & architectural evaluation. Not a legal survey demarcation."
  ```
- In the UI, demonstration parcels carry an amber/dashed border and a prominent disclaimer banner.
- Real certified boundaries, once ingested via verified GeoJSON/Shapefiles from the District Collectorate / Board of Revenue, have `is_demo_data: false` and `is_verified: true`.
