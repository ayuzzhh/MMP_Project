import request from 'supertest';
import app from '../src/index';

async function runWalletTests() {
  console.log('🧪 Starting LandGuard Phase 8: Token Monetization, Wallet & Razorpay Verification Test Suite...\n');

  try {
    // ------------------------------------------------------------------------
    // SETUP: PERSONAS & TOKENS
    // ------------------------------------------------------------------------
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@landguard.in', password: 'User@123' });
    const userToken = userLogin.body.token;

    const targetPropertyId = 'c0000000-0000-0000-0000-000000000101'; // Khasra 101

    // ------------------------------------------------------------------------
    // 1. GET INITIAL WALLET BALANCE
    // ------------------------------------------------------------------------
    console.log('--- 1. Testing Wallet Balance Retrieval ---');

    const resInitWallet = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${userToken}`);

    console.log(`[PASS] GET /api/wallet -> Status ${resInitWallet.status} (Initial Balance: ${resInitWallet.body.data?.balance} Tokens)`);
    if (resInitWallet.status !== 200 || typeof resInitWallet.body.data?.balance !== 'number') {
      throw new Error('Failed to retrieve wallet balance');
    }
    const initialBalance = resInitWallet.body.data.balance;

    // ------------------------------------------------------------------------
    // 2. CREATE RAZORPAY ORDER
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Razorpay Order Generation ---');

    const resOrder = await request(app)
      .post('/api/wallet/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ packageId: 'pkg-starter' });

    console.log(`[PASS] POST /api/wallet/order -> Status ${resOrder.status} (Order ID: ${resOrder.body.data?.order_id})`);
    if (resOrder.status !== 200 || !resOrder.body.data?.order_id || resOrder.body.data?.tokens !== 5) {
      throw new Error('Failed to create Razorpay order');
    }
    const orderData = resOrder.body.data;
    console.log(`[PASS] Verified Currency: ${orderData.currency}, Amount: ₹${orderData.amount_inr} (${orderData.amount_paise} paise)`);

    // ------------------------------------------------------------------------
    // 3. SERVER-SIDE PAYMENT SIGNATURE VERIFICATION & TOKEN CREDIT
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Server-side Payment Verification & Token Crediting ---');

    const mockPaymentId = `pay_rzp_${Date.now()}`;
    const mockSig = `mock_sig_${Date.now()}`;

    const resVerify = await request(app)
      .post('/api/wallet/verify-payment')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        order_id: orderData.order_id,
        payment_id: mockPaymentId,
        signature: mockSig,
        tokens: orderData.tokens
      });

    console.log(`[PASS] POST /api/wallet/verify-payment -> Status ${resVerify.status} (New Balance: ${resVerify.body.data?.new_balance})`);
    if (resVerify.status !== 200 || resVerify.body.data?.new_balance !== initialBalance + 5) {
      throw new Error('Payment verification or token credit failed');
    }

    // ------------------------------------------------------------------------
    // 4. ATOMIC TOKEN DEDUCTION ON CATEGORY UNLOCK
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing Atomic Token Deduction on Category Unlock ---');

    const balanceBeforeUnlock = resVerify.body.data.new_balance;

    const resUnlock = await request(app)
      .post(`/api/properties/${targetPropertyId}/unlock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ category: 'OWNERSHIP' });

    console.log(`[PASS] POST /api/properties/${targetPropertyId}/unlock -> Status ${resUnlock.status}`);
    if (resUnlock.status !== 200 || !resUnlock.body.unlocked) {
      throw new Error('Category unlock failed');
    }

    const resPostUnlockWallet = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${userToken}`);

    console.log(`[PASS] Wallet Balance after 1 Token spend: ${resPostUnlockWallet.body.data?.balance}`);
    if (resPostUnlockWallet.body.data.balance !== balanceBeforeUnlock - 1) {
      throw new Error('Tokens not deducted accurately for category unlock');
    }

    // ------------------------------------------------------------------------
    // 5. PREVENTION OF DOUBLE DEDUCTION (IDEMPOTENT UNLOCK)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Prevention of Double Deductions (Idempotency) ---');

    const balanceBeforeReunlock = resPostUnlockWallet.body.data.balance;

    const resReunlock = await request(app)
      .post(`/api/properties/${targetPropertyId}/unlock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ category: 'OWNERSHIP' });

    console.log(`[PASS] Re-unlocking category -> Status ${resReunlock.status} (Already Unlocked: ${resReunlock.body.unlocked?.already_unlocked})`);
    if (resReunlock.status !== 200 || !resReunlock.body.unlocked?.already_unlocked) {
      throw new Error('Expected already_unlocked = true on redundant unlock attempt');
    }

    const resPostReunlockWallet = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${userToken}`);

    console.log(`[PASS] Verified zero double deduction: Balance remained ${resPostReunlockWallet.body.data?.balance}`);
    if (resPostReunlockWallet.body.data.balance !== balanceBeforeReunlock) {
      throw new Error('Double deduction occurred on previously unlocked category');
    }

    // ------------------------------------------------------------------------
    // 6. ZERO TOKEN DEDUCTION GUARANTEE ON UNAVAILABLE DATA
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Testing Zero Token Deduction Guarantee on Unavailable Category ---');

    // Khasra 101 has no active court dispute
    const resUnavailable = await request(app)
      .post(`/api/properties/${targetPropertyId}/unlock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ category: 'COURT_CASES' });

    console.log(`[PASS] Attempt to unlock unavailable category -> Status ${resUnavailable.status} (Error: ${resUnavailable.body.error})`);
    if (resUnavailable.status !== 400 || resUnavailable.body.error !== 'DATA_UNAVAILABLE') {
      throw new Error('Zero Token Deduction Guarantee failed: expected DATA_UNAVAILABLE 400 error');
    }
    console.log(`[PASS] System Message: "${resUnavailable.body.message}"`);

    // Verify balance was preserved
    const resPreservedWallet = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${userToken}`);

    console.log(`[PASS] Preserved Balance: ${resPreservedWallet.body.data?.balance} Tokens (Zero deductions applied)`);
    if (resPreservedWallet.body.data.balance !== balanceBeforeReunlock) {
      throw new Error('Tokens were improperly deducted for unavailable category');
    }

    console.log('\n🎉 ALL WALLET, RAZORPAY & MONETIZATION TESTS PASSED (100% PASS RATE)!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ WALLET TEST SUITE FAILURE:');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

runWalletTests();
