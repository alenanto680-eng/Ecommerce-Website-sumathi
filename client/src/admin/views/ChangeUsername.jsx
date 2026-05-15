import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/changepassword.css';

const API = '/api/users';
const authHeaders = () => ({
  'Content-Type': 'application/json',
});

export default function ChangeUsername() {
  const [form, setForm] = useState({ currentPassword: '', newUsername: '' });
  const [msg, setMsg]   = useState({ text: '', type: '' });
  const navigate        = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newUsername.trim().length === 0) {
       setMsg({ text: 'Username cannot be empty.', type: 'error' }); return;
    }
    try {
      const res  = await fetch(`${API}/change-username`, {
        method: 'PATCH', 
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ currentPassword: form.currentPassword, newUsername: form.newUsername }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: 'Username changed successfully! logging out...', type: 'success' });
        setTimeout(async () => {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          navigate('/admin/login');
        }, 1500);
      } else {
        setMsg({ text: data.message, type: 'error' });
      }
    } catch {
      setMsg({ text: 'Server error.', type: 'error' });
    }
  };

  return (
    <div className="cpw-page">
      <h1 className="cpw-title">Change Username</h1>

      <div className="cpw-card">
        <h3 className="cpw-card-title">Update Superadmin Username</h3>
        <p className="cpw-card-sub">Change your superadmin login username.</p>

        {msg.text && (
          <div className={`cpw-msg ${msg.type === 'error' ? 'cpw-msg-error' : 'cpw-msg-success'}`}>
            {msg.text}
          </div>
        )}

        <form className="cpw-form" onSubmit={handleSubmit}>
          <div className="cpw-form-group">
            <label>Current Password</label>
            <input type="password" placeholder="Enter current password" value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div className="cpw-form-group">
            <label>New Username</label>
            <input type="text" placeholder="Enter new username" value={form.newUsername}
              onChange={e => setForm(f => ({ ...f, newUsername: e.target.value }))} required />
          </div>
          <div className="cpw-form-actions">
            <button type="button" className="cpw-back-btn" onClick={() => navigate('/admin/users')}>Back</button>
            <button type="submit" className="cpw-submit-btn">Change Username</button>
          </div>
        </form>
      </div>
    </div>
  );
}
