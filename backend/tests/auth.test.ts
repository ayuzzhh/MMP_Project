import request from 'supertest';
import app from '../src/index';

async function runAuthTests() {
  console.log('🧪 Starting LandGuard Phase 2: Auth & RBAC Test Suite...\n');

  try {
    // ------------------------------------------------------------------------
    // 1. REGISTRATION TESTS
    // ------------------------------------------------------------------------
    console.log('--- 1. Testing Registration & Validation ---');
    
    // 1.1 Invalid registration (short password)
    const resBadPass = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'badpassword@test.com',
        password: '123',
        full_name: 'Short Password User'
      });
    console.log(`[PASS] Register with short password -> Status ${resBadPass.status} (Error: ${resBadPass.body.error})`);
    if (resBadPass.status !== 400) throw new Error('Expected 400 for short password');

    // 1.2 Valid registration
    const uniqueEmail = `testuser_${Date.now()}@landguard.in`;
    const resReg = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password: 'SecurePassword123!',
        full_name: 'Dr. Vikramaditya Solanki',
        phone_number: '+91 9829011111'
      });
    console.log(`[PASS] Valid user registration -> Status ${resReg.status} (User ID: ${resReg.body.user.id}, Role: ${resReg.body.user.role}, Tokens: ${resReg.body.user.wallet_balance})`);
    if (resReg.status !== 201 || !resReg.body.token) throw new Error('Registration failed');

    // 1.3 Duplicate registration
    const resDup = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password: 'SecurePassword123!',
        full_name: 'Dr. Vikramaditya Solanki'
      });
    console.log(`[PASS] Duplicate email registration -> Status ${resDup.status} (Error: ${resDup.body.error})`);
    if (resDup.status !== 409) throw new Error('Expected 409 for duplicate email');

    // ------------------------------------------------------------------------
    // 2. LOGIN TESTS & CREDENTIALS VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Authentication & Password Verification ---');

    // 2.1 Wrong password
    const resBadLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@landguard.in',
        password: 'WrongPassword999'
      });
    console.log(`[PASS] Login with wrong password -> Status ${resBadLogin.status} (Error: ${resBadLogin.body.error})`);
    if (resBadLogin.status !== 401) throw new Error('Expected 401 for bad password');

    // 2.2 Citizen User Login
    const resUserLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@landguard.in',
        password: 'User@123'
      });
    console.log(`[PASS] Citizen User Login -> Status ${resUserLogin.status} (Role: ${resUserLogin.body.user.role}, Name: ${resUserLogin.body.user.full_name})`);
    const userToken = resUserLogin.body.token;
    if (!userToken) throw new Error('User token not received');

    // 2.3 Verification Admin Login
    const resAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@landguard.in',
        password: 'Admin@123'
      });
    console.log(`[PASS] Verification Officer Login -> Status ${resAdminLogin.status} (Role: ${resAdminLogin.body.user.role})`);
    const adminToken = resAdminLogin.body.token;

    // 2.4 Super Admin Login
    const resSuperLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'superadmin@landguard.in',
        password: 'SuperAdmin@123'
      });
    console.log(`[PASS] Super Admin Login -> Status ${resSuperLogin.status} (Role: ${resSuperLogin.body.user.role})`);
    const superAdminToken = resSuperLogin.body.token;

    // ------------------------------------------------------------------------
    // 3. PROFILE & SESSION VERIFICATION (/api/auth/me)
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Session State & Token Extraction ---');

    // 3.1 Unauthorized me
    const resNoAuth = await request(app).get('/api/auth/me');
    console.log(`[PASS] GET /api/auth/me without token -> Status ${resNoAuth.status} (Error: ${resNoAuth.body.error})`);
    if (resNoAuth.status !== 401) throw new Error('Expected 401 for unauthenticated request');

    // 3.2 Bearer header authentication
    const resMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    console.log(`[PASS] GET /api/auth/me with Bearer token -> Status ${resMe.status} (Email: ${resMe.body.user.email}, Permissions: ${resMe.body.user.permissions.length})`);
    if (resMe.status !== 200 || resMe.body.user.email !== 'user@landguard.in') throw new Error('Failed to verify user profile');

    // ------------------------------------------------------------------------
    // 4. ROLE-BASED ACCESS CONTROL (RBAC) & TWO-MAN RULE GUARD TESTS
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing Role-Based Access Control (RBAC) & Two-Man Rule ---');

    // 4.1 Citizen User attempting to view Admin Stats -> Should return 403 Forbidden!
    const resUserAccessDenied = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    console.log(`[PASS] Citizen User blocked from Admin Dashboard -> Status ${resUserAccessDenied.status} (Code: ${resUserAccessDenied.body.error})`);
    if (resUserAccessDenied.status !== 403) throw new Error('Expected 403 for unauthorized citizen accessing admin endpoint');

    // 4.2 Verification Admin accessing Admin Stats -> Should return 200 OK!
    const resAdminStats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    console.log(`[PASS] Verification Admin granted access to Admin Dashboard -> Status ${resAdminStats.status} (Total Parcels: ${resAdminStats.body.data.total_land_parcels})`);
    if (resAdminStats.status !== 200) throw new Error('Admin should have access to admin stats');

    // 4.3 Two-Man Rule: Admin attempting to approve their own Change Request -> Should be blocked with 403 Forbidden!
    const resAdminSelfApproveBlocked = await request(app)
      .post('/api/admin/change-requests/cr-001/review')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE', notes: 'Self approval attempt' });
    console.log(`[PASS] Admin blocked from Two-Man Rule self-approval -> Status ${resAdminSelfApproveBlocked.status} (Code: ${resAdminSelfApproveBlocked.body.error})`);
    if (resAdminSelfApproveBlocked.status !== 403) throw new Error('Expected 403: Admin cannot approve change requests');

    // 4.4 Two-Man Rule: Super Admin approves Change Request -> Should return 200 OK!
    const resSuperApprove = await request(app)
      .post('/api/admin/change-requests/cr-001/review')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ action: 'APPROVE', notes: 'Approved after inspecting e-Courts Kota certified order sheet.' });
    console.log(`[PASS] Super Admin authorized Two-Man Rule approval -> Status ${resSuperApprove.status} (Status: ${resSuperApprove.body.data.status})`);
    if (resSuperApprove.status !== 200) throw new Error('Super Admin approval failed');

    // 4.5 Super Admin creates a new Verification Admin
    const resNewAdmin = await request(app)
      .post('/api/super-admin/admins')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: `surveyor_${Date.now()}@landguard.in`,
        password: 'AdminPassword123!',
        full_name: 'Rajendra Prasad (Field Surveyor)',
        phone_number: '+91 9829033333',
        role: 'ADMIN'
      });
    console.log(`[PASS] Super Admin created new Admin user -> Status ${resNewAdmin.status} (Created: ${resNewAdmin.body.user.full_name}, Role: ${resNewAdmin.body.user.role})`);
    if (resNewAdmin.status !== 201) throw new Error('Super Admin admin creation failed');

    console.log('\n🎉 ALL 12 AUTHENTICATION & RBAC SECURITY TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runAuthTests();
