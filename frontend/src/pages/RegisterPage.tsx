import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Phone, ArrowRight, Coins, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        phone_number: phoneNumber || '+91 9800000000',
        password
      });
      navigate('/map');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';
  const labelClass = 'text-sm font-semibold text-slate-700 dark:text-slate-300 block';
  const iconClass = 'w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2';

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join e-Stahl to verify village property and check land records."
    >
      {/* Free token banner */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-amber-950 dark:text-amber-200 block text-sm">10 Free Search Tokens Included</span>
          <span className="text-amber-800 dark:text-amber-300 text-xs">
            Free credit on signup to inspect Khasra details in Ranpur village.
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reg-name" className={labelClass}>Your name</label>
            <div className="relative">
              <User className={iconClass} />
              <input
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-email" className={labelClass}>Email address</label>
            <div className="relative">
              <Mail className={iconClass} />
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-phone" className={labelClass}>Mobile phone number</label>
            <div className="relative">
              <Phone className={iconClass} />
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98290 12345"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-password" className={labelClass}>Create password</label>
            <div className="relative">
              <Lock className={iconClass} />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Get Started (Free 10 Tokens)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </AuthShell>
  );
};
