// Enhanced context/authContext.tsx with Google integration
import { auth } from '@/lib/config/clientApp';
import { isGoogleSignedIn, signOutFromGoogle } from '@/lib/utils/safeGoogleAuth';
import {
    signOut
} from 'firebase/auth';

// ... existing types ...

// Enhanced logout function that handles Google sign-out
const logout = async () => {
  try {
    // Check if user is signed in to Google and sign out
    const isGoogleUser = await isGoogleSignedIn();
    if (isGoogleUser) {
      await signOutFromGoogle();
    }
    
    // Sign out from Firebase
    await signOut(auth);
    
    console.log('User signed out successfully');
  } catch (error) {
    console.log('Error signing out:', error);
    throw error;
  }
};