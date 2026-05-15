import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import { useWishlist } from '../../context/WishlistContext';
import { useState } from 'react';
import '../../styles/wishlist/Wishlist.css';

const toAgeGroup = (age) => {
  if (age === '0-2Y') return 'newborn';
  if (age === '3-6Y') return 'toddler';
  return 'junior';
};

const toSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function Wishlist() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, isLoaded } = useWishlist();
  const [activeNav, setActiveNav] = useState('mystuff');
  const [activeSubNav, setActiveSubNav] = useState('wishlist');

  if (!isLoaded) {
    return (
      <div className="account-loading-wrapper">
        <div className="account-loading-spinner"></div>
        <p>Loading your Wishlist...</p>
      </div>
    );
  }

  return (
    <div className="wl-page">
      <div className="wl-layout">
        
        <div className="wl-container">
          <Sidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            activeSubNav={activeSubNav}
            setActiveSubNav={setActiveSubNav}
          />

          <main className="wl-main">
            {/* Header section (Desktop & Mobile unified) */}
            <div className="wl-main-header">
              <button className="mobile-only-back" onClick={() => navigate('/account')}>
              </button>
              <div className="wl-header-text">
                <h1>My Wishlist <span className="wl-count-pill">({wishlist.length})</span></h1>
                <p>Manage your favorites and moving them to cart whenever you're ready.</p>
              </div>
            </div>

            {/* Empty State or List */}
            {wishlist.length === 0 ? (
              <div className="wl-empty">
                <div className="wl-empty-icon">
                  <img
                    src="/images/wishlist/heart.png"
                    alt="Empty wishlist"
                    className="wl-empty-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://cdn-icons-png.flaticon.com/512/4379/4379479.png';
                    }}
                  />
                </div>
                <p className="wl-empty-title">Your wishlist is empty</p>
                <p className="wl-empty-sub">Press the ♡ on any product to save it here.</p>
                <button className="wl-shop-btn" onClick={() => navigate('/collections')}>
                  Browse Collections
                </button>
              </div>
            ) : (
              <div className="wl-list">
                {wishlist.map(item => (
                  <div key={item.id} className="wl-item-card horizontal">
                    <div
                      className="wl-item-img-wrap"
                      onClick={() => navigate(`/collections/product/${item.productId || item.id}`)}
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="wl-item-img"
                      />
                    </div>
                    <div 
                      className="wl-item-info"
                      onClick={() => navigate(`/collections/product/${item.productId || item.id}`)}
                    >
                      <div className="wl-item-cat">{item.category}</div>
                      <div className="wl-item-name">{item.name}</div>
                      <div className="wl-item-price-row">
                        <span className="wl-item-price">₹{item.price}</span>
                        {item.oldPrice && (
                          <span className="wl-item-old-price">₹{item.oldPrice}</span>
                        )}
                      </div>
                    </div>
                    <button 
                      className="wl-item-remove-side" 
                      onClick={(e) => { e.stopPropagation(); removeFromWishlist(item.id); }}
                      title="Remove from wishlist"
                    >
                      <img src="/images/EmptyCart/delete.png" alt="delete" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
