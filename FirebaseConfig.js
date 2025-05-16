import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBRmQMQ_2J29E72AkovA6K2QCSNPzU1GXw",
  authDomain: "patrimonio-ufmg.firebaseapp.com",
  databaseURL: "https://patrimonio-ufmg-default-rtdb.firebaseio.com",
  projectId: "patrimonio-ufmg",
  storageBucket: "patrimonio-ufmg.appspot.com",
  messagingSenderId: "873294963902",
  appId: "1:873294963902:web:cceee4a593acd82029aaef",
  measurementId: "G-2XN3RS1N4R"
};

export const app = initializeApp(firebaseConfig);

let auth;

if (Platform.OS === 'web') {
  auth = getAuth(app); // ✅ Safe for web
} else {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });
    } catch (error) {
      console.error("Native Auth init failed:", error);
    }
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);