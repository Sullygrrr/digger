import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBvcIl7GqG9oXHxOguX5RHjAmcDnq7QJB4",
  authDomain: "music-6e66d.firebaseapp.com",
  projectId: "music-6e66d",
  storageBucket: "music-6e66d.firebasestorage.app",
  messagingSenderId: "357347664116",
  appId: "1:357347664116:web:b5bf2279698177ea7f7ea1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);