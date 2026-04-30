import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, LogOut, LayoutDashboard, Globe } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const updateAuth = () => {
      const userStr = localStorage.getItem('user');
      setUser(userStr ? JSON.parse(userStr) : null);
    };
    updateAuth();
    window.addEventListener('auth-change', updateAuth);
    return () => window.removeEventListener('auth-change', updateAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/10 px-4 md:px-8 py-4 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex justify-between items-center text-white">
        <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-105">
          <div className="bg-primary-500/20 p-2 rounded-xl border border-primary-500/30 group-hover:shadow-[0_0_15px_rgba(45,212,191,0.4)] transition-all">
            <Database className="text-primary-400" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter">
            DATA<span className="text-primary-400">MARKET</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-white">
          <Link to="/browse" className="text-sm font-bold text-surface-400 hover:text-white transition-colors flex items-center gap-2">
            <Globe size={16} /> Market Explorer
          </Link>
          
          {user ? (
            <div className="flex items-center gap-6 pl-6 border-l border-white/10">
              <Link to="/dashboard" className="text-sm font-bold text-surface-400 hover:text-primary-400 transition-colors flex items-center gap-2">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-black text-white leading-none uppercase tracking-tighter">{user.role}</div>
                  <div className="text-[10px] text-surface-500 font-mono mt-1">{user.email.split('@')[0]}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-all text-surface-400"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-white hover:text-primary-400 transition-colors">SignIn</Link>
              <Link to="/register" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)] border border-primary-400/20">
                Join Network
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
