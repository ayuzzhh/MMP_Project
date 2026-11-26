import request from 'supertest';
import app from '../src/index';

export async function runSmartLandIdentificationTests(): Promise<boolean> {
  console.log('\n🧪 Starting Phase 9: Smart Land Identification & Admin Reauth Test Suite...\n');
  let allPassed = true;

  try {
    // 1. Authenticate as Verification Admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@landguard.in', password: 'Admin@123' });
    const adminToken = adminLoginRes.body.token;

    // 2. Test Overview Statistics
    console.log('--- 1. Testing Land Analysis Overview Statistics ---');
    const overviewRes = await request(app).get('/api/land-analysis/overview');
    if (overviewRes.status === 200 && overviewRes.body.data.total_mapped_parcels > 0) {
      console.log(`[PASS] GET /api/land-analysis/overview -> Status 200 (Total Mapped: ${overviewRes.body.data.total_mapped_parcels})`);
      console.log(`[PASS] Detected Buildings: ${overviewRes.body.data.buildings_detected}, Potentially Vacant: ${overviewRes.body.data.potentially_vacant}`);
    } else {
      console.error(`[FAIL] GET /api/land-analysis/overview failed: ${overviewRes.status}`);
      allPassed = false;
    }

    // 3. Test Satellite Analysis for Specific Parcel
    console.log('\n--- 2. Testing Property Satellite Analysis Retrieval ---');
    const propertyId = 'c0000000-0000-0000-0000-000000000101';
    const analysisRes = await request(app).get(`/api/land-analysis/${propertyId}`);
    if (analysisRes.status === 200 && analysisRes.body.data.analysis) {
      console.log(`[PASS] GET /api/land-analysis/:id -> Status 200 (Detected: ${analysisRes.body.data.analysis.detected_classification})`);
      console.log(`[PASS] Confidence Score: ${analysisRes.body.data.analysis.confidence_score}%`);
      console.log(`[PASS] Verified Legal Disclaimer Present: "${analysisRes.body.data.disclaimer.slice(0, 45)}..."`);
    } else {
      console.error(`[FAIL] GET /api/land-analysis/:id failed: ${analysisRes.status}`);
      allPassed = false;
    }

    // 4. Test Triggering Satellite Scan (Admin Only)
    console.log('\n--- 3. Testing Satellite Scan Trigger ---');
    const scanRes = await request(app)
      .post(`/api/land-analysis/${propertyId}/scan`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ propertyCode: 'RJ-KOT-RAN-101', khasraNumber: '101' });
    if (scanRes.status === 201 && scanRes.body.data.analysis_status) {
      console.log(`[PASS] POST /api/land-analysis/:id/scan -> Status 201 (Status: ${scanRes.body.data.analysis_status})`);
    } else {
      console.error(`[FAIL] POST /api/land-analysis/:id/scan failed: ${scanRes.status}`);
      allPassed = false;
    }

    // 5. Test Admin Drawing Tools (Saving & Deleting Markings)
    console.log('\n--- 4. Testing Surveyor Polygon Markings ---');
    const markRes = await request(app)
      .post('/api/land-analysis/markings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        property_id: propertyId,
        marking_type: 'VACANT_POLYGON',
        coordinates: [[[75.83, 25.04], [75.84, 25.04], [75.84, 25.05], [75.83, 25.05], [75.83, 25.04]]],
        description: 'Barren plateau area identified with no physical foundation structures.'
      });
    const markingId = markRes.body.data?.id;
    if (markRes.status === 201 && markingId) {
      console.log(`[PASS] POST /api/land-analysis/markings -> Status 201 (Marking ID: ${markingId})`);
    } else {
      console.error(`[FAIL] POST /api/land-analysis/markings failed: ${markRes.status}`);
      allPassed = false;
    }

    const getMarksRes = await request(app).get('/api/land-analysis/markings');
    if (getMarksRes.status === 200 && getMarksRes.body.count > 0) {
      console.log(`[PASS] GET /api/land-analysis/markings -> Status 200 (Total Active Markings: ${getMarksRes.body.count})`);
    } else {
      console.error(`[FAIL] GET /api/land-analysis/markings failed: ${getMarksRes.status}`);
      allPassed = false;
    }

    // 6. Test Admin Password Reauthentication
    console.log('\n--- 5. Testing Admin Reauthentication & Sensitive Confirmation ---');
    const badReauthRes = await request(app)
      .post('/api/admin/reauth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: 'WrongPassword' });
    if (badReauthRes.status === 403) {
      console.log(`[PASS] Reauthentication rejected on incorrect password -> Status 403`);
    } else {
      console.error(`[FAIL] Reauth failed to reject bad password: ${badReauthRes.status}`);
      allPassed = false;
    }

    const goodReauthRes = await request(app)
      .post('/api/admin/reauth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: 'Admin@123' });
    if (goodReauthRes.status === 200 && goodReauthRes.body.confirmed_at) {
      console.log(`[PASS] Reauthentication approved with valid password -> Status 200`);
    } else {
      console.error(`[FAIL] Reauth failed on valid password: ${goodReauthRes.status}`);
      allPassed = false;
    }

    // 7. Test Admin Land Classification Confirmation with Reauth Protection
    console.log('\n--- 6. Testing Admin Land Classification Confirmation ---');
    const classifyRes = await request(app)
      .post('/api/land-analysis/classify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        property_id: propertyId,
        classification: 'POTENTIALLY_VACANT_CONFIRMED',
        detection_method: 'MANUAL_SURVEYOR',
        notes: 'Admin ground-truth checked with satellite pass',
        password: 'Admin@123'
      });
    if (classifyRes.status === 200 && classifyRes.body.data.admin_status === 'CONFIRMED') {
      console.log(`[PASS] POST /api/land-analysis/classify -> Status 200 (Confirmed Classification: ${classifyRes.body.data.classification})`);
    } else {
      console.error(`[FAIL] POST /api/land-analysis/classify failed: ${classifyRes.status}`);
      allPassed = false;
    }

    // Cleanup marking
    if (markingId) {
      const delRes = await request(app)
        .delete(`/api/land-analysis/markings/${markingId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      if (delRes.status === 200) {
        console.log(`[PASS] DELETE /api/land-analysis/markings/:id -> Status 200 (Cleaned up test marking)`);
      }
    }

    if (allPassed) {
      console.log('\n🎉 ALL SMART LAND IDENTIFICATION & ADMIN REAUTH TESTS PASSED (100% PASS RATE)!\n');
    }
  } catch (err: any) {
    console.error('❌ Test suite encountered unhandled error:', err.message);
    allPassed = false;
  }

  return allPassed;
}

if (require.main === module) {
  runSmartLandIdentificationTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}
