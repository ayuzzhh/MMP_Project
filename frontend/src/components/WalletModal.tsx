import React, { useState } from 'react';
import { X, Coins, Check, Zap, Shield, CreditCard, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { LandGuardApi } from '../services/api';
import { WalletData } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletData: WalletData | null;
  onWalletUpdated: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  walletData,
  onWalletUpdated
}) => {
  const [selectedPackage, setSelectedPackage] = useState<'pkg-starter' | 'pkg-investigator' | 'pkg-pro'>('pkg-investigator');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const packages = [
    {
      id: 'pkg-starter' as const,
      name: 'Starter Investigation',
      tokens: 5,
      price: 299,
      badge: 'Basic Due Diligence',
      features: ['5 Verification Tokens', 'Single Parcel Investigation', 'Valid for All Records']
    },
    {
      id: 'pkg-investigator' as const,
      name: 'Property Investigator',
      tokens: 15,
      price: 799,
      badge: 'Most Popular',
      popular: true,
      features: ['15 Verification Tokens', '3-4 Full Parcel Analyses', 'Instant Court Check', 'Save ₹100']
    },
    {
      id: 'pkg-pro' as const,
      name: 'Legal Professional',
      tokens: 50,
      price: 1999,
      badge: 'Advocate & Bank Desk',
      features: ['50 Verification Tokens', 'Bulk Cadastre Searches', 'High Priority Verification', 'Save ₹990']
    }
  ];

  const handlePurchase = async () => {
    try {
      setIsProcessing(true);
      setSuccessNotice(null);

      // Step 1: Create Razorpay Order on Backend
      const order = await LandGuardApi.createOrder(selectedPackage);

      // Step 2: Simulate Razorpay Checkout Gateway Completion
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const mockSignature = `mock_sig_${Date.now()}`;

      // Step 3: Server-side HMAC Signature Verification & Token Crediting
      await LandGuardApi.verifyPayment({
        order_id: order.order_id,
        payment_id: mockPaymentId,
        signature: mockSignature,
        tokens: order.tokens
      });

      setSuccessNotice(`Successfully purchased ${order.tokens} tokens via Razorpay!`);
      onWalletUpdated();
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-fade-in text-stone-200">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-[#0f2b1d] text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#e5b03c]/20 text-[#e5b03c] flex items-center justify-center border border-[#e5b03c]/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-white">e-Stahl Token Wallet</h2>
              <p className="text-xs text-stone-300">Pre-paid investigative tokens for cadastral verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Bar */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-semibold block">
              Current Available Balance
            </span>
            <div className="text-2xl font-black font-mono text-white flex items-center gap-2">
              <span className="text-[#e5b03c]">{walletData?.balance ?? 0}</span>
              <span className="text-xs font-normal text-stone-400">Tokens</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-stone-400 font-mono block">Zero Deduction Guarantee</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Shield className="w-3.5 h-3.5" /> Razorpay Test Gateway Active
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {successNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Package Selection */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
              Select Token Package
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                    selectedPackage === pkg.id
                      ? 'bg-stone-950 border-[#e5b03c] ring-2 ring-[#e5b03c]/20 shadow-xl'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-3 bg-[#e5b03c] text-stone-950 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                  <div>
                    <span className="text-[10px] text-stone-400 font-mono">{pkg.badge}</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{pkg.name}</h3>
                    <div className="mt-2 text-xl font-black font-mono text-white">
                      ₹{pkg.price}
                    </div>
                    <div className="text-xs text-[#e5b03c] font-mono font-semibold">
                      {pkg.tokens} Tokens (₹{(pkg.price / pkg.tokens).toFixed(0)}/token)
                    </div>
                  </div>
                  <ul className="mt-3 pt-3 border-t border-stone-800 space-y-1 text-[11px] text-stone-400">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Ledger */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
              Recent Activity Ledger
            </h3>
            <div className="rounded-xl border border-stone-800 bg-stone-950 divide-y divide-stone-850 max-h-40 overflow-y-auto">
              {walletData?.transactions && walletData.transactions.length > 0 ? (
                walletData.transactions.map((tx) => (
                  <div key={tx.id} className="p-3 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-800 text-stone-300'
                      }`}>
                        {tx.amount > 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-medium text-stone-200">{tx.description}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{new Date(tx.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold">
                      <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-stone-300'}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Tokens
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-stone-500">No transactions recorded yet.</div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Checkout Button */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="text-xs text-stone-400">
            Selected: <span className="font-semibold text-white">
              {packages.find(p => p.id === selectedPackage)?.tokens} Tokens (₹{packages.find(p => p.id === selectedPackage)?.price})
            </span>
          </div>
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-[#0f2b1d] hover:bg-[#163e2a] text-[#e5b03c] border border-[#e5b03c]/40 font-bold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            {isProcessing ? 'Connecting Gateway...' : 'Pay with Razorpay'}
          </button>
        </div>

      </div>
    </div>
  );
};