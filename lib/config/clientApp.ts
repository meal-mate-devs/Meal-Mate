import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

const firebaseApp: FirebaseApp = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

const auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db: Firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const functionInstance = getFunctions(firebaseApp);

export { auth, db, functionInstance, storage };

