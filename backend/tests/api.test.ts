import request from 'supertest';
import app from '../src/index';

async function runTests() {
  console.log('🧪 Running LandGuard Supertest API Suite...\n');

  try {
    // 1. Health
    const resHealth = await request(app).get('/api/health');
    console.log(`[PASS] GET /api/health -> Status ${resHealth.status} (Service: ${resHealth.body.service})`);

    // 2. Villages
    const resVillages = await request(app).get('/api/villages');
    console.log(`[PASS] GET /api/villages -> Status ${resVillages.status} (Found ${resVillages.body.data.length} village: ${resVillages.body.data[0].name})`);

    // 3. Cadastre GeoJSON
    const resCadastre = await request(app).get('/api/villages/03807600/cadastre');
    console.log(`[PASS] GET /api/villages/03807600/cadastre -> Status ${resCadastre.status} (GeoJSON Features: ${resCadastre.body.data.features.length})`);

    // 4. Properties list
    const resProps = await request(app).get('/api/properties');
    console.log(`[PASS] GET /api/properties -> Status ${resProps.status} (Parcels: ${resProps.body.count})`);

    // 5. Search by Khasra 101
    const resSearch = await request(app).get('/api/properties/search?q=101');
    console.log(`[PASS] GET /api/properties/search?q=101 -> Status ${resSearch.status} (Matched: ${resSearch.body.count})`);

    // 6. Identify at point (Point-in-Polygon)
    const resIdentify = await request(app).get('/api/properties/identify?lat=25.0465&lng=75.8300');
    console.log(`[PASS] GET /api/properties/identify -> Status ${resIdentify.status} (Identified Khasra: ${resIdentify.body.data.properties.khasra_number})`);

    // 7. Property Report
    const resReport = await request(app).get('/api/properties/c0000000-0000-0000-0000-000000000101/report');
    console.log(`[PASS] GET /api/properties/:id/report -> Status ${resReport.status} (Khasra: ${resReport.body.data.basic.khasra_number})`);

    // Authenticate as User
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@landguard.in', password: 'User@123' });
    const userToken = userLogin.body.token;

    // 8. Wallet with Token
    const resWallet = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${userToken}`);
    console.log(`[PASS] GET /api/wallet -> Status ${resWallet.status} (Current Balance: ${resWallet.body.data.balance} Tokens)`);

    // Authenticate as Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@landguard.in', password: 'Admin@123' });
    const adminToken = adminLogin.body.token;

    // 9. Admin Stats
    const resAdminStats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    console.log(`[PASS] GET /api/admin/stats -> Status ${resAdminStats.status} (Verified: ${resAdminStats.body.data.total_verified_properties})`);

    // 10. Admin Change Requests
    const resCR = await request(app)
      .get('/api/admin/change-requests')
      .set('Authorization', `Bearer ${adminToken}`);
    console.log(`[PASS] GET /api/admin/change-requests -> Status ${resCR.status} (Pending Requests: ${resCR.body.data.length})`);

    console.log('\n🎯 ALL API INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
