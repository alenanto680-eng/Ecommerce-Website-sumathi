import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/changepassword.css';

const API = '/api/users';
const authHeaders = () => ({
  'Content-Type': 'application/json',
});

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg]   = useState({ text: '', type: '' });
  const navigate        = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ text: 'New passwords do not match.', type: 'error' }); return;
    }
    if (form.newPassword.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters.', type: 'error' }); return;
    }
    try {
      const res  = await fetch(`${API}/change-password`, {
        method: 'PATCH', headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: 'Password changed successfully!', type: 'success' });
        setTimeout(() => navigate('/admin/users'), 2000);
      } else {
        setMsg({ text: data.message, type: 'error' });
      }
    } catch {
      setMsg({ text: 'Server error.', type: 'error' });
    }
  };

  return (
    <div className="cpw-page">
      <h1 className="cpw-title">Change Password</h1>

      <div className="cpw-card">
        <h3 className="cpw-card-title">Update Superadmin Password</h3>
        <p className="cpw-card-sub">Update your superadmin login password.</p>

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
            <label>New Password</label>
            <input type="password" placeholder="Enter new password" value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} required />
          </div>
          <div className="cpw-form-group">
            <label>Confirm New Password</label>
            <input type="password" placeholder="Re-enter new password" value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
          </div>
          <div className="cpw-form-actions">
            <button type="button" className="cpw-back-btn" onClick={() => navigate('/admin/users')}>Back</button>
            <button type="submit" className="cpw-submit-btn">Change Password</button>
          </div>
        </form>
      </div>
    </div>
  );
}
