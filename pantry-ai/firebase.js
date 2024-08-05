// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9-rMoxFc3Kfx0DC0c2AEzZsrV0tURoIU",
  authDomain: "hspantryapp-47a31.firebaseapp.com",
  projectId: "hspantryapp-47a31",
  storageBucket: "hspantryapp-47a31.appspot.com",
  messagingSenderId: "315800581071",
  appId: "1:315800581071:web:4f094989d231c8887998ba",
  measurementId: "G-2HGDSEY4VG"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Export the Firebase app and Firestore instances
export { firebaseApp, firestore };
