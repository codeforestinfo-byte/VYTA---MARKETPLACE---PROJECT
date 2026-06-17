import { initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDWZb7EhWYhe44RQ0DeuDWzW93gj3R-Xt0",
  authDomain: "vyta-marketplace.firebaseapp.com",
  projectId: "vyta-marketplace",
  storageBucket: "vyta-marketplace.firebasestorage.app",
  messagingSenderId: "39934175041",
  appId: "1:39934175041:web:898183fd43133691afe3c0",
  measurementId: "G-8B684STKS8",
};

const app = initializeApp(firebaseConfig, "vyta-admin");
const auth = getAuth(app);

export async function forgotPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export { auth };
