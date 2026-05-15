import { useState } from 'react';
import '../../styles/cart/CartItems.css';

export default function CartItems({ items, onUpdateQty, onRemove, onGiftChange }) {
  const [giftSelected, setGiftSelected] = useState(false);
  const [giftMessage,  setGiftMessage]  = useState('');

  const handleGiftToggle = () => {
    const next = !giftSelected;
    setGiftSelected(next);
    onGiftChange(next); // notify parent
  };

  return (
    <div className="ci-wrapper">
      {items.map(item => (
        <div key={`${item.id}-${item.size}-${item.color}`} className="ci-row">
          <img src={item.img} alt={item.name} className="ci-img" />
          <div className="ci-details">
            <div className="ci-top">
              <div>
                <p className="ci-name">{item.name}</p>
                <p className="ci-meta">Size: {item.size} | Color: {item.color}</p>
              </div>
              <button className="ci-remove" onClick={() => onRemove(item.id, item.size, item.color)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
            <div className="ci-bottom">
              <div className="ci-qty">
                <button onClick={() => onUpdateQty(item.id, item.size, item.color, -1)}>−</button>
                <span>{item.qty}</span>
                <button 
                  onClick={() => onUpdateQty(item.id, item.size, item.color, +1)}
                  disabled={item.qty >= item.stock}
                  style={{ opacity: item.qty >= item.stock ? 0.3 : 1, cursor: item.qty >= item.stock ? 'not-allowed' : 'pointer' }}
                  title={item.qty >= item.stock ? 'Maximum stock reached' : ''}
                >+</button>
              </div>
              <p className="ci-price">
                ₹{(parseFloat(String(item.price).replace(/[₹$,]/g, '')) * item.qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Gift Wrapping */}
      <div className="ci-gift">
        <div className="ci-gift-header">
          <button
            className={`ci-gift-toggle${giftSelected ? ' selected' : ''}`}
            type="button"
            onClick={handleGiftToggle}
          >
            {giftSelected && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
          <div className="ci-gift-title-wrap">
            <div className="ci-gift-title-row">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 12 20 22 4 22 4 12"/>
                <rect x="2" y="7" width="20" height="5"/>
                <path d="M12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
              </svg>
              <span className="ci-gift-title">Add Gift Wrapping</span>
              <span className="ci-gift-cost">(+₹50.00)</span>
            </div>
            <p className="ci-gift-desc">Make it special with our premium gift box and a handwritten card.</p>
          </div>
        </div>

        <div className="ci-gift-message">
          <p className="ci-gift-label">PERSONALIZED MESSAGE</p>
          <textarea
            className="ci-gift-input"
            placeholder="Write your heartfelt message here..."
            rows={3}
            value={giftMessage}
            onChange={e => setGiftMessage(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
