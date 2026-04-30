import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import DatasetDetail from './pages/DatasetDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import SellerDashboard from './pages/SellerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Helper: always reads from localStorage directly to avoid race conditions
const getUser = () => {
  try {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

// Route guard that reads localStorage synchronously
const DashboardRoute = () => {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'staff') return <StaffDashboard />;
  return <SellerDashboard />;
};

const App = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const userStr = localStorage.getItem('user');
        setUser(userStr ? JSON.parse(userStr) : null);
      } catch (error) {
        setUser(null);
      }
    };

    handleAuthChange();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden selection:bg-primary-500/30">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
          <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-accent-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-20 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 relative z-30">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/dataset/:id" element={<DatasetDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Role-based Dashboard routing - uses synchronous localStorage check */}
              <Route path="/dashboard" element={<DashboardRoute />} />
            </Routes>
          </main>
          <footer className="glass border-t border-white/10 py-12 text-center text-surface-500 mt-20">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-bold text-white mb-2 tracking-widest uppercase text-xs">DataMarket Protocol</p>
              <p className="text-sm">&copy; {new Date().getFullYear()} Decentralized Data Exchange. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
};

export default App;
