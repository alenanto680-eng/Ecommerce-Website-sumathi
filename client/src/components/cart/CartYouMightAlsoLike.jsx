import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/cart/CartYouMightAlsoLike.css';

const API = '/api/products';

const CartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
  </svg>
);

function AlsoLikeCard({ product }) {
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price) => typeof price === 'number' ? `₹${price}` : price;

  const handleCardClick = () => {
    // Save that we came from the cart page — restore to top of cart on back
    sessionStorage.setItem('restoreCartScroll', '1');
    navigate(`/collections/product/${product._id}`, {
      state: {
        fromLabel: 'Cart',
        fromCart: true,
        restoreScroll: true,
      },
    });
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    
    // Pick the first available size from inventory
    const inventory = product.inventory || {};
    const availableSize = Object.keys(inventory).find(size => inventory[size] > 0);
    
    // Pick the first color if available
    const defaultColor = product.colors?.[0]?.name || 'Default';

    if (!availableSize) {
      alert("This item is currently out of stock.");
      return;
    }

    addToCart({
      id:    product._id,
      name:  product.name,
      price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[₹$,]/g, '')),
      size:  availableSize,
      color: defaultColor,
      img:   product.img,
      stock: product.stock || inventory[availableSize] || 0,
    });
    
    setAdded(true);
  };

  const handleGoToCart = (e) => {
    e.stopPropagation();
    // Already on cart page, just scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Also navigate just in case (to reset any sub-routes if they exist)
    navigate('/cart');
  };

  return (
    <div className="cyl-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="cyl-img-wrap">
        <img src={product.img} alt={product.name} />
        {product.age && <span className="cyl-age">Ages {product.age}</span>}
        <button className="cyl-wish" onClick={(e) => e.stopPropagation()}>♡</button>
      </div>
      <div className="cyl-info">
        <div className="cyl-top-row">
          <span className="cyl-category">{product.category?.[0] || product.category}</span>
          <span className="cyl-price">{formatPrice(product.price)}</span>
        </div>
        <div className="cyl-name">{product.name}</div>
      </div>
      {!added ? (
        <button className="cyl-add-btn" onClick={handleQuickAdd}>
          <CartIcon /> Quick Add
        </button>
      ) : (
        <button className="cyl-add-btn cyl-go-cart" onClick={handleGoToCart}>
          <CartIcon /> Go to Cart
        </button>
      )}
    </div>
  );
}

export default function CartYouMightAlsoLike() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API}/featured?section=cartAlsoLike`)
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data); })
      .catch(() => {});
  }, []);

  if (!products.length) return null;

  return (
    <section className="cyl-section">
      <h2 className="cyl-heading">YOU MIGHT ALSO LOVE</h2>
      <div className="cyl-grid">
        {products.map(p => <AlsoLikeCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}
