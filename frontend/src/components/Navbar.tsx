import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MapPin, Coins, Plus, LayoutDashboard, 
  Info, LogIn, LogOut, User, ChevronDown, Compass, Shield, Sun, Moon, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  walletBalance: number;
  onOpenWallet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ walletBalance, onOpenWallet }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Farmvest Style Logo & Brand */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <span className="flex items-end gap-0.5 h-5" aria-hidden="true">
              <span className="w-1 h-2.5 bg-civic-ochre" />
              <span className="w-1 h-4 bg-emerald-700 dark:bg-emerald-400" />
              <span className="w-1 h-3 bg-emerald-700 dark:bg-emerald-400" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              e-stahl<span className="text-slate-400 dark:text-slate-500 font-normal"> / </span>
              <span className="font-normal">land</span>
            </span>
          </Link>

          {/* Village scope */}
          <div className="hidden xl:flex items-center gap-2 eyebrow text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-4">
            <span className="w-1.5 h-1.5 rounded-full bg-civic-ochre"></span>
            <span>Ranpur · Kota</span>
          </div>
        </div>

        {/* Simple & Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium">
          {[
            { to: '/', n: '01', label: 'Home' },
            { to: '/map', n: '02', label: 'Village Map' },
            { to: '/about', n: '03', label: 'How It Works' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-baseline gap-1.5 pb-0.5 border-b-2 transition-colors ${
                isActive(item.to)
                  ? 'border-civic-ochre text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="font-mono text-[10px] text-slate-400 group-hover:text-civic-ochre-dark">{item.n}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Protected Admin Link (Visible only to authorized Admins) */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 pb-0.5 border-b-2 transition-colors ${
                isActive('/admin')
                  ? 'border-civic-ochre text-amber-700 dark:text-amber-300'
                  : 'border-transparent text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </nav>

        {/* Right Action Controls: Theme Switcher + Token Wallet + User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Day / Night Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title={isDark ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
            aria-label="Toggle Day/Night Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transform hover:rotate-45 transition-transform duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 transform hover:-rotate-12 transition-transform duration-200" />
            )}
          </button>

          {/* Token Wallet Button (Simple plain English) */}
          <button
            onClick={onOpenWallet}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all shadow-sm"
            title="Your search tokens"
          >
            <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{walletBalance} Tokens</span>
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] ml-1">
              <Plus className="w-3 h-3" />
            </span>
          </button>

          {/* User Account / Login State */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{user.full_name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-fade-in"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5">
                    <div className="font-bold text-slate-900 dark:text-white truncate">{user.full_name}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{user.email}</div>
                    <span className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {user.role === 'ADMIN' ? 'Verification Admin' : user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Property Buyer'}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/map"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Explore Village Map</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2.5 rounded-lg bg-civic-forest hover:bg-civic-forest-light dark:bg-civic-ochre dark:hover:bg-civic-ochre-light text-civic-cream dark:text-civic-forest-dark text-xs font-bold transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

        </div>

      </div>
      {/* Mobile navigation panel */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 text-sm font-medium animate-fade-in">
          {[
            { to: '/', label: 'Home' },
            { to: '/map', label: 'Village Map' },
            { to: '/about', label: 'How It Works' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl transition-all ${
                isActive(item.to)
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="block px-3.5 py-2.5 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              Admin Dashboard
            </Link>
          )}
        </nav>
      )}
    </header>
  );
};
