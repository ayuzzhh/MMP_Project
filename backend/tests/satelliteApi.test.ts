import request from 'supertest';
import app from '../src/index';

export async function runSatelliteApiTests() {
  console.log('\n🧪 Starting Phase 10: Dedicated Satellite Imagery & Spatial API Test Suite...\n');

  // 1. Providers endpoint
  console.log('--- 1. Testing Satellite Imagery Providers List ---');
  const provRes = await request(app).get('/api/satellite/providers');
  if (provRes.status !== 200 || !provRes.body.providers || provRes.body.providers.length < 3) {
    throw new Error(`Failed to get satellite providers: ${JSON.stringify(provRes.body)}`);
  }
  console.log(`[PASS] GET /api/satellite/providers -> Status 200 (Total Providers: ${provRes.body.providers.length})`);
  console.log(`[PASS] Verified Active Provider: ${provRes.body.providers.find((p: any) => p.isActive)?.name}`);

  // 2. Active Tile Configuration
  console.log('\n--- 2. Testing Satellite Tile Configuration ---');
  const tileRes = await request(app).get('/api/satellite/tiles');
  if (tileRes.status !== 200 || !tileRes.body.config || !tileRes.body.config.tile_url) {
    throw new Error(`Failed to get tile config: ${JSON.stringify(tileRes.body)}`);
  }
  console.log(`[PASS] GET /api/satellite/tiles -> Status 200`);
  console.log(`[PASS] Active URL: ${tileRes.body.config.tile_url}`);
  console.log(`[PASS] Resolution: ${tileRes.body.config.resolution}`);

  // 3. Sensor & Acquisition Metadata
  console.log('\n--- 3. Testing Ranpur Village Satellite Metadata ---');
  const metaRes = await request(app).get('/api/satellite/metadata');
  if (metaRes.status !== 200 || !metaRes.body.metadata) {
    throw new Error(`Failed to get satellite metadata: ${JSON.stringify(metaRes.body)}`);
  }
  console.log(`[PASS] GET /api/satellite/metadata -> Status 200`);
  console.log(`[PASS] Sensor: ${metaRes.body.metadata.sensor}`);
  console.log(`[PASS] Ground Resolution: ${metaRes.body.metadata.ground_resolution}`);
  console.log(`[PASS] Cloud Cover: ${metaRes.body.metadata.cloud_cover_percent}%`);

  // 4. Parcel-level Intelligence
  console.log('\n--- 4. Testing Parcel Satellite Intelligence ---');
  const parcelRes = await request(app).get('/api/satellite/parcel/c0000000-0000-0000-0000-000000000101?khasra=101');
  if (parcelRes.status !== 200 || !parcelRes.body.intelligence) {
    throw new Error(`Failed to get parcel intelligence: ${JSON.stringify(parcelRes.body)}`);
  }
  console.log(`[PASS] GET /api/satellite/parcel/:id -> Status 200`);
  console.log(`[PASS] Open Ground: ${parcelRes.body.intelligence.open_ground_percentage}%`);
  console.log(`[PASS] Confidence: ${parcelRes.body.intelligence.satellite_confidence_score}%`);

  // 5. Coordinate Analysis
  console.log('\n--- 5. Testing Coordinate Satellite Analysis ---');
  const coordRes = await request(app)
    .post('/api/satellite/analyze')
    .send({ lat: 25.0485, lng: 75.8360 });
  if (coordRes.status !== 200 || !coordRes.body.result) {
    throw new Error(`Failed coordinate analysis: ${JSON.stringify(coordRes.body)}`);
  }
  console.log(`[PASS] POST /api/satellite/analyze -> Status 200 (Classification: ${coordRes.body.result.detected_classification})`);

  // 6. Admin Provider Config Guard
  console.log('\n--- 6. Testing Admin Protection on Satellite Config ---');
  const unauthRes = await request(app)
    .post('/api/satellite/config')
    .send({ provider_id: 'arcgis-world-imagery' });
  if (unauthRes.status !== 401) {
    throw new Error(`Unauthenticated config change should be 401, got ${unauthRes.status}`);
  }
  console.log(`[PASS] Unauthenticated config update blocked -> Status 401`);

  // Login admin and update
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@landguard.in', password: 'Admin@123' });
  const adminToken = adminLogin.body.token;

  const authUpdate = await request(app)
    .post('/api/satellite/config')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ provider_id: 'arcgis-world-imagery' });
  if (authUpdate.status !== 200) {
    throw new Error(`Admin config update failed: ${JSON.stringify(authUpdate.body)}`);
  }
  console.log(`[PASS] Authorized Admin updated config -> Status 200 (${authUpdate.body.message})`);

  console.log('\n🎉 ALL SATELLITE API & SPATIAL SENSOR TESTS PASSED (100% PASS RATE)!\n');
}

if (require.main === module) {
  runSatelliteApiTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
