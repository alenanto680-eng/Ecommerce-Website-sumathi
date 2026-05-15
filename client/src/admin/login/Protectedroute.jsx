import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PERMISSION_MAP = {
  '/admin/contact': 'Contact Messages',
  '/admin/reviews': 'Review Management',
  '/admin/products': 'Product Management',
  '/admin/clients': 'Client Management',
  '/admin/payments': 'Payment Management',
  '/admin/orders': 'Order Management',
  '/admin/support': 'Support Management',
  '/admin/users': 'superadmin'
};

export default function ProtectedRoute({ children }) {
  const [auth, setAuth] = useState({ loading: true, authenticated: false, user: null });
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        setAuth({ 
          loading: false, 
          authenticated: data.success,
          user: data.success ? data.user : null
        });
      } catch (err) {
        setAuth({ loading: false, authenticated: false, user: null });
      }
    };
    verifyAuth();
  }, []);

  if (auth.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#fff' }}>
        <p>Verifying Security Level...</p>
      </div>
    );
  }

  if (!auth.authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Permission Check
  const currentPath = location.pathname;
  const requiredPermission = PERMISSION_MAP[currentPath];

  if (requiredPermission && auth.user.role !== 'superadmin') {
    // If it's a superadmin-only page
    if (requiredPermission === 'superadmin' && auth.user.role !== 'superadmin') {
      return <Navigate to="/admin/contact" replace />; // Redirect to a safe default page
    }
    
    // Check if admin has the specific permission
    const hasPermission = auth.user.permissions?.includes(requiredPermission);
    if (!hasPermission) {
      // Find the first available page they DO have access to
      const firstAvailable = PERMISSION_MAP;
      const fallbackPath = Object.keys(PERMISSION_MAP).find(path => 
        auth.user.permissions?.includes(PERMISSION_MAP[path])
      ) || '/admin/login';
      
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { adminUser: auth.user });
    }
    return child;
  });
}
