

import { useState, useRef } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, setupRecaptcha, sendOtp } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import SEO from '../SEO';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('form');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const confirmationRef = useRef(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    console.group("🔵 Google Sign-In");
    try {

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const res = await fetch('/api/client-auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          loginType: 'google',
        }),
      });

      navigate('/');
    } catch (err) {

      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {

      } else {
        console.error("❌ Google Sign-In FAILED:", err.code, err.message);
        setMessage({ text: 'Google Sign-In failed. Please try again.', type: 'error' });
      }
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const handleSendOtp = async () => {
    console.group("📱 handleSendOtp()");

    if (!/^\d{10}$/.test(phone)) {

      setMessage({ text: 'Enter a valid 10-digit phone number.', type: 'error' });
      console.groupEnd();
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    const phoneNumber = `+91${phone}`;

    try {

      const verifier = setupRecaptcha('recaptcha-container');

      const confirmation = await sendOtp(phoneNumber);

      confirmationRef.current = confirmation;
      setStep('otp');
      setMessage({ text: `OTP sent to +91 ${phone}`, type: 'success' });

    } catch (err) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ OTP send FAILED");
      console.error("   err.code         :", err.code);
      console.error("   err.message      :", err.message);
      console.error("   err.customData   :", JSON.stringify(err.customData, null, 2));
      console.error("   err.serverResponse:", err.serverResponse || "none");
      console.error("   Full error       :", err);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      let userMessage = 'Failed to send OTP. Check the number and try again.';
      if (err.code === 'auth/too-many-requests') userMessage = 'Too many attempts. Please try again later.';
      if (err.code === 'auth/invalid-phone-number') userMessage = 'Invalid phone number format.';
      if (err.code === 'auth/captcha-check-failed') userMessage = 'reCAPTCHA check failed. Please refresh and try again.';
      if (err.code === 'auth/quota-exceeded') userMessage = 'SMS quota exceeded. Try again later.';
      if (err.code === 'auth/blocked-all-requests') userMessage = 'Requests blocked. Check Firebase SMS region policy.';
      if (err.code === 'auth/network-request-failed') userMessage = 'Network error. Check your internet connection.';
      if (err.code === 'auth/invalid-app-credential') userMessage = '❌ Invalid app credential — check Firebase Console config & authorized domains.';

      setMessage({ text: userMessage, type: 'error' });
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const handleVerifyOtp = async () => {
    console.group("🔑 handleVerifyOtp()");

    if (otp.length !== 6) {

      setMessage({ text: 'Enter the 6-digit OTP.', type: 'error' });
      console.groupEnd();
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {

      const result = await confirmationRef.current.confirm(otp);
      const user = result.user;

      const res = await fetch('/api/client-auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          phone: phone,
          loginType: 'phone',
        }),
      });

      navigate('/');
    } catch (err) {
      console.error("❌ OTP verification FAILED:", err.code, err.message);
      setMessage({ text: 'Invalid OTP. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const handlePhoneChange = (e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10));
  const handleOtpChange = (e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));

  return (
    <div className="ul-page">
      <SEO 
        title="Login" 
        description="Login to your Sumathi Trends account to manage your orders, addresses, and wishlist."
      />

      <div
        id="recaptcha-container"
        style={{ position: 'fixed', bottom: '0px', left: '0px' }}
      />

      <div className="ul-container">

        {}
        <div className="ul-image-section">
          <button className="ul-back-btn" onClick={() => navigate('/')} title="Back to Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <img
            src="/images/login/client_login.png"
            alt="Login Illustration"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {}
        <div className="ul-form-section">

          {message.text && (
            <div className={`ul-message ${message.type === 'success' ? 'ul-msg-success' : 'ul-msg-error'}`}>
              {message.text}
            </div>
          )}

          {}
          {step === 'form' && (
            <>
              <div className="ul-header">
                <h1>Welcome back</h1>
                <p>Please log into your account</p>
              </div>

              <div className="ul-form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="ul-phone-wrap">
                  <span className="ul-phone-prefix">+91</span>
                  <input
                    type="text"
                    id="phone"
                    placeholder="9876543210"
                    maxLength={10}
                    inputMode="numeric"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              <button
                className="ul-btn-signin"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>

              <div className="ul-divider">or</div>

              <button
                className="ul-btn-google"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <span>Signing in…</span>
                ) : (
                  <>
                    <svg viewBox="0 0 48 48" width="18" height="18">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            </>
          )}

          {}
          {step === 'otp' && (
            <>
              <div className="ul-header">
                <h1>Enter OTP</h1>
                <p>Sent to +91 {phone}</p>
              </div>

              <div className="ul-form-group">
                <label htmlFor="otp">6-digit OTP</label>
                <input
                  type="text"
                  id="otp"
                  placeholder="● ● ● ● ● ●"
                  maxLength={6}
                  inputMode="numeric"
                  value={otp}
                  onChange={handleOtpChange}
                  autoFocus
                />
              </div>

              <button
                className="ul-btn-signin"
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? 'Verifying…' : 'Verify & Login'}
              </button>

              <button
                className="ul-btn-resend"
                onClick={() => { setStep('form'); setOtp(''); setMessage({ text: '', type: '' }); }}
              >
                ← Change number / Resend
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}