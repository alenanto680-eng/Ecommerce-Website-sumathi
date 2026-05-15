// hooks/useAddressSync.js
//
// Drop this hook into any page/component that holds `selectedAddress` in state.
// It listens for the 'sumathi_addresses_changed' event (fired by ManageAddresses
// after every delete or save) and clears the selected address if it was deleted.
//
// Usage in your ProductDetail page:
//
//   const [selectedAddress, setSelectedAddress] = useState(() => {
//     try { return JSON.parse(localStorage.getItem('sumathi_active_address')) || null; }
//     catch { return null; }
//   });
//
//   useAddressSync(selectedAddress, setSelectedAddress);

import { useEffect } from 'react';

/**
 * @param {object|null} selectedAddress   - current delivery address in state
 * @param {Function}    setSelectedAddress - setter for that state
 */
export function useAddressSync(selectedAddress, setSelectedAddress) {
    useEffect(() => {
        const handleAddressChange = (e) => {
            const { deletedId } = e.detail || {};

            if (!deletedId) return;

            // If the currently selected delivery address was the one deleted → clear it
            const currentId = String(selectedAddress?.id || selectedAddress?._id || '');
            if (currentId && currentId === String(deletedId)) {
                setSelectedAddress(null);
                // localStorage was already cleared by ManageAddresses before firing this event
            }
        };

        // Same-tab: CustomEvent fired by ManageAddresses
        window.addEventListener('sumathi_addresses_changed', handleAddressChange);

        // Cross-tab: native storage event (user deleted from another tab)
        const handleStorageEvent = (e) => {
            if (e.key === 'sumathi_active_address' && e.newValue === null) {
                // Active address was removed from another tab
                setSelectedAddress(null);
            }
        };
        window.addEventListener('storage', handleStorageEvent);

        return () => {
            window.removeEventListener('sumathi_addresses_changed', handleAddressChange);
            window.removeEventListener('storage', handleStorageEvent);
        };
    }, [selectedAddress, setSelectedAddress]);
}