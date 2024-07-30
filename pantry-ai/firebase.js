// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9-rMoxFc3Kfx0DC0c2AEzZsrV0tURoIU",
  authDomain: "hspantryapp-47a31.firebaseapp.com",
  projectId: "hspantryapp-47a31",
  storageBucket: "hspantryapp-47a31.appspot.com",
  messagingSenderId: "315800581071",
  appId: "1:315800581071:web:756ef62478e3d4007998ba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export {app, firebaseConfig}