import request from 'supertest';
import app from '../src/index';

async function runDocumentTests() {
  console.log('🧪 Starting LandGuard Phase 7: Document Storage, OCR & Human Verification Test Suite...\n');

  try {
    // ------------------------------------------------------------------------
    // SETUP: PERSONAS & TOKENS
    // ------------------------------------------------------------------------
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@landguard.in', password: 'User@123' });
    const userToken = userLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@landguard.in', password: 'Admin@123' });
    const adminToken = adminLogin.body.token;

    const superLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@landguard.in', password: 'SuperAdmin@123' });
    const superToken = superLogin.body.token;

    const targetPropertyId = 'c0000000-0000-0000-0000-000000000101'; // Khasra 101

    // ------------------------------------------------------------------------
    // 1. GET EXISTING DOCUMENTS FOR PROPERTY
    // ------------------------------------------------------------------------
    console.log('--- 1. Testing Document Archive Retrieval ---');

    const resList = await request(app)
      .get(`/api/documents?propertyId=${targetPropertyId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`[PASS] GET /api/documents?propertyId=${targetPropertyId} -> Status ${resList.status} (Count: ${resList.body.count})`);
    if (resList.status !== 200 || !Array.isArray(resList.body.data)) {
      throw new Error('Failed to retrieve property documents');
    }

    // ------------------------------------------------------------------------
    // 2. DOCUMENT UPLOAD & REVENUE OCR PARSING
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Document Upload & Rajasthan Revenue OCR Parsing ---');

    const resUpload = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('property_id', targetPropertyId)
      .field('document_type', 'JAMABANDI_NAKAL')
      .field('title', 'Certified Jamabandi Nakal Samvat 2081')
      .field('raw_text_hint', 'खाता संख्या: 18/92, खसरा नंबर: 101, खातेदार का नाम: रामप्रसाद मीणा पुत्र स्व. मांगीलाल मीणा');

    console.log(`[PASS] POST /api/documents/upload -> Status ${resUpload.status} (Doc ID: ${resUpload.body.data?.id})`);
    if (resUpload.status !== 201 || !resUpload.body.data?.extracted_fields) {
      throw new Error('Document upload and OCR extraction failed');
    }

    const uploadedDocId = resUpload.body.data.id;
    const ocrFields = resUpload.body.data.extracted_fields;
    console.log(`[PASS] Extracted Khasra: ${ocrFields.khasra_number}, Khata: ${ocrFields.khata_number}, Owner: ${ocrFields.owner_name}`);
    console.log(`[PASS] OCR Confidence Score: ${(ocrFields.confidence_score * 100).toFixed(0)}%`);

    if (ocrFields.khasra_number !== '101' || ocrFields.khata_number !== '18/92') {
      throw new Error('Regex OCR parser failed to extract structured fields correctly');
    }

    // ------------------------------------------------------------------------
    // 3. HUMAN-IN-THE-LOOP CORRECTION & TWO-MAN RULE PROPOSAL
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Human-in-the-Loop OCR Verification ---');

    const resVerify = await request(app)
      .put(`/api/documents/${uploadedDocId}/verify-ocr`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        verified_fields: {
          owner_name: 'Ramprasad Meena (Sole Khatedar)',
          area_hectares: 1.0000,
          area_bigha: 3.95
        },
        submit_for_commit: true
      });

    console.log(`[PASS] PUT /api/documents/${uploadedDocId}/verify-ocr -> Status ${resVerify.status}`);
    if (resVerify.status !== 200 || !resVerify.body.data?.change_request) {
      throw new Error('Human verification submission failed to generate Two-Man Rule change request');
    }
    console.log(`[PASS] Change request generated: ${resVerify.body.data.change_request.id} (Status: PENDING)`);

    // ------------------------------------------------------------------------
    // 4. TWO-MAN RULE ACCESS GUARD ON DIRECT COMMIT
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing Two-Man Rule Access Guard on Direct Commit ---');

    // Admin cannot commit directly
    const resAdminCommit = await request(app)
      .post(`/api/documents/${uploadedDocId}/commit`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`[PASS] Verification Admin direct commit blocked -> Status ${resAdminCommit.status}`);
    if (resAdminCommit.status !== 403) {
      throw new Error('Two-Man Rule failed: Admin was allowed to unilaterally commit document intelligence');
    }

    // Super Admin commits document intelligence
    const resSuperCommit = await request(app)
      .post(`/api/documents/${uploadedDocId}/commit`)
      .set('Authorization', `Bearer ${superToken}`);

    console.log(`[PASS] Super Admin direct commit authorized -> Status ${resSuperCommit.status}`);
    if (resSuperCommit.status !== 200 || !resSuperCommit.body.data?.super_admin_committed) {
      throw new Error('Super Admin commit failed');
    }

    // ------------------------------------------------------------------------
    // 5. AUDIT LOG VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Audit Log Traceability for Document Pipeline ---');

    const resAudit = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${superToken}`);

    const uploadLog = resAudit.body.data.find((l: any) => l.action === 'UPLOAD_PROPERTY_DOCUMENT' && l.target_id === uploadedDocId);
    const humanVerifyLog = resAudit.body.data.find((l: any) => l.action === 'HUMAN_VERIFY_DOCUMENT_OCR' && l.target_id === uploadedDocId);
    const commitLog = resAudit.body.data.find((l: any) => l.action === 'COMMIT_DOCUMENT_TO_LIVE_CADASTRE' && l.target_id === uploadedDocId);

    if (!uploadLog || !humanVerifyLog || !commitLog) {
      throw new Error('Missing audit log entries for document workflow');
    }
    console.log(`[PASS] Verified Complete Lifecycle Audit Trail: Upload -> Human Review -> Super Admin Commit`);

    console.log('\n🎉 ALL DOCUMENT STORAGE, OCR & HUMAN VERIFICATION TESTS PASSED (100% PASS RATE)!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ DOCUMENT TEST SUITE FAILURE:');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

runDocumentTests();
