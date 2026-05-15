import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import '../../styles/collections/YouMightAlsoLike.css';

const API = '/api/products';

function FavoriteCard({ product }) {
  const navigate = useNavigate();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const productId = product._id || product.id;
  const active = isWishlisted(productId);

  const formatPrice = (price) =>
    typeof price === 'number' ? `₹${price}` : price;

  return (
    <div
      className="ymll-card"
      onClick={() =>
        navigate(`/collections/product/${product._id}`, {
          state: {
            fromLabel: 'More To Love',
            restoreScroll: false,
          },
        })
      }
    >
      <div className="ymll-img-wrap">
        <img src={product.img} alt={product.name} />
        {product.age && <span className="ymll-age">AGE {product.age.replace(/Months?/ig, 'M').replace(/Years?/ig, 'Y')}</span>}
        <button 
          className={`ymll-wish${active ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleWishlist({ ...product, id: productId }); }}
          style={{ color: active ? '#e11d48' : 'inherit' }}
        >
          {active ? '♥' : '♡'}
        </button>
      </div>
      <div className="ymll-info">
        <div className="ymll-top-row">
          <span className="ymll-category">{product.category}</span>
          <span className="ymll-price">{formatPrice(product.price)}</span>
        </div>
        <div className="ymll-name">{product.name}</div>
      </div>
    </div>
  );
}

export default function YouMightAlsoLike() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API}/featured?section=currentFavorites`)
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data); })
      .catch(() => {});
  }, []);

  if (!products.length) return null;

  return (
    <section className="ymll-section">
      <div className="section-inner">
        <div className="ymll-header">
          <div>
            <h2 className="ymll-title">More To Love</h2>
            <p className="ymll-sub">
              Handpicked treasures we think you'll adore
            </p>
          </div>
        </div>

        <div className="ymll-grid">
          {products.map(p => (
            <FavoriteCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
