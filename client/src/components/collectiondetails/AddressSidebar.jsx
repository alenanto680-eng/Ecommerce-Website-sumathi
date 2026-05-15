import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authFetch } from '../../utils/authFetch';
import { Search } from 'lucide-react';
import '../../styles/manageaddresses/ManageAddresses.css';

export default function AddressSidebar({ isOpen, onClose, onSelectAddress }) {
  const [addresses, setAddresses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Reset search when sidebar closes
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  // Fetch addresses on open / auth change
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const res = await authFetch(`/api/client-auth/addresses/${user.uid}`);
          const data = await res.json();
          if (data.success) setAddresses(data.addresses || []);
        } catch { }
      } else {
        try {
          const saved = localStorage.getItem('sumathi_addresses');
          setAddresses(saved ? JSON.parse(saved) : []);
        } catch { setAddresses([]); }
      }
    });
    return () => unsub();
  }, [isOpen]);

  // ── Live sync: react to deletions/saves made in ManageAddresses ──
  useEffect(() => {
    const handleAddressChange = (e) => {
      const { addresses: updated, deletedId } = e.detail || {};
      if (Array.isArray(updated)) {
        setAddresses(updated);
      } else if (deletedId) {
        // Fallback: just filter out the deleted one from current list
        setAddresses(prev => prev.filter(a => String(a.id || a._id) !== String(deletedId)));
      }
    };

    window.addEventListener('sumathi_addresses_changed', handleAddressChange);
    return () => window.removeEventListener('sumathi_addresses_changed', handleAddressChange);
  }, []);

  if (!isOpen) return null;

  const filteredAddresses = addresses.filter(addr => {
    const q = searchQuery.toLowerCase();
    return (
      (addr.name || '').toLowerCase().includes(q) ||
      (addr.phone || '').includes(q) ||
      (addr.line1 || '').toLowerCase().includes(q) ||
      (addr.line2 || '').toLowerCase().includes(q) ||
      (addr.pincode || '').includes(q)
    );
  });

  return (
    <div
      className="address-sidebar-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex',
        justifyContent: 'flex-end', transition: 'opacity 0.3s ease'
      }}
    >
      <div
        className="address-sidebar-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '400px', maxWidth: '100%', height: '100%', backgroundColor: '#fff',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.1)'
        }}
      >

        {/* Header */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '500', color: '#333' }}>Select Delivery Address</h2>
          <button onClick={onClose} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>&times;</button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 24px 20px 24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', background: '#f5f5f6',
            borderRadius: '6px', padding: '10px 14px', border: '1px solid #eaeaec'
          }}>
            <Search size={18} color="#888" style={{ marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Search address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '15px' }}
            />
          </div>
        </div>

        {/* Dotted separator */}
        <div style={{ borderBottom: '1px dashed #d4d5d9', margin: '0 24px' }} />

        {/* Sub-header */}
        <div style={{ padding: '20px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', margin: 0, fontWeight: '600', color: '#444' }}>SAVED ADDRESSES</h3>
          <button
            onClick={() => { 
              onClose(); 
              if (auth.currentUser) {
                navigate('/account/addresses'); 
              } else {
                navigate('/login');
              }
            }}
            style={{
              background: 'none', border: 'none', color: '#c07a55', fontWeight: 'bold',
              fontSize: '13px', cursor: 'pointer', outline: 'none'
            }}
          >
            + ADD NEW
          </button>
        </div>

        {/* Address list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 24px 30px' }}>
          {filteredAddresses.length > 0 ? (
            filteredAddresses.map(addr => (
              <div key={addr.id || addr._id} style={{
                border: '1px solid #eaeaec', borderRadius: '4px', padding: '20px',
                marginBottom: '16px', background: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 'bold', background: '#f5f5f6',
                    color: '#696b79', padding: '4px 8px', borderRadius: '12px', letterSpacing: '0.5px'
                  }}>
                    {addr.type || 'HOME'}
                  </span>
                  {addr.isDefault && (
                    <span style={{
                      marginLeft: '10px', fontSize: '10px', fontWeight: 'bold',
                      color: '#c07a55', backgroundColor: '#f7e9e3', padding: '2px 6px', borderRadius: '4px'
                    }}>
                      DEFAULT
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '15px', fontWeight: '600', color: '#282c3f', marginBottom: '6px' }}>
                  {addr.name}
                  <span style={{ fontWeight: 'normal', color: '#444', marginLeft: '12px' }}>{addr.phone}</span>
                </div>

                <div style={{ fontSize: '14px', color: '#424553', marginBottom: '20px', lineHeight: '1.5' }}>
                  {addr.line1}<br />
                  {addr.line2} <strong style={{ color: '#282c3f' }}>{addr.pincode}</strong>
                </div>

                <button
                  onClick={() => { onSelectAddress(addr); onClose(); }}
                  style={{
                    width: '100%', padding: '12px', background: 'none', color: '#c07a55',
                    border: '1px solid #c07a55', borderRadius: '4px', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase',
                    letterSpacing: '0.5px', transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#c07a55'; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#c07a55'; }}
                >
                  Deliver Here
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7e818c' }}>
              <p>No addresses found.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}