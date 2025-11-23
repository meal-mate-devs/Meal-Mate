import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Validate Google configuration
const validateGoogleConfig = () => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!webClientId || webClientId === 'your_google_web_client_id_here') {
    throw new Error('Google Web Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file');
  }

  console.log('Google configuration validated successfully');
  return { webClientId, iosClientId };
};

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  try {
    const { webClientId, iosClientId } = validateGoogleConfig();
    
    GoogleSignin.configure({
      webClientId,
      iosClientId,
      scopes: ['profile', 'email'],
      offlineAccess: false, // We don't need refresh tokens for this app
      forceCodeForRefreshToken: false,
    });

    console.log('Google Sign-In configured successfully');
  } catch (error) {
    console.log('Failed to configure Google Sign-In:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google Sign-In process...');
    
    // Check if Google Play Services are available (Android only)
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Sign in
    const userInfo = await GoogleSignin.signIn();
    console.log('Google Sign-In successful for user:', userInfo.data?.user?.email);
    
    return userInfo;
  } catch (error: any) {
    console.log('Google Sign-In error:', error);
    
    // Handle specific error codes
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        throw new Error('CANCELLED');
      case statusCodes.IN_PROGRESS:
        throw new Error('Sign-in already in progress');
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        throw new Error('Google Play Services not available');
      case statusCodes.SIGN_IN_REQUIRED:
        throw new Error('SIGN_IN_REQUIRED');
      default:
        throw new Error(`Google Sign-In failed: ${error.message || 'Unknown error'}`);
    }
  }
};

// Sign out from Google
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    console.log('Google Sign-Out successful');
  } catch (error) {
    console.log('Google Sign-Out error:', error);
    throw error;
  }
};

// Get current Google user
export const getCurrentGoogleUser = async () => {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser;
  } catch (error) {
    console.log('Get current Google user error:', error);
    return null;
  }
};

// Check if user is signed in to Google
export const isGoogleSignedIn = async (): Promise<boolean> => {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser !== null;
  } catch (error) {
    console.log('Error checking Google sign-in status:', error);
    return false;
  }
};