import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAA4MUFx046m4Pg72sqpDQlcHYjXeyIGts",
  authDomain: "fast-time-e944f.firebaseapp.com",
  projectId: "fast-time-e944f",
  storageBucket: "fast-time-e944f.firebasestorage.app",
  messagingSenderId: "550359740654",
  appId: "1:550359740654:web:a1b241ef29203acc80c3ff",
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
