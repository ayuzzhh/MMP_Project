import React from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleType } from '../types';
import { ShieldAlert, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleType[];
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-mono">Authenticating session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
            Access Restricted: Two-Man Rule Security Barrier
          </span>
          <h1 className="text-2xl font-bold text-white">
            Administrative Privileges Required
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            You are currently signed in as <strong className="text-white">{user.full_name}</strong> with role{' '}
            <span className="px-2 py-0.5 rounded bg-slate-800 text-brand-400 font-mono text-xs">{user.role}</span>.
            This module is restricted to authorized Verification Officers and Super Admins.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
          >
            Sign in with an administrator account
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="text-xs text-slate-400 hover:text-white underline transition-colors"
        >
          Return to Previous Page
        </button>
      </div>
    );
  }

  // Permission check
  if (requiredPermission && user && !user.permissions.includes(requiredPermission)) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <Lock className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Missing Specific Permission</h2>
        <p className="text-xs text-slate-400">
          Required permission <code className="text-amber-400 font-mono">{requiredPermission}</code> not granted to your account.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
