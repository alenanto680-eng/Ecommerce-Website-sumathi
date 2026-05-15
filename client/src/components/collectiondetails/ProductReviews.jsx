import { useEffect, useState } from 'react';
import '../../styles/collectiondetails/ProductReviews.css';

function Stars({ count }) {
  const rounded = Math.round(count);
  return (
    <span className="pr-stars">
      {'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}
    </span>
  );
}

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null); // { type: 'img'|'vid', url: string }

  useEffect(() => {
    if (!productId) return;
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/product-reviews/product/${productId}`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);

  if (loading) return <div className="pr-loading">Loading reviews...</div>;

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : 0;

  const bars = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return { stars: star, count };
  });

  const displayedReviews = isExpanded ? reviews : reviews.slice(0, 2);

  return (
    <section className="pr-wrapper">
      <h2 className="pr-heading">Rating &amp; Reviews</h2>

      <div className="pr-summary">
        <div className="pr-score-block">
          <p className="pr-score">{avgRating}</p>
          <Stars count={Number(avgRating)} />
          <p className="pr-total">({totalReviews} reviews)</p>
        </div>

        <div className="pr-bars">
          {bars.map(b => (
            <div key={b.stars} className="pr-bar-row">
              <span className="pr-bar-label">{b.stars}</span>
              <div className="pr-bar-track">
                <div
                  className="pr-bar-fill"
                  style={{ width: totalReviews > 0 ? `${(b.count / totalReviews) * 100}%` : '0%' }}
                />
              </div>
              <span className="pr-bar-count">{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pr-list">
        {reviews.length === 0 ? (
          <p className="pr-empty">No reviews yet. Be the first to review!</p>
        ) : (
          <>
            {displayedReviews.map(r => (
              <div key={r._id} className="pr-card">
                <div className="pr-card-header">
                  <div className="pr-avatar-placeholder">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="pr-name">{r.name}</p>
                    <Stars count={r.rating} />
                  </div>
                  <p className="pr-date">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="pr-text">{r.message}</p>

                {(r.images?.length > 0 || r.video) && (
                  <div className="pr-media">
                    {r.images?.map((img, i) => (
                      <div key={i} className="pr-media-item" onClick={() => setSelectedMedia({ type: 'img', url: img })}>
                        <img src={img} alt={`Review ${i}`} />
                      </div>
                    ))}
                    {r.video && (
                      <div className="pr-media-item" onClick={() => setSelectedMedia({ type: 'vid', url: r.video })}>
                        <div className="pr-video-overlay">▶</div>
                        <video src={r.video} muted />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {totalReviews > 2 && (
              <div className="pr-view-more-container">
                <button
                  className="pr-view-more-btn"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Show less' : 'View more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div className="pr-lightbox-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="pr-lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="pr-lightbox-close" onClick={() => setSelectedMedia(null)}>✕</button>
            {selectedMedia.type === 'img' ? (
              <img src={selectedMedia.url} alt="Full view" className="pr-lightbox-media" />
            ) : (
              <video src={selectedMedia.url} controls autoPlay className="pr-lightbox-media" />
            )}
          </div>
        </div>
      )}
    </section>
  );
}