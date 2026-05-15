import { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/myorders/WriteReview.css';
import { authFetch } from '../../utils/authFetch';

const FAQ = [
  {
    q: 'Have you used this product?',
    a: 'Share specific details about the fit, fabric quality, and how it holds up after washing. Honest feedback helps other parents make the best choice for their little ones.',
    defaultOpen: true,
  },
  { q: 'Why review a product?', a: 'Your review helps other parents in our community make informed decisions and helps us improve our products.' },
  { q: 'How to review a product?', a: 'Rate the product from 1–5 stars, write a short description of your experience, add your name, and optionally upload a photo or video.' },
];

function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="wr-faq-list">
      {items.map((item, i) => (
        <div key={i} className="wr-faq-item">
          <button className="wr-faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
            <span className={open === i ? 'wr-faq-q-text active' : 'wr-faq-q-text'}>{item.q}</span>
            <span className={`wr-faq-chevron ${open === i ? 'open' : ''}`} />
          </button>
          {open === i && <p className="wr-faq-a">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="wr-stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className={`wr-star ${s <= (hover || value) ? 'wr-star--filled' : ''}`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >★</span>
      ))}
    </div>
  );
}

export default function WriteReview() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order || null;
  const item = location.state?.item || null;
  const initRating = location.state?.rating || 0;

  const [rating, setRating] = useState(initRating);
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [images, setImages] = useState([]);      // Array of file objects
  const [previews, setPreviews] = useState([]);    // Array of base64/blob for previews
  const [video, setVideo] = useState(null);    // Single video file
  const [vPreview, setVPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFile = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...images];
    const newPreviews = [...previews];
    let newVideo = video;
    let newVPreview = vPreview;

    files.forEach(f => {
      if (f.type.startsWith('image/')) {
        if (newImages.length < 4) {
          newImages.push(f);
          newPreviews.push(URL.createObjectURL(f));
        }
      } else if (f.type.startsWith('video/')) {
        if (!newVideo) {
          newVideo = f;
          newVPreview = URL.createObjectURL(f);
        }
      }
    });

    setImages(newImages);
    setPreviews(newPreviews);
    setVideo(newVideo);
    setVPreview(newVPreview);
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  };

  const removeVideo = () => {
    setVideo(null);
    setVPreview(null);
  };

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a star rating.');
      return;
    }
    if (!description.trim()) {
      setError('Please write a description.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      setError('Name should contain only alphabets.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const userId = auth.currentUser?.uid || '';

    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('rating', Number(rating));
    fd.append('message', description.trim());
    if (item?.productId) fd.append('productId', item.productId);
    if (order?.orderId) fd.append('orderId', order.orderId);
    fd.append('uid', userId || '');

    // Add files
    images.forEach(f => fd.append('attachments', f));
    if (video) fd.append('attachments', video);

    try {
      // Use authFetch to include the Authorization header
      const response = await authFetch('/api/product-reviews/submit', {
        method: 'POST',
        body: fd
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(() => navigate('/account/orders'), 3000);
      } else {
        setError(data.message || 'Error submitting review');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wr-page">

      {/* Success overlay - Floating Center */}
      {submitted && (
        <div className="wr-success-overlay">
          <div className="wr-success-box">
            <div className="wr-success-icon">✓</div>
            <h2 className="wr-success-title">Review Submitted!</h2>
            <p className="wr-success-msg">Thank you for sharing your experience. Redirecting you back to orders...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="wr-header-center">
        <h1 className="wr-page-title">Write a Review</h1>

        {item && (
          <div className="wr-product-strip">
            <img
              src={item.img || item.photo}
              alt={item.name}
              className="wr-product-img"
            />
            <div className="wr-product-info">
              <div className="wr-product-name">{item.name}</div>
              <div className="wr-product-meta">
                {item.color && `Color: ${item.color}`}{item.size && ` | Size: ${item.size}`}
              </div>
              <div className="wr-product-price">
                {String(item.price).includes('₹') ? item.price : `₹${parseFloat(String(item.price).replace(/[₹$,]/g, '')).toLocaleString()}`}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="wr-body">

        {/* LEFT — tips */}
        <div className="wr-left">
          <div className="wr-tips-card">
            <div className="wr-tips-title">
              What makes a good review
            </div>
            <Accordion items={FAQ} />
          </div>

          <div className="wr-help-card">
            <div className="wr-help-top">
              <div>
                <div className="wr-help-title">Need help with an order?</div>
                <div className="wr-help-sub">Contact our dedicated support team for issues with shipping, sizing, or returns.</div>
              </div>
            </div>
            <button className="wr-help-link" onClick={() => { }}>Visit Help Center</button>
          </div>
        </div>

        {/* RIGHT — review form */}
        <div className="wr-right">

          {/* Star rating */}
          <div className="wr-form-card">
            <div className="wr-rating-title">Rate this product</div>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Review form */}
          <div className="wr-form-card">
            <div className="wr-form-title">Review this product</div>

            <div className="wr-field">
              <label className="wr-label">Description</label>
              <textarea
                className="wr-textarea"
                placeholder="What did you like or dislike? How was the fit?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="wr-field">
              <label className="wr-label">Name</label>
              <input
                className="wr-input"
                type="text"
                placeholder="Your display name"
                value={name}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, '');
                  setName(cleaned);
                }}
              />
            </div>

            <div className="wr-field">
              <label className="wr-label">Add photos or a video (Optional)</label>
              <div className="wr-media-grid">
                {previews.map((p, idx) => (
                  <div key={idx} className="wr-media-preview-box">
                    <img src={p} alt="preview" />
                    <button className="wr-media-remove" onClick={() => removeImage(idx)}>×</button>
                  </div>
                ))}
                {vPreview && (
                  <div className="wr-media-preview-box">
                    <video src={vPreview} className="wr-media-video" />
                    <button className="wr-media-remove" onClick={removeVideo}>×</button>
                  </div>
                )}
                {(previews.length < 4 || !vPreview) && (
                  <label className="wr-upload-box-small">
                    <span className="wr-upload-icon">+</span>
                    <input type="file" accept="image/*,video/*" multiple onChange={handleFile} hidden />
                  </label>
                )}
              </div>
              <span className="wr-upload-hint">Upload up to 4 photos and 1 video. Accepted formats: JPG, PNG, MP4.</span>
            </div>

            {error && <div className="wr-error">{error}</div>}

            <button className="wr-submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
            </button>
            <p className="wr-terms">
              By submitting, you agree to our{" "}
              <span
                className="wr-link"
                onClick={() => navigate('/account/policy/terms')}
              >
                Terms of Service
              </span>{" "}
              and{" "}
              <span
                className="wr-link"
                onClick={() => navigate('/account/policy/privacy')}
              >
                Privacy Policy
              </span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}