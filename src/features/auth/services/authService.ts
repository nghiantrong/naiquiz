import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
} from "firebase/auth";
import { auth } from "../../../lib/firebase";

const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

export const loginWithGoogle = () =>
    signInWithPopup(auth, googleProvider);

export const logout = () => signOut(auth);