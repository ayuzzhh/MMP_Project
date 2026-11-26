import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WalletModal } from './components/WalletModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { MapExplorerPage } from './pages/MapExplorerPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LandGuardApi } from './services/api';
import { WalletData } from './types';

const AppContent: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const fetchWallet = async () => {
    try {
      const data = await LandGuardApi.getWallet();
      setWalletData(data);
      refreshProfile();
    } catch (err) {
      // Wallet fetch failed or unauthenticated
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* Navigation Bar */}
      <Navbar
        walletBalance={user ? user.wallet_balance : (walletData?.balance ?? 10)}
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      {/* Dynamic Route Pages */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/map" 
            element={
              <MapExplorerPage
                walletBalance={user ? user.wallet_balance : (walletData?.balance ?? 10)}
                onTokenSpent={fetchWallet}
                onOpenWallet={() => setIsWalletOpen(true)}
              />
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Global Razorpay Token Wallet Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        walletData={walletData}
        onWalletUpdated={fetchWallet}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
