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
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyD7wKO16xnthsqvjewZS-_PW3v1qrsoLcQ'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'finsight-111ea.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'finsight-111ea'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'finsight-111ea.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '516571793626'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:516571793626:web:e36599764f788aeede7de3')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
