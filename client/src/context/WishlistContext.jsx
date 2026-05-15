import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

const WishlistContext = createContext();

const STORAGE_KEY = 'sumathi_wishlist';

function loadLocalWishlist() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(loadLocalWishlist);
  const [isLoaded, setIsLoaded] = useState(false);
  const wasLoggedIn = useRef(false);
  const navigate = useNavigate();

  // 1. Persist to localStorage always (for instant feedback on refresh)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // 2. Fetch wishlist from DB on login and merge/overwrite
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        wasLoggedIn.current = true;
        try {
          const res = await authFetch(`/api/client-auth/profile/${user.uid}`);
          const data = await res.json();
          if (data.success && data.user) {
            const dbWishlist = (data.user.wishlist || []).map(item => ({
              ...item,
              id: item.productId || item._id || item.id
            }));
            
            // MERGE LOGIC: Combine local items with DB items to prevent data loss
            setWishlist(prev => {
              const merged = [...dbWishlist];
              prev.forEach(localItem => {
                const alreadyExists = merged.some(dbItem => dbItem.id === localItem.id);
                if (!alreadyExists) {
                  merged.push(localItem);
                }
              });
              return merged;
            });
          }
        } catch (err) {
          console.error('Failed to fetch wishlist:', err);
        } finally {
          setIsLoaded(true);
        }
      } else {
        // If transitioning from logged in to logged out, clear the wishlist
        if (wasLoggedIn.current) {
          setWishlist([]);
          localStorage.removeItem(STORAGE_KEY);
          wasLoggedIn.current = false;
        }
        setIsLoaded(true);
      }
    });
    return () => unsub();
  }, []);

  // 3. Sync wishlist to DB whenever it changes (only for logged in users)
  useEffect(() => {
    const user = auth.currentUser;
    // CRITICAL: We only sync if we are logged in AND the initial fetch has finished.
    if (!user || !isLoaded) return;

    const syncTimeout = setTimeout(async () => {
      try {
        const syncData = wishlist.map(item => ({
          productId: item.id || item._id,
          name: item.name,
          img: item.img,
          price: String(item.price),
          category: item.category
        }));

        await authFetch('/api/client-auth/sync-wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, wishlist: syncData })
        });
      } catch (err) {
        console.error('Failed to sync wishlist:', err);
      }
    }, 1500); // 1.5s debounce to avoid flickering

    return () => clearTimeout(syncTimeout);
  }, [wishlist, isLoaded]);

  const triggerImmediateSync = async (newWishlist) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const syncData = newWishlist.map(item => ({
        productId: item.id || item._id,
        name: item.name,
        img: item.img,
        price: String(item.price),
        category: Array.isArray(item.category) ? item.category[0] : item.category
      }));
      await authFetch('/api/client-auth/sync-wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, wishlist: syncData })
      });
    } catch (err) {
      console.error('Failed to immediate sync wishlist:', err);
    }
  };

  const toggleWishlist = (product) => {
    if (!auth.currentUser) {
      alert("Please login to add products to your wishlist");
      navigate('/login');
      return;
    }

    setWishlist(prev => {
      const productId = product.id || product._id;
      const exists = prev.find(p => (p.id === productId || p._id === productId));
      let newWishlist;
      if (exists) {
        newWishlist = prev.filter(p => (p.id !== productId && p._id !== productId));
      } else {
        newWishlist = [...prev, { ...product, id: productId }];
      }
      triggerImmediateSync(newWishlist);
      return newWishlist;
    });
  };

  const removeFromWishlist = (id) => {
    setWishlist(prev => {
      const newWishlist = prev.filter(p => (p.id !== id && p._id !== id));
      triggerImmediateSync(newWishlist);
      return newWishlist;
    });
  };

  const isWishlisted = (id) => wishlist.some(p => (p.id === id || p._id === id));

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, removeFromWishlist, isWishlisted, isLoaded }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
