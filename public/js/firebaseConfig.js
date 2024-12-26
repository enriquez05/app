// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";

import { 
    getAuth, signInWithEmailAndPassword, 
    onAuthStateChanged,
    setPersistence, 
    browserSessionPersistence,
    reauthenticateWithCredential,
    updatePassword,
    EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { 
    getFirestore, 
    collection,
    addDoc,
    getDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    setDoc,
    query,
    where,
    orderBy,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { 
    getDatabase,
    ref, 
    set,
    onValue,
    child, 
    get,
    push, 
    update,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC9M8B0yRj0n0Imn3ZCAfnQyQMKskBxFSw",
  authDomain: "pos-app-e8f3b.firebaseapp.com",
  databaseURL: "https://pos-app-e8f3b-default-rtdb.firebaseio.com",
  projectId: "pos-app-e8f3b",
  storageBucket: "pos-app-e8f3b.firebasestorage.app",
  messagingSenderId: "929777238884",
  appId: "1:929777238884:web:c20593dad29490a32c3071",
  measurementId: "G-0TXRQ30J9E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const fdb = getFirestore(app);
export const rdb = getDatabase(app);

export {
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    collection,
    addDoc,
    getDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    setDoc,
    setPersistence, 
    browserSessionPersistence,
    reauthenticateWithCredential,
    updatePassword,
    EmailAuthProvider,
    query,
    where,
    orderBy,
    ref, 
    set,
    onValue,
    child, 
    get,
    push, 
    update,
}