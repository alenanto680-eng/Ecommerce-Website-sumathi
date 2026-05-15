import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItems from '../../components/cart/CartItems';
import OrderSummary from '../../components/cart/OrderSummary';
import CartYouMightAlsoLike from '../../components/cart/CartYouMightAlsoLike';
import EmptyCart from '../../components/cart/EmptyCart';
import AddressSidebar from '../../components/collectiondetails/AddressSidebar';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { MapPin } from 'lucide-react';
import '../../styles/cart/CartPage.css';

const API = '/api';

const FREE_SHIPPING_THRESHOLD = 0; // Everything is Free Shipping!
const GIFT_WRAP_COST = 50;

// Keys used to persist the selected delivery address
const ACTIVE_KEY = 'sumathi_active_address';   // set by product detail page
const SELECTED_KEY = 'sumathi_selected_address';  // set by cart page

export default function CartPage() {
  const { cartItems, updateQty, removeItem, subtotal } = useCart();
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  /* ── Save selection to localStorage and state ── */
  const handleSelectAddress = (addr) => {
    setSelectedAddress(addr);
    localStorage.setItem(SELECTED_KEY, JSON.stringify(addr));
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(addr)); // keep both keys in sync
  };

  /* ── Load address on mount / auth change ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await fetch(`${API}/client-auth/addresses/${user.uid}`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          const data = await res.json();
          if (data.success && data.addresses) {
            setUserInfo(data.user);

            // Priority: Manual selection (if still valid) > DB Default
            const savedSelection = localStorage.getItem(SELECTED_KEY) || localStorage.getItem(ACTIVE_KEY);
            let manualAddr = null;
            if (savedSelection) {
              try {
                const parsed = JSON.parse(savedSelection);
                manualAddr = data.addresses.find(a => String(a.id || a._id) === String(parsed.id || parsed._id));
              } catch (e) {}
            }

            if (manualAddr) {
              setSelectedAddress(manualAddr);
            } else {
              const defAddr = data.addresses.find(a => a.isDefault) || data.addresses[0];
              if (defAddr) {
                setSelectedAddress(defAddr);
                localStorage.setItem(SELECTED_KEY, JSON.stringify(defAddr));
                localStorage.setItem(ACTIVE_KEY, JSON.stringify(defAddr));
              }
            }
            return;
          }
        } catch (e) {
          console.error("CartPage address sync error", e);
        }
      }

      // Guest fallback
      const savedSelection = localStorage.getItem(SELECTED_KEY) || localStorage.getItem(ACTIVE_KEY);
      if (savedSelection) {
        try {
          setSelectedAddress(JSON.parse(savedSelection));
          return;
        } catch (e) {}
      }

      try {
        const saved = JSON.parse(localStorage.getItem('sumathi_addresses') || '[]');
        const defAddr = saved.find(a => a.isDefault) || saved[0];
        if (defAddr) {
          setSelectedAddress(defAddr);
          localStorage.setItem(SELECTED_KEY, JSON.stringify(defAddr));
          localStorage.setItem(ACTIVE_KEY, JSON.stringify(defAddr));
        }
      } catch (e) {}
    });
    return () => unsub();
  }, []);

  /* ── Live sync: clear selected address if it was deleted ── */
  useEffect(() => {
    const handleAddressChange = (e) => {
      const { deletedId, addresses: updatedList } = e.detail || {};

      if (!deletedId) return;

      setSelectedAddress(prev => {
        if (!prev) return null;
        const prevId = String(prev.id || prev._id || '');
        if (prevId && prevId === String(deletedId)) {
          // The selected address was deleted — clear it everywhere
          localStorage.removeItem(SELECTED_KEY);
          localStorage.removeItem(ACTIVE_KEY);

          // Auto-promote the default from the updated list (if any)
          if (Array.isArray(updatedList) && updatedList.length > 0) {
            const next = updatedList.find(a => a.isDefault) || null;
            if (next) {
              localStorage.setItem(SELECTED_KEY, JSON.stringify(next));
              localStorage.setItem(ACTIVE_KEY, JSON.stringify(next));
            }
            return next;
          }
          return null;
        }
        return prev; // unaffected — keep as-is
      });
    };

    // Same-tab broadcast from ManageAddresses
    window.addEventListener('sumathi_addresses_changed', handleAddressChange);

    // Cross-tab: native storage event
    const handleStorageEvent = (e) => {
      if (
        (e.key === SELECTED_KEY || e.key === ACTIVE_KEY) &&
        e.newValue === null
      ) {
        setSelectedAddress(null);
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('sumathi_addresses_changed', handleAddressChange);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  /* ── Scroll restoration ── */
  useEffect(() => {
    if (sessionStorage.getItem('restoreCartScroll') === '1') {
      sessionStorage.removeItem('restoreCartScroll');
      let attempts = 0;
      const tryScroll = () => {
        const el = document.querySelector('.cyl-section');
        if (el && el.getBoundingClientRect().height > 0) {
          const navEl = document.querySelector('nav');
          const navHeight = navEl ? navEl.getBoundingClientRect().height : 80;
          const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
        } else if (attempts < 60) {
          attempts++;
          setTimeout(tryScroll, 50);
        }
      };
      requestAnimationFrame(tryScroll);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  if (cartItems.length === 0 && !isPaymentSuccess) return <EmptyCart />;

  const shipping = 0; // Forced to zero per user request
  const giftCost = giftWrapping ? GIFT_WRAP_COST : 0;
  const total = subtotal + shipping + giftCost;

  return (
    <div className="cp-page">
      <div className="cp-inner">
        <h1 className="cp-title">
          Your Shopping Bag
          <span className="cp-count">({cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'})</span>
        </h1>

        <div className="cp-grid">
          <div className="cp-left-col">

            {/* ── Delivery Address Bar ── */}
            <div className="cp-addr-bar">
              <div className="cp-addr-bar-left">
                <MapPin size={18} className="cp-addr-pin" />
                <div className="cp-addr-bar-content">
                  {selectedAddress ? (
                    <>
                      <p className="cp-addr-line-1">
                        Deliver to: <strong>{selectedAddress.name}</strong>, {selectedAddress.pincode}
                      </p>
                      <p className="cp-addr-line-2">
                        {selectedAddress.line1}, {selectedAddress.city}
                      </p>
                    </>
                  ) : (
                    <p className="cp-addr-none">No delivery address selected</p>
                  )}
                </div>
              </div>
              <button
                className="cp-addr-change-btn-link"
                onClick={() => setIsSidebarOpen(true)}
              >
                {selectedAddress ? 'CHANGE' : 'ADD NEW'}
              </button>
            </div>

            <CartItems
              items={cartItems}
              onUpdateQty={updateQty}
              onRemove={removeItem}
              onGiftChange={setGiftWrapping}
            />
          </div>

          <OrderSummary
            subtotal={subtotal}
            shipping={shipping}
            giftWrapping={giftWrapping}
            giftCost={giftCost}
            total={total}
            user={auth.currentUser ? {
              uid: auth.currentUser.uid,
              name: userInfo?.name || auth.currentUser.displayName,
              email: userInfo?.email || auth.currentUser.email,
              phone: userInfo?.phone || auth.currentUser.phoneNumber,
            } : null}
            cartItems={cartItems}
            selectedAddress={selectedAddress}
            onPaymentSuccess={setIsPaymentSuccess}
            setVerifying={setVerifying}
          />
        </div>

        <AddressSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectAddress={handleSelectAddress}
        />

        <CartYouMightAlsoLike />
      </div>

      {verifying && (
        <div className="os-verifying-overlay">
          <div className="os-verifying-content">
            <div className="os-spinner-container">
              <div className="os-main-spinner"></div>
              <div className="os-inner-spinner"></div>
            </div>
            <h2>Processing Your Payment</h2>
            <p>Do not close this window.</p>
            <div className="os-loading-bar">
              <div className="os-loading-progress"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}