import { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import '../assets/AdminLayout.css';

export default function AdminLayout({ adminUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(adminUser || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    // Sync local user state if adminUser prop changes
    if (adminUser) {
      setUser(adminUser);
    }
  }, [adminUser]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, []);

  useEffect(() => {
    // Scroll the main content area to top on route change
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      navigate('/admin/login');
    } catch {
      navigate('/admin/login');
    }
  };

  const hasAccess = (pageName) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    return user.permissions?.includes(pageName);
  };

  return (
    <div className={`admin-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <header className="admin-mobile-header">
        <button 
          className="admin-hamburger" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {isSidebarOpen && <div className="admin-overlay" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand">Admin Dashboard</div>
        <nav className="admin-nav">
          {hasAccess('Contact Messages') && <NavLink to="/admin/contact"  className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>Contact Messages</NavLink>}
          {hasAccess('Review Management') && <NavLink to="/admin/reviews"  className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>Review Management</NavLink>}
          {hasAccess('Product Management') && <NavLink to="/admin/products" className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>Product Management</NavLink>}
          {hasAccess('Client Management') && <NavLink to="/admin/clients" className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>Client Management</NavLink>}
          {hasAccess('Payment Management') && <NavLink to="/admin/payments" className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>Payment Management</NavLink>}
          {hasAccess('Order Management') && <NavLink to="/admin/orders" className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>Order Management</NavLink>}
          {hasAccess('Support Management') && <NavLink to="/admin/support" className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>Support Management</NavLink>}
          
          <button className="admin-signout-inline" onClick={handleSignOut}>Sign Out</button>
        </nav>
        <button className="admin-signout" onClick={handleSignOut}>Sign Out</button>
      </aside>

      <main className="admin-main" ref={mainRef}>
        <Outlet />
      </main>
    </div>
  );
}
