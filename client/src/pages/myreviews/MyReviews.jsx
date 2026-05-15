import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../../styles/myreviews/MyReviews.css';

export default function MyReviews() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('mystuff');
  const [activeSubNav, setActiveSubNav] = useState('reviews');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const headers = { 'Authorization': `Bearer ${idToken}` };

          // 1. Fetch user reviews
          const revRes = await fetch(`/api/product-reviews/user/${user.uid}`, { headers });
          const revData = await revRes.json();
          const userReviews = revData.success ? revData.data : [];
          setReviews(userReviews);

          // 2. Fetch user orders to find things to review
          const ordRes = await fetch(`/api/payment/user-orders/${user.uid}`, { headers });
          const ordData = await ordRes.json();

          if (ordData.success) {
            // Get all delivered items
            const deliveredOrders = ordData.data.filter(o => o.trackingStatus?.toLowerCase() === 'delivered');
            const allItems = [];
            deliveredOrders.forEach(order => {
              order.items.forEach(item => {
                // Attach order for context
                allItems.push({ ...item, order });
              });
            });

            // Filter out items already reviewed (match by productId)
            const reviewedProductIds = new Set(userReviews.map(r => r.productId?._id || r.productId));
            const toReview = allItems.filter(item => !reviewedProductIds.has(item.productId));

            // Remove duplicates (same product in different orders/same order)
            const uniqueToReview = [];
            const seenIds = new Set();
            for (const item of toReview) {
              if (!seenIds.has(item.productId)) {
                uniqueToReview.push(item);
                seenIds.add(item.productId);
              }
            }
            setPendingReviews(uniqueToReview);
          }
        } catch (err) {
          console.error("MyReviews: Data fetch error", err);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();
      
      const res = await fetch(`/api/product-reviews/${reviewId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.filter(r => r._id !== reviewId));
        // Also refresh pending reviews list
        window.location.reload(); 
      } else {
        alert(data.message || "Failed to delete review");
      }
    } catch (err) {
      console.error("Delete Review Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="account-loading-wrapper">
        <div className="account-loading-spinner"></div>
        <p>Loading your Reviews...</p>
      </div>
    );
  }

  return (
    <div className="mr-page">
      <div className="mr-container">
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          activeSubNav={activeSubNav}
          setActiveSubNav={setActiveSubNav}
        />

        <main className="mr-main">
          {/* Header section (Desktop & Mobile unified) */}
          <div className="mr-main-header">
            <button className="mobile-only-back" onClick={() => navigate('/account')}>
            </button>
            <div className="mr-header-text">
              <h1>My Reviews & Ratings <span className="mr-count-pill">({reviews.length})</span></h1>
              <p>Share your thoughts on products you've purchased to help others make the right choice.</p>
            </div>
          </div>

          {/* User's Reviews */}
          <div className="mr-reviews-section">
            {reviews.length === 0 ? (
              <div className="mr-empty-section">
                <div className="mr-icon-wrap">
                  <img
                    src="/images/reviews/no-reviews.png"
                    alt="No Reviews"
                    className="mr-empty-img"
                  />
                </div>
                <h2 className="mr-empty-title">No Reviews &amp; Ratings</h2>
                <p className="mr-empty-text">
                  You haven't shared your thoughts on any products yet. Your feedback helps other parents find the perfect fit for their little ones!
                </p>
              </div>
            ) : (
              <div className="mr-reviews-list">
                {reviews.map(r => (
                  <div key={r._id} className="mr-review-card">
                    <div className="mr-review-product">
                      <img src={r.productId?.img || '/images/logo/logo.png'} alt={r.productId?.name} className="mr-rev-prod-img" />
                      <div className="mr-rev-prod-info">
                        <span className="mr-rev-prod-name">{r.productId?.name || 'Product Details Not Available'}</span>
                        <div className="mr-review-header">
                          <div className="mr-stars">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </div>
                          <span className="mr-review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button className="mr-delete-btn" title="Delete Review" onClick={() => handleDeleteReview(r._id)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>

                    <div className="mr-review-content">
                      <p className="mr-review-msg">{r.message}</p>
                      
                      {((r.images && r.images.length > 0) || r.video) && (
                        <div className="mr-review-media">
                          {r.images?.map((url, idx) => (
                            <div key={idx} className="mr-media-box">
                              <img src={url} alt="Review attachment" onClick={() => window.open(url, '_blank')} />
                            </div>
                          ))}
                          {r.video && (
                            <div className="mr-media-box mr-video-box" onClick={() => window.open(r.video, '_blank')}>
                              <video src={r.video} muted />
                              <div className="mr-video-play-overlay">▶</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Reviews Section */}
          <div className="mr-suggested-section">
            <h3 className="mr-suggested-title">Orders you might be interested in reviewing</h3>
            <div className="mr-product-grid">
              {pendingReviews.length === 0 ? (
                <p className="mr-no-pending">No new orders to review at the moment.</p>
              ) : (
                pendingReviews.map(item => (
                  <div key={item.productId || item._id} className="mr-product-card">
                    <img src={item.img || item.photo} alt={item.name} className="mr-product-img" />
                    <div className="mr-product-info">
                      <p className="mr-product-name">{item.name}</p>
                      <div className="mr-stars-static">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className="mr-star-empty">☆</span>
                        ))}
                      </div>
                      <button
                        className="mr-rate-btn"
                        onClick={() => navigate('/account/write-review', { state: { order: item.order, item } })}
                      >
                        Rate and Review ›
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}