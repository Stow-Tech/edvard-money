import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDrNMu1RRmEW3tv05m_OC8f9PJRhdUL1RY",
  authDomain: "edvard-money.firebaseapp.com",
  projectId: "edvard-money",
  storageBucket: "edvard-money.firebasestorage.app",
  messagingSenderId: "916445732739",
  appId: "1:916445732739:web:da460be56bc310e2ad20b6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);