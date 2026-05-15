import { auth } from '../firebase';

/**
 * A wrapper around fetch that automatically adds the Firebase ID token
 * to the Authorization header if a user is logged in.
 */
export async function authFetch(url, options = {}) {
  const user = auth.currentUser;
  
  const headers = {
    ...options.headers,
  };

  if (user) {
    try {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      console.error("❌ Failed to get Firebase ID token", err);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
