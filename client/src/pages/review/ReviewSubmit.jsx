import { useState, useEffect } from 'react';
import '../../styles/review/ReviewSubmit.css';

const API = '/api/qr-reviews/submit';

export default function ReviewSubmit() {
  const [form, setForm] = useState({ name: '', rating: 0, message: '' });
  const [hover, setHover] = useState(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add('has-review-bg');
    return () => document.body.classList.remove('has-review-bg');
  }, []);

  const wordCount = form.message.trim() === '' ? 0 : form.message.trim().split(/\s+/).length;

  const handleMessageChange = (e) => {
    const val = e.target.value;
    const words = val.trim() === '' ? 0 : val.trim().split(/\s+/).length;
    if (words <= 10) setForm(f => ({ ...f, message: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.rating || !form.message) {
      setError('Please fill in all fields and select a rating.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rs-page">
        <div className="rs-card">
          <div className="rs-success-icon">✓</div>
          <h2 className="rs-success-title">Thank you!</h2>
          <p className="rs-success-sub">
            Your review has been submitted and is awaiting approval.
            We'll feature it on our website soon!
          </p>
          <img src="/images/logo.png" alt="Sumathi Trends" className="rs-logo" onError={e => e.target.style.display = 'none'} />
        </div>
      </div>
    );
  }

  return (
    <div className="rs-page">
      <div className="rs-card">
        <img src="/images/logo.png" alt="Sumathi Trends" className="rs-logo" onError={e => e.target.style.display = 'none'} />
        <h2 className="rs-title">Share Your Experience</h2>
        <p className="rs-sub">We'd love to hear what you think about Sumathi Trends!</p>

        {error && <div className="rs-error">{error}</div>}

        <form className="rs-form" onSubmit={handleSubmit}>
          <div className="rs-group">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="rs-group">
            <label>Rating</label>
            <div className="rs-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`rs-star ${star <= (hover || form.rating) ? 'active' : ''}`}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setForm(f => ({ ...f, rating: star }))}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="rs-group">
            <label>Your Review</label>
            <textarea
              placeholder="Tell us about your experience..."
              rows={5}
              value={form.message}
              onChange={handleMessageChange}
            />
            <span className={`rs-word-count ${wordCount >= 10 ? 'rs-word-count-max' : ''}`}>
              {wordCount}/10 words
            </span>
          </div>

          <button type="submit" className="rs-submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}