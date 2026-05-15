import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authFetch } from '../../utils/authFetch';
import '../../styles/sidebar/Sidebar.css';

export default function Sidebar({ activeNav, setActiveNav, activeSubNav, setActiveSubNav, user }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(user || null);

  useEffect(() => {
    // 1. If user is passed as prop, use it and stop.
    if (user) {
      setUserData(user);
      return;
    }

    // 2. Otherwise, fetch independently (for pages like Wishlist/Addresses)
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // ONLY fetch if we don't already have the data to stop loops
        if (!userData) {
          try {
            const res = await authFetch(`/api/client-auth/profile/${fbUser.uid}`);
            const data = await res.json();
            if (data.success) {
              setUserData(data.user);
            }
          } catch (err) {
            console.error("Sidebar: Failed to fetch profile", err);
          }
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsub();
  }, [user, userData]); // Added userData dependency to allow conditional check

  const handleSubNav = (key, path) => {
    setActiveSubNav(key);
    if (path) navigate(path);
  };

  // Logic for display name and avatar
  const displayName = userData?.name || userData?.phone || 'Guest';
  const avatarUrl = userData?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`;

  return (
    <aside className="sidebar">

      {/* Profile Header */}
      <div className="profile-header">
        <div className="avatar-container">
          <img
            src={avatarUrl}
            alt="Profile"
            className="avatar"
          />
          <div className="status-dot" />
        </div>
        <div className="welcome-text">Welcome back,</div>
        <div className="user-name">{displayName}</div>
      </div>

      {/* My Orders */}
      <div className="nav-section">
        <div
          className="nav-item"
          onClick={() => { setActiveNav('orders'); navigate('/account/orders'); }}
        >
          <img src="/images/sidebar/logistics.png" alt="orders" className="nav-icon-img" /> MY ORDERS
          <span className="nav-arrow">›</span>
        </div>
      </div>

      {/* Account Settings */}
      <div className="nav-section">
        <div
          className={`nav-item ${activeNav === 'account-settings' ? 'active' : ''}`}
          onClick={() => setActiveNav('account-settings')}
        >
          <img src="/images/sidebar/user.png" alt="account" className="nav-icon-img" /> ACCOUNT SETTINGS
        </div>
        <div
          className={`nav-sub-item ${activeSubNav === 'profile' ? 'sub-active' : ''}`}
          onClick={() => handleSubNav('profile', '/account/profile')}
        >
          Profile Information
        </div>
        <div
          className={`nav-sub-item ${activeSubNav === 'address' ? 'sub-active' : ''}`}
          onClick={() => handleSubNav('address', '/account/addresses')}
        >
          Manage Addresses
        </div>
      </div>

      {/* My Stuff */}
      <div className="nav-section">
        <div
          className={`nav-item ${activeNav === 'mystuff' ? 'active' : ''}`}
          onClick={() => setActiveNav('mystuff')}
        >
          <img src="/images/sidebar/box.png" alt="stuff" className="nav-icon-img" /> MY STUFF
        </div>
        <div
          className={`nav-sub-item ${activeSubNav === 'reviews' ? 'sub-active' : ''}`}
          onClick={() => handleSubNav('reviews', '/account/reviews')}
        >
          My Reviews &amp; Ratings
        </div>
        <div
          className={`nav-sub-item ${activeSubNav === 'wishlist' ? 'sub-active' : ''}`}
          onClick={() => handleSubNav('wishlist', '/account/wishlist')}
        >
          My Wishlist
        </div>
      </div>

      {/* Policy */}
      <div className="nav-section">
        <div
          className={`nav-item ${activeNav === 'policy' ? 'active' : ''}`}
          onClick={() => { setActiveNav('policy'); setActiveSubNav('privacy'); navigate('/account/policy/privacy'); }}
        >
          <img src="/images/sidebar/policy.png" alt="policy" className="nav-icon-img" /> POLICY
        </div>
        <div
          className={`nav-sub-item ${activeNav === 'policy' && activeSubNav === 'privacy' ? 'sub-active' : ''}`}
          onClick={() => { setActiveNav('policy'); setActiveSubNav('privacy'); navigate('/account/policy/privacy'); }}
        >
          Privacy Policy
        </div>
        <div
          className={`nav-sub-item ${activeNav === 'policy' && activeSubNav === 'terms' ? 'sub-active' : ''}`}
          onClick={() => { setActiveNav('policy'); setActiveSubNav('terms'); navigate('/account/policy/terms'); }}
        >
          Terms of Service
        </div>
        <div
          className={`nav-sub-item ${activeNav === 'policy' && activeSubNav === 'refund' ? 'sub-active' : ''}`}
          onClick={() => { setActiveNav('policy'); setActiveSubNav('refund'); navigate('/account/policy/refund'); }}
        >
          Refund &amp; Cancellation Policy
        </div>
      </div>

      <div className="sidebar-spacer" />

      {/* Contact Support — no border below */}
      <div className="nav-section nav-section-last">
        <div className="nav-item" onClick={() => navigate('/support')}>
          <img src="/images/sidebar/customer-support.png" alt="help" className="nav-icon-img" /> Contact Support
        </div>
      </div>

    </aside>
  );
}
