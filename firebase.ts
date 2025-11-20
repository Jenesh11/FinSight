import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Use environment variables if available, otherwise fall back to the provided hardcoded values
const getEnv = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    console.warn('Error accessing import.meta.env', e);
  }

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // ignore
  }

  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', ''),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', ''),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', ''),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', ''),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
  appId: getEnv('VITE_FIREBASE_APP_ID', '')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
