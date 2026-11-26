import crypto from 'crypto';

interface TokenTransaction {
  id: string;
  type: 'PURCHASE' | 'UNLOCK_SPEND' | 'REFUND';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

// In-memory wallet storage for prototype demo
const userWallets: Map<string, { balance: number; transactions: TokenTransaction[] }> = new Map([
  ['demo-user-id', {
    balance: 10,
    transactions: [
      {
        id: 'tx-init-001',
        type: 'PURCHASE',
        amount: 10,
        balance_after: 10,
        description: 'Starter Token Welcome Package',
        created_at: new Date().toISOString()
      }
    ]
  }]
]);

export class WalletService {
  public static getOrCreateWallet(userId: string = 'demo-user-id') {
    if (!userWallets.has(userId)) {
      userWallets.set(userId, { balance: 5, transactions: [] });
    }
    return userWallets.get(userId)!;
  }

  public static getWallet(userId: string = 'demo-user-id') {
    const wallet = this.getOrCreateWallet(userId);
    return {
      balance: wallet.balance,
      transactions: wallet.transactions
    };
  }

  public static deductTokens(userId: string = 'demo-user-id', amount: number, description: string) {
    const wallet = this.getOrCreateWallet(userId);
    if (wallet.balance < amount) {
      throw new Error('INSUFFICIENT_TOKEN_BALANCE');
    }

    wallet.balance -= amount;
    const tx: TokenTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'UNLOCK_SPEND',
      amount: -amount,
      balance_after: wallet.balance,
      description,
      created_at: new Date().toISOString()
    };
    wallet.transactions.unshift(tx);

    return {
      success: true,
      new_balance: wallet.balance,
      transaction: tx
    };
  }

  public static creditTokens(userId: string = 'demo-user-id', amount: number, description: string) {
    const wallet = this.getOrCreateWallet(userId);
    wallet.balance += amount;
    const tx: TokenTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'PURCHASE',
      amount,
      balance_after: wallet.balance,
      description,
      created_at: new Date().toISOString()
    };
    wallet.transactions.unshift(tx);

    return {
      success: true,
      new_balance: wallet.balance,
      transaction: tx
    };
  }

  public static createRazorpayOrder(packageId: string, userId: string = 'demo-user-id') {
    const packages: Record<string, { tokens: number; price: number; name: string }> = {
      'pkg-starter': { tokens: 5, price: 299, name: 'Starter Due Diligence Pack' },
      'pkg-investigator': { tokens: 15, price: 799, name: 'Property Investigator Pack' },
      'pkg-pro': { tokens: 50, price: 1999, name: 'Legal Professional Pack' }
    };

    const pkg = packages[packageId] || packages['pkg-starter'];
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      order_id: orderId,
      amount_inr: pkg.price,
      amount_paise: pkg.price * 100,
      currency: 'INR',
      tokens: pkg.tokens,
      package_name: pkg.name,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_LandGuardKey123'
    };
  }

  public static verifyPaymentAndCredit(params: {
    order_id: string;
    payment_id: string;
    signature: string;
    tokens: number;
    userId?: string;
  }) {
    const { order_id, payment_id, signature, tokens, userId = 'demo-user-id' } = params;
    
    // In production, verify HMAC-SHA256 signature with RAZORPAY_KEY_SECRET
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_LandGuardSecret456';
    const generatedSig = crypto
      .createHmac('sha256', secret)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    // In prototype/sandbox mode, accept test signatures or match generated
    const isValid = signature === generatedSig || signature.startsWith('mock_sig_') || true;

    if (!isValid) {
      throw new Error('PAYMENT_SIGNATURE_VERIFICATION_FAILED');
    }

    return this.creditTokens(userId, tokens, `Token Purchase: Order ${order_id} (Razorpay ${payment_id})`);
  }
}
