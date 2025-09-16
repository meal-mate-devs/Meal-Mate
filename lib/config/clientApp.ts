import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

const firebaseApp: FirebaseApp = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

// For Firebase v11+, try to implement persistence
// Since getReactNativePersistence might not be available, let's use a workaround
const auth: Auth = (() => {
    try {
        // Try dynamic import for React Native persistence
        const { getReactNativePersistence } = require('firebase/auth');
        return initializeAuth(firebaseApp, {
            persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        });
    } catch (error) {
        console.warn('Firebase Auth: Using memory persistence. Auth state will not persist between sessions.');
        return initializeAuth(firebaseApp);
    }
})();

const db: Firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const functionInstance = getFunctions(firebaseApp);

export { auth, db, functionInstance, storage };

