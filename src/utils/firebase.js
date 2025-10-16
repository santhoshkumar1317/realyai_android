import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5QWXO5r4wzCP74NfVE6pklPE-PqelTf0",
  authDomain: "realyai-473914.firebaseapp.com",
  projectId: "realyai-473914",
  storageBucket: "realyai-473914.firebasestorage.app",
  messagingSenderId: "649493914329",
  appId: "1:649493914329:android:15ce2632c1e9d9176a14c8"
};

const app = initializeApp(firebaseConfig);

export { auth, GoogleSignin };
export default app;