/**
 * lib/firebase.ts
 *
 * Firebase client-side setup for Next.js (App Router).
 *
 * ── What lives here ──────────────────────────────────────────────────────────
 *   • Firebase app initialization  (lazy singleton, safe for hot-reload)
 *   • Auth instance + GoogleAuthProvider
 *   • signInWithGoogle()          — opens the Google popup and returns the User
 *   • signOutUser()               — signs the current user out
 *   • useAuthState()              — React hook wrapping onAuthStateChanged
 *
 * ── Config ───────────────────────────────────────────────────────────────────
 *   All values come from NEXT_PUBLIC_ environment variables.
 *   Copy .env.local.example → .env.local and fill in your Firebase project
 *   credentials before running the dev server.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";

// ─── Firebase config (from environment variables) ─────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ─── Lazy singleton app + auth ────────────────────────────────────────────────
// getApps() check prevents "already initialized" errors during Next.js
// hot-module replacement in development.

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

// ─── Google provider ──────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();
// Request the user's email address scope explicitly.
googleProvider.addScope("email");

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Open a Google Sign-In popup and return the signed-in Firebase User.
 * Throws if the popup is closed or any other error occurs.
 */
export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign the current user out of Firebase Auth.
 */
export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

// ─── React hook ───────────────────────────────────────────────────────────────

interface AuthState {
  /** The currently signed-in Firebase user, or null when signed out. */
  user: User | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
}

/**
 * useAuthState()
 *
 * Subscribes to Firebase auth state changes and returns the current user.
 *
 * @example
 * const { user, loading } = useAuthState();
 * if (loading) return <Spinner />;
 * if (!user) return <SignInButton />;
 */
export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
}

// ─── Named re-exports for convenience ─────────────────────────────────────────
// Consumers can also import the raw auth instance if needed.

export { getFirebaseAuth as getAuth };
