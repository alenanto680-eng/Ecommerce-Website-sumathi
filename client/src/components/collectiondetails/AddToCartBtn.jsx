import { useRef, useState } from 'react';
import '../../styles/collectiondetails/AddToCartBtn.css';

export default function AddToCartBtn({ onAdd, onBeforeAdd, onGoToBag, shirtColor = '#2D3E50', isAvailable = true }) {
  const [label, setLabel] = useState('ADD TO BAG');
  const btnRef = useRef(null);
  const animatingRef = useRef(false);

  const handleClick = () => {
    if (!isAvailable) return;
    if (animatingRef.current) return;
    if (onBeforeAdd && !onBeforeAdd()) return;
    animatingRef.current = true;

    const btn = btnRef.current;
    const set = (k, v) => btn.style.setProperty(k, v);
    const trans = (v) => btn.style.setProperty('--cart-transition', v);

    // ── reset all vars ──
    set('--text-o', '1');
    set('--text-x', '12px');
    set('--cart-x', '-48px');
    set('--cart-y', '0px');
    set('--cart-rotate', '0deg');
    set('--cart-scale', '.75');
    set('--cart-clip', '0px');
    set('--shirt-y', '-16px');
    set('--shirt-scale', '0');
    set('--bg-scale', '1');

    // t=0: squeeze bg
    set('--bg-scale', '.97');
    setTimeout(() => set('--bg-scale', '1'), 150);

    // t=150: shirt rises above cart, cart slides to center, text fades out
    setTimeout(() => {
      set('--shirt-scale', '1');
      set('--shirt-y', '-38px');   // rises above button center
      set('--cart-x', '0px');
      set('--cart-scale', '1');
      set('--text-o', '0');
    }, 150);

    // t=400: shirt hovers slightly
    setTimeout(() => set('--shirt-y', '-36px'), 400);

    // t=500: shirt drops INTO cart (just slightly above center, into the cart basket)
    setTimeout(() => {
      set('--shirt-y', '-4px');    // lands inside cart body, not below it
      set('--shirt-scale', '.7');
    }, 500);

    // t=750: shirt shrinks to nothing inside cart
    setTimeout(() => {
      set('--shirt-scale', '0');
      set('--shirt-y', '0px');
    }, 750);

    // t=900: cart bounce
    setTimeout(() => set('--cart-y', '3px'), 900);
    setTimeout(() => set('--cart-y', '0px'), 1020);
    // t=1100: cart flies OUT to the right, Success Message stays
    setTimeout(() => {
      trans('transform 0.7s cubic-bezier(.4,0,.2,1)');
      set('--cart-x', '500px');
      set('--cart-rotate', '-12deg');
      
      // SHOW SUCCESS TEXT ONLY (EMPTY PER USER REQUEST)
      set('--text-o', '0');
      set('--text-x', '0px'); 
      onAdd?.(); 
    }, 1100);

    // t=2500: Success Message disappears
    setTimeout(() => {
      set('--text-o', '0');
    }, 2500);

    // t=3200: Reset to original state (Cart + Text slide back)
    setTimeout(() => {
      trans('none');
      set('--cart-x', '-500px');
      set('--cart-rotate', '0deg');
      
      setTimeout(() => {
        trans('transform 0.8s cubic-bezier(.17,.67,.83,.67)');
        setLabel('ADD TO BAG');
        set('--text-o', '1');
        set('--text-x', '12px');
        set('--cart-x', '-48px');
        set('--cart-scale', '.75');
        animatingRef.current = false;
      }, 50);
    }, 2900);
  };

  return (
    <button
      ref={btnRef}
      className={`atc-btn${!isAvailable ? ' atc-disabled' : ''}`}
      onClick={handleClick}
      disabled={!isAvailable}
    >
      <span className="atc-bg" />

      {/* Shirt */}
      <span className="atc-shirt" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path
            fill={shirtColor}
            d="M4.99997 3L8.99997 1.5C8.99997 1.5 10.6901 3 12 3C13.3098 3 15 1.5 15 1.5L19 3L22.5 8L19.5 10.5L19 9.5L17.1781 18.6093C17.062 19.1901 16.778 19.7249 16.3351 20.1181C15.4265 20.925 13.7133 22.3147 12 23C10.2868 22.3147 8.57355 20.925 7.66487 20.1181C7.22198 19.7249 6.93798 19.1901 6.82183 18.6093L4.99997 9.5L4.5 10.5L1.5 8L4.99997 3Z"
          />
        </svg>
      </span>

      {/* Cart */}
      <span className="atc-cart" aria-hidden="true">
        <svg viewBox="0 0 36 26" width="36" height="26" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 2.5H6L10 18.5H25.5L28.5 7.5L7.5 7.5" stroke="white" strokeWidth="2" />
          <circle cx="11.5" cy="23" r="2" stroke="white" strokeWidth="1.5" />
          <circle cx="24" cy="23" r="2" stroke="white" strokeWidth="1.5" />
        </svg>
      </span>

      {/* Label */}
      <span className="atc-label" aria-live="polite">
        {!isAvailable ? 'Currently Unavailable' : label}
      </span>
    </button>
  );
}
