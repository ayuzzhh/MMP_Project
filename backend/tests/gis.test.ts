import request from 'supertest';
import app from '../src/index';

async function runGisTests() {
  console.log('🧪 Starting LandGuard Phase 3 & 4: GIS & Interactive Cadastre Test Suite...\n');

  try {
    // ------------------------------------------------------------------------
    // 1. VILLAGE CADASTRE & SPATIAL GEOJSON
    // ------------------------------------------------------------------------
    console.log('--- 1. Testing Cadastre GeoJSON & Category Filtering ---');

    // 1.1 All cadastre features
    const resAll = await request(app).get('/api/villages/03807600/cadastre');
    console.log(`[PASS] GET /api/villages/03807600/cadastre -> Status ${resAll.status} (Total Features: ${resAll.body.data.features.length})`);
    if (resAll.status !== 200 || resAll.body.data.type !== 'FeatureCollection') throw new Error('Expected FeatureCollection');

    // 1.2 Centroid presence verification
    const parcel101 = resAll.body.data.features.find((f: any) => f.properties.khasra_number === '101');
    if (!parcel101 || !parcel101.properties.centroid) throw new Error('Centroid missing from parcel GeoJSON');
    console.log(`[PASS] Verified Parcel 101 Centroid: [Lng: ${parcel101.properties.centroid[0]}, Lat: ${parcel101.properties.centroid[1]}]`);

    // 1.3 Category Filtering (Agricultural only)
    const resAgri = await request(app).get('/api/villages/03807600/cadastre?category=AGRICULTURAL_IRRIGATED');
    const agriParcels = resAgri.body.data.features.filter((f: any) => f.properties.land_classification === 'AGRICULTURAL_IRRIGATED');
    console.log(`[PASS] Filter by AGRICULTURAL_IRRIGATED -> Found ${agriParcels.length} parcels`);
    if (agriParcels.length === 0) throw new Error('Category filter failed');

    // ------------------------------------------------------------------------
    // 2. POINT-IN-POLYGON IDENTIFICATION & SPATIAL SEARCH
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Point-in-Polygon & Khasra Search ---');

    // 2.1 Inside Khasra 101 coordinates (approx 25.0465, 75.8300)
    const resIdentify = await request(app).get('/api/properties/identify?lat=25.0465&lng=75.8300');
    console.log(`[PASS] Point-in-Polygon inside Khasra 101 -> Status ${resIdentify.status} (Identified Khasra: ${resIdentify.body.data.properties.khasra_number})`);
    if (resIdentify.status !== 200 || resIdentify.body.data.properties.khasra_number !== '101') throw new Error('Point-in-polygon identification failed');

    // 2.2 Point outside all parcels
    const resOutside = await request(app).get('/api/properties/identify?lat=25.0100&lng=75.8100');
    console.log(`[PASS] Point outside parcels -> Status ${resOutside.status} (Message: ${resOutside.body.message})`);
    if (resOutside.status !== 404) throw new Error('Expected 404 for point outside parcels');

    // 2.3 Fractional Khasra search (102/1)
    const resSearchFraction = await request(app).get('/api/properties/search?q=102/1');
    console.log(`[PASS] Search by fractional Khasra 102/1 -> Status ${resSearchFraction.status} (Matched: ${resSearchFraction.body.count})`);
    if (resSearchFraction.status !== 200 || resSearchFraction.body.count === 0) throw new Error('Fractional Khasra search failed');

    // ------------------------------------------------------------------------
    // 3. ADMIN CADASTRE EDITING & TWO-MAN RULE BOUNDARY PROPOSALS
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Admin Cadastre Mutation & Two-Man Rule Guard ---');

    // Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@landguard.in', password: 'Admin@123' });
    const adminToken = adminLogin.body.token;

    // Authenticate Super Admin
    const superLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@landguard.in', password: 'SuperAdmin@123' });
    const superToken = superLogin.body.token;

    // 3.1 Propose invalid geometry (open ring) -> Should return 400 Bad Request
    const resInvalidGeom = await request(app)
      .put('/api/admin/properties/c0000000-0000-0000-0000-000000000101/boundary')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        coordinates: [
          [75.8280, 25.0450],
          [75.8320, 25.0450],
          [75.8320, 25.0480]
          // Missing 4th closing point!
        ]
      });
    console.log(`[PASS] Reject open polygon ring -> Status ${resInvalidGeom.status} (Error: ${resInvalidGeom.body.error})`);
    if (resInvalidGeom.status !== 400) throw new Error('Expected 400 for unclosed polygon ring');

    // 3.2 Propose out-of-bounds coordinates -> Should return 400 Bad Request
    const resOutBounds = await request(app)
      .put('/api/admin/properties/c0000000-0000-0000-0000-000000000101/boundary')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        coordinates: [
          [70.0000, 20.0000],
          [70.0100, 20.0000],
          [70.0100, 20.0100],
          [70.0000, 20.0000]
        ]
      });
    console.log(`[PASS] Reject out-of-bounds coordinate vertex -> Status ${resOutBounds.status} (Error: ${resOutBounds.body.error})`);
    if (resOutBounds.status !== 400) throw new Error('Expected 400 for out-of-bounds coordinates');

    // 3.3 Valid boundary modification submitted by Verification Admin
    const validNewCoords = [
      [75.8280, 25.0450],
      [75.8325, 25.0450],
      [75.8325, 25.0485],
      [75.8280, 25.0485],
      [75.8280, 25.0450]
    ];

    const resValidProp = await request(app)
      .put('/api/admin/properties/c0000000-0000-0000-0000-000000000101/boundary')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        coordinates: validNewCoords,
        justification: 'Surveyed boundary realignment from certified Bhunaksha Ladpura sheet.'
      });
    console.log(`[PASS] Admin submitted boundary proposal -> Status ${resValidProp.status} (Request ID: ${resValidProp.body.change_request.id}, Status: ${resValidProp.body.change_request.status})`);
    if (resValidProp.status !== 201 || resValidProp.body.change_request.status !== 'PENDING') throw new Error('Boundary proposal failed');

    const changeRequestId = resValidProp.body.change_request.id;

    // 3.4 Super Admin approves boundary change under Two-Man Rule
    const resApprove = await request(app)
      .post(`/api/admin/change-requests/${changeRequestId}/review`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ action: 'APPROVE', notes: 'Verified against Rajasthan Board of Revenue cadastral benchmarks.' });
    console.log(`[PASS] Super Admin approved boundary modification -> Status ${resApprove.status} (New Status: ${resApprove.body.data.status})`);
    if (resApprove.status !== 200 || resApprove.body.data.status !== 'APPROVED') throw new Error('Super Admin boundary approval failed');

    console.log('\n🎯 ALL GIS & CADASTRAL SPATIAL TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runGisTests();
