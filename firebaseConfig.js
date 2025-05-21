import { initializeApp, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcL7ne8oHw0SCmQs681pvqIpXmb-iz4K8",
  authDomain: "recetas-mama-3f673.firebaseapp.com",
  projectId: "recetas-mama-3f673",
  storageBucket: "recetas-mama-3f673.firebasestorage.app",
  messagingSenderId: "682646149193",
  appId: "1:682646149193:web:851ab22dff6fdffb820798"
};

const app = initializeApp(firebaseConfig);
// initialize Firebase Auth for that app immediately
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db ,getApp, getAuth };