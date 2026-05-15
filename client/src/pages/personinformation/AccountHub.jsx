import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authFetch } from '../../utils/authFetch';
import '../../styles/personinformation/AccountHub.css';

export default function AccountHub() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav]       = useState('account-settings');
  const [activeSubNav, setActiveSubNav] = useState('');
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  // ── Desktop redirect: keep old behaviour ──────────────────────────────
  // On desktop (>768px) go straight to /account/profile just like before.
  // On mobile stay here and show the centered hub menu.
  useEffect(() => {
    if (window.innerWidth > 768) {
      navigate('/account/profile', { replace: true });
    }
  }, [navigate]);
  // ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const res  = await authFetch(`/api/client-auth/profile/${user.uid}`);
          const data = await res.json();
          if (data.success) setDbUser(data.user);
        } catch (err) {
          console.error('AccountHub: failed to load user', err);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsub();
  }, [navigate]);

  return (
    <div className="hub-page">
      <div className="hub-container">
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          activeSubNav={activeSubNav}
          setActiveSubNav={setActiveSubNav}
          user={dbUser}
        />
      </div>
    </div>
  );
}

