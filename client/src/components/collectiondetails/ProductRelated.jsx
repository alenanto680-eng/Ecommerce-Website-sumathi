import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import '../../styles/collectiondetails/ProductRelated.css';

const API = '/api/products';

const CartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
  </svg>
);

function RelatedCard({ item }) {
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();

  const productId = item._id || item.id;
  const active = isWishlisted(productId);

  const formatPrice = (price) => typeof price === 'number' ? `₹${price}` : price;

  const handleCardClick = () => {
    navigate(`/collections/product/${item._id}`, {
      state: {
        fromLabel: 'You Might Also Like',
        restoreScroll: false,
      },
    });
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    
    // Pick first available size
    const inventory = item.inventory || {};
    const availableSize = Object.keys(inventory).find(size => inventory[size] > 0);
    
    // Pick first color if available
    const defaultColor = item.colors?.[0]?.name || 'Default';

    if (!availableSize) {
      alert("This item is currently out of stock.");
      return;
    }

    addToCart({
      id:    item._id,
      name:  item.name,
      price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[₹$,]/g, '')),
      size:  availableSize,
      color: defaultColor,
      img:   item.img,
      stock: item.stock || inventory[availableSize] || 0,
    });
    
    setAdded(true);
  };

  const handleGoToCart = (e) => {
    e.stopPropagation();
    if (auth.currentUser) {
      navigate('/cart');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="prelat-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="prelat-img-wrap">
        <img src={item.img} alt={item.name} className="prelat-img" />
        {item.age && <span className="prelat-age">AGE {item.age.replace(/Months?/ig, 'M').replace(/Years?/ig, 'Y')}</span>}
        <button 
          className={`prelat-wish${active ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleWishlist({ ...item, id: productId }); }}
          style={{ color: active ? '#e11d48' : 'inherit' }}
        >
          {active ? '♥' : '♡'}
        </button>
      </div>
      <div className="prelat-info">
        <div className="prelat-top-row">
          <span className="prelat-category">{item.category?.[0] || item.category}</span>
          <span className="prelat-price">{formatPrice(item.price)}</span>
        </div>
        <p className="prelat-name">{item.name}</p>
      </div>
      {!added ? (
        <button className="prelat-btn" onClick={handleQuickAdd}>
          <CartIcon /> Quick Add
        </button>
      ) : (
        <button className="prelat-btn prelat-btn-cart" onClick={handleGoToCart}>
          <CartIcon /> Go to Cart
        </button>
      )}
    </div>
  );
}

export default function ProductRelated() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API}/featured?section=youMightAlsoLike`)
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data); })
      .catch(() => {});
  }, []);

  if (!products.length) return null;

  return (
    <section className="prelat-wrapper">
      <h2 className="prelat-heading">YOU MIGHT ALSO LIKE</h2>
      <div className="prelat-grid">
        {products.map(item => <RelatedCard key={item._id} item={item} />)}
      </div>
    </section>
  );
}
