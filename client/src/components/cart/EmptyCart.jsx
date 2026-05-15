import { Link } from 'react-router-dom';
import '../../styles/cart/EmptyCart.css';

export default function EmptyCart() {
  return (
    <div className="ec-page">
      <div className="ec-inner">
        <img src="/images/EmptyCart/empty-cart.png" alt="Empty Cart" className="ec-img" />
        <h2 className="ec-title">Your shopping bag is empty</h2>
        <p className="ec-sub">It looks like you haven't added any items to your cart yet. Explore our latest collections for your little ones.</p>
        <Link to="/collections" className="ec-btn">CONTINUE SHOPPING</Link>
      </div>
    </div>
  );
}
