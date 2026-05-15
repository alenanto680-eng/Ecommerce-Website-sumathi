import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import '../../styles/homepage/NewArrivals.css';

const API = '/api/products';

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/featured?section=newArrivals`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setProducts(data.data);
      })
      .catch(console.error);
  }, []);

  if (products.length === 0) return null;

  const handleCardClick = (product) => {
    // Save the section id so Navbar can scroll to it by element lookup
    // This is more reliable than saving a pixel offset
    sessionStorage.setItem('restoreToSection', 'new-arrivals');
    navigate(`/collections/product/${product._id}`, {
      state: {
        fromLabel: 'New Arrivals',
        restoreScroll: true,
      },
    });
  };

  return (
    <section id="new-arrivals" ref={sectionRef} className="new-arrivals-section">
      <div className="section-inner">

        <div className="new-arrivals-header">
          <h2 className="new-arrivals-title">
            <strong>New</strong> Arrivals
          </h2>
          <p className="new-arrivals-sub">
            Fresh styles just landed — handpicked for your little ones.
          </p>
        </div>

        <div className="na-grid">
          {products.map((product, i) => (
            <div
              key={product._id || i}
              className="na-card"
              onClick={() => handleCardClick(product)}
            >
              <div className="na-img-wrap">
                <img src={product.img} alt={product.name} />
                {product.age && (
                  <span className="na-age">AGE {product.age.replace(/Months?/ig, 'M').replace(/Years?/ig, 'Y')}</span>
                )}
                <button 
                  className={`na-wish-btn${isWishlisted(product._id) ? ' active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleWishlist({ ...product, id: product._id }); }}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'white', border: 'none', width: '30px', height: '30px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    color: isWishlisted(product._id) ? '#e11d48' : 'inherit',
                    fontSize: '0.9rem', zIndex: 2
                  }}
                >
                  {isWishlisted(product._id) ? '♥' : '♡'}
                </button>
              </div>
              <div className="na-card-info">
                {(() => {
                  const firstColor = product.colors?.[0];
                  const displayName = (firstColor?.productName && firstColor.productName.trim() !== '') ? firstColor.productName : product.name;
                  const displayPrice = (firstColor?.price != null && firstColor.price !== '') ? firstColor.price : product.price;
                  return (
                    <>
                      <div className="na-top-row">
                        <span className="na-category">{product.category}</span>
                        <span className="na-card-price">₹{displayPrice}</span>
                      </div>
                      <div className="na-card-name">{displayName}</div>
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
