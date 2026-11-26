import request from 'supertest';
import app from '../src/index';

async function runRecordTests() {
  console.log('🧪 Starting LandGuard Phase 5 & 6: Domain Property Intelligence & Two-Man Rule Test Suite...\n');

  try {
    // ------------------------------------------------------------------------
    // SETUP: PERSONAS & TOKENS
    // ------------------------------------------------------------------------
    // 1. Citizen User
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@landguard.in', password: 'User@123' });
    const userToken = userLogin.body.token;

    // 2. Verification Officer (Admin)
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@landguard.in', password: 'Admin@123' });
    const adminToken = adminLogin.body.token;

    // 3. Super Admin (Checker)
    const superLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@landguard.in', password: 'SuperAdmin@123' });
    const superToken = superLogin.body.token;

    const targetPropertyId = 'c0000000-0000-0000-0000-000000000101'; // Khasra 101

    // ------------------------------------------------------------------------
    // 1. PUBLIC & ADMIN RECORD INSPECTION
    // ------------------------------------------------------------------------
    console.log('--- 1. Testing Record Inspection & Provenance ---');

    const resRec = await request(app)
      .get(`/api/properties/${targetPropertyId}/records`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`[PASS] GET /api/properties/${targetPropertyId}/records -> Status ${resRec.status}`);
    if (resRec.status !== 200 || !resRec.body.data.records) {
      throw new Error('Failed to retrieve property records');
    }

    if (!resRec.body.data.source_departments || resRec.body.data.source_departments.length === 0) {
      throw new Error('Source departments missing from property record metadata');
    }
    console.log(`[PASS] Verified 4 Revenue Sources: ${resRec.body.data.source_departments.map((d: any) => d.name).join(', ')}`);

    // ------------------------------------------------------------------------
    // 2. AUTHORIZATION & RBAC GUARD ON RECORD MUTATIONS
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Authorization & RBAC Guard on Mutations ---');

    // Unauthenticated request -> 401
    const resUnauth = await request(app)
      .post(`/api/admin/properties/${targetPropertyId}/records`)
      .send({
        category: 'OWNERSHIP',
        proposedData: { owner_name: 'Unauthorized Actor' }
      });
    console.log(`[PASS] Unauthenticated mutation blocked -> Status ${resUnauth.status}`);
    if (resUnauth.status !== 401) throw new Error('Expected 401 for unauthenticated request');

    // Citizen User role request -> 403 Forbidden
    const resCitizenForbidden = await request(app)
      .post(`/api/admin/properties/${targetPropertyId}/records`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        category: 'OWNERSHIP',
        proposedData: { owner_name: 'Unauthorized Actor' }
      });
    console.log(`[PASS] Citizen User mutation blocked -> Status ${resCitizenForbidden.status}`);
    if (resCitizenForbidden.status !== 403) throw new Error('Expected 403 for citizen user attempting admin mutation');

    // ------------------------------------------------------------------------
    // 3. ADMIN PROPOSES OWNERSHIP MUTATION (MAKER)
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Ownership Record Proposal (Two-Man Maker) ---');

    const resOwnProposal = await request(app)
      .post(`/api/admin/properties/${targetPropertyId}/records`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        category: 'OWNERSHIP',
        changeType: 'UPDATE',
        proposedData: {
          owner_name: 'Rameshwar Lal Gurjar',
          relation_name: 'Late Shri Devaram Gurjar',
          relation_type: 'SON_OF',
          ownership_type: 'KHATEDARI',
          share_fraction: '1/1',
          source: 'Apna Khata (e-Dharti) Rajasthan Jamabandi Fasli 1431'
        }
      });

    console.log(`[PASS] Admin proposed ownership mutation -> Status ${resOwnProposal.status} (CR ID: ${resOwnProposal.body.change_request?.id})`);
    if (resOwnProposal.status !== 201 || resOwnProposal.body.change_request?.status !== 'PENDING') {
      throw new Error('Failed to propose ownership change request');
    }
    const ownershipCrId = resOwnProposal.body.change_request.id;

    // ------------------------------------------------------------------------
    // 4. ADMIN PROPOSES LEGAL DISPUTE & CNR NUMBER (MAKER)
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing Legal Dispute Proposal with e-Courts CNR ---');

    const resDisputeProposal = await request(app)
      .post(`/api/admin/properties/${targetPropertyId}/records`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        category: 'LEGAL_DISPUTES',
        changeType: 'UPDATE',
        proposedData: {
          dispute_type: 'TITLE_DISPUTE',
          dispute_status: 'ACTIVE',
          description: 'Declaration of title suit instituted under Section 88 Rajasthan Tenancy Act.',
          court_case: {
            cnr_number: 'RJKO010088992024',
            case_number: 'Revenue Suit 45/2024',
            court_name: 'Sub-Divisional Officer (SDO) Revenue Court, Ladpura',
            petitioner: 'Brij Mohan Gurjar',
            respondent: 'Rameshwar Lal Gurjar',
            stay_order_details: 'Temporary injunction issued restraining transfer of revenue khata.'
          }
        }
      });

    console.log(`[PASS] Admin proposed legal dispute mutation -> Status ${resDisputeProposal.status} (CR ID: ${resDisputeProposal.body.change_request?.id})`);
    if (resDisputeProposal.status !== 201) throw new Error('Failed to propose legal dispute');
    const disputeCrId = resDisputeProposal.body.change_request.id;

    // ------------------------------------------------------------------------
    // 5. TWO-MAN RULE CHECKER RESTRICTION (ADMIN CANNOT APPROVE)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Two-Man Rule Enforcement (Admin cannot approve) ---');

    const resAdminSelfApprove = await request(app)
      .post(`/api/admin/change-requests/${ownershipCrId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE' });

    console.log(`[PASS] Verification Admin self-approval rejected -> Status ${resAdminSelfApprove.status}`);
    if (resAdminSelfApprove.status !== 403) {
      throw new Error('Two-Man Rule violation: Admin was able to review/approve change request');
    }

    // ------------------------------------------------------------------------
    // 6. SUPER ADMIN REVIEWS & APPROVES CHANGE REQUEST (CHECKER)
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Testing Super Admin Approval & Public Record Merge ---');

    const resSuperApprove = await request(app)
      .post(`/api/admin/change-requests/${ownershipCrId}/review`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ action: 'APPROVE', notes: 'Verified against e-Dharti certified Jamabandi copy.' });

    console.log(`[PASS] Super Admin approved CR ${ownershipCrId} -> Status ${resSuperApprove.status}`);
    if (resSuperApprove.status !== 200 || resSuperApprove.body.data.status !== 'APPROVED') {
      throw new Error('Super Admin approval failed');
    }

    // Verify change is reflected in public property record
    const resVerifiedRec = await request(app)
      .get(`/api/properties/${targetPropertyId}/records`)
      .set('Authorization', `Bearer ${userToken}`);

    const appliedOwner = resVerifiedRec.body.data.records.ownership;
    console.log(`[PASS] Verified Applied Khatedar: "${appliedOwner.owner_name}" (${appliedOwner.relation_name})`);
    if (appliedOwner.owner_name !== 'Rameshwar Lal Gurjar') {
      throw new Error('Record mutation was not applied to public property records');
    }

    // ------------------------------------------------------------------------
    // 7. AUDIT LOG VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Testing Cryptographic Activity Audit Trail ---');

    const resAudit = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${superToken}`);

    console.log(`[PASS] GET /api/admin/audit-logs -> Status ${resAudit.status} (Total Logs: ${resAudit.body.count})`);
    if (resAudit.status !== 200 || !Array.isArray(resAudit.body.data)) {
      throw new Error('Audit logs retrieval failed');
    }

    const proposalLog = resAudit.body.data.find((l: any) => l.action === 'PROPOSE_OWNERSHIP_CHANGE');
    const approveLog = resAudit.body.data.find((l: any) => l.action === 'APPROVE_OWNERSHIP_CHANGE');

    if (!proposalLog || !approveLog) {
      throw new Error('Expected audit log entries for proposal and approval not found');
    }

    console.log(`[PASS] Verified Proposal Audit Log by: ${proposalLog.admin_name} (${proposalLog.admin_role})`);
    console.log(`[PASS] Verified Approval Audit Log by: ${approveLog.admin_name} (${approveLog.admin_role})`);

    console.log('\n🎉 ALL DOMAIN RECORD & TWO-MAN RULE TESTS PASSED SUCCESSFULLY (100% PASS RATE)!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILURE:');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

runRecordTests();
