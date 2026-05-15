import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth instance
export const auth = getAuth(app);

// ✅ Google provider
export const googleProvider = new GoogleAuthProvider();

// ✅ Setup reCAPTCHA (FINAL CLEAN + SAFE)
export const setupRecaptcha = (containerId) => {
  // 🔥 Prevent duplicate verifier issues
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (err) {
      console.warn("Old reCAPTCHA cleanup failed:", err);
    }
    window.recaptchaVerifier = null;
  }

  // 🔥 Create new verifier
  window.recaptchaVerifier = new RecaptchaVerifier(
    containerId,
    {
      size: "invisible",
      callback: () => {
        console.log("✅ reCAPTCHA solved");
      },
      "expired-callback": () => {
        console.warn("⚠️ reCAPTCHA expired, retrying...");
      },
    },
    auth
  );

  return window.recaptchaVerifier;
};

// ✅ Send OTP helper (clean wrapper)
export const sendOtp = async (phoneNumber) => {
  const verifier = window.recaptchaVerifier;

  if (!verifier) {
    throw new Error("reCAPTCHA not initialized");
  }

  return await signInWithPhoneNumber(auth, phoneNumber, verifier);
};