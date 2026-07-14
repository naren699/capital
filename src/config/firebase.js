import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDo9kD8La3hgiMNCFfr-CcgxWt4YJ6kiBU',
  authDomain: 'financetracker-d2321.firebaseapp.com',
  projectId: 'financetracker-d2321',
  storageBucket: 'financetracker-d2321.firebasestorage.app',
  messagingSenderId: '174254040093',
  appId: '1:174254040093:web:ecb838a603e5e7199292f4',
  measurementId: 'G-2RJTP15JY2',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
