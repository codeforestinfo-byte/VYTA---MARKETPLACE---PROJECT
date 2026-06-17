import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail as firebaseUpdateEmail,
  UserCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDWZb7EhWYhe44RQ0DeuDWzW93gj3R-Xt0",
  authDomain: "vyta-marketplace.firebaseapp.com",
  projectId: "vyta-marketplace",
  storageBucket: "vyta-marketplace.firebasestorage.app",
  messagingSenderId: "39934175041",
  appId: "1:39934175041:web:898183fd43133691afe3c0",
  measurementId: "G-8B684STKS8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch {
    await signInWithRedirect(auth, googleProvider);
    return await getRedirectResult(auth) as UserCredential;
  }
}

export async function getGoogleIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  return user.getIdToken();
}

export async function forgotPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function sendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  await sendEmailVerification(user);
}

export async function updateUserEmail(newEmail: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  await firebaseUpdateEmail(user, newEmail);
}

export { auth, googleProvider };
