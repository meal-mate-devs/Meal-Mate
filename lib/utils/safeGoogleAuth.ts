/**
 * Safe Google Auth wrapper to prevent native module errors during development
 * This module conditionally imports Google Sign-In only when needed
 */

import Constants from 'expo-constants';

// Type definitions for Google Sign-In responses
export interface GoogleSignInResult {
  success: boolean;
  idToken?: string;
  error?: string;
  userCancelled?: boolean;
}

export interface GoogleSignInUser {
  id: string;
  name: string | null;
  email: string;
  photo: string | null;
  familyName: string | null;
  givenName: string | null;
}

// Check if we're in Expo Go (cannot use native modules)
const isExpoGo = Constants.appOwnership === 'expo';

// Safe Google Sign-In wrapper that handles missing native module
class SafeGoogleAuth {
  private isNativeModuleAvailable = false;
  private GoogleSignin: any = null;
  private statusCodes: any = null;

  constructor() {
    // Only try to initialize if not in Expo Go
    if (!isExpoGo) {
      this.initializeIfAvailable();
    }
  }

  private async initializeIfAvailable() {
    if (isExpoGo) {
      console.log('Google Sign-In: Skipping initialization in Expo Go');
      return;
    }

    try {
      // Dynamically import Google Sign-In only if native module is available
      const googleSignInModule = await import('@react-native-google-signin/google-signin');
      this.GoogleSignin = googleSignInModule.GoogleSignin;
      this.statusCodes = googleSignInModule.statusCodes;
      this.isNativeModuleAvailable = true;
      console.log('Google Sign-In: Native module initialized successfully');
    } catch (error) {
      console.warn('Google Sign-In native module not available:', error);
      this.isNativeModuleAvailable = false;
    }
  }

  async ensureInitialized() {
    if (isExpoGo) {
      return;
    }
    
    if (!this.isNativeModuleAvailable) {
      await this.initializeIfAvailable();
    }
  }

  async configure(webClientId: string) {
    if (isExpoGo) {
      console.log('Google Sign-In: Configuration skipped in Expo Go');
      return;
    }

    await this.ensureInitialized();
    
    if (!this.isNativeModuleAvailable) {
      throw new Error('Google Sign-In native module not available. Please create a development build.');
    }

    this.GoogleSignin.configure({
      webClientId,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }

  async signIn(): Promise<GoogleSignInResult> {
    if (isExpoGo) {
      return {
        success: false,
        error: 'Google Sign-In requires a development build. Currently running in Expo Go.'
      };
    }

    await this.ensureInitialized();
    
    if (!this.isNativeModuleAvailable) {
      return {
        success: false,
        error: 'Google Sign-In native module not available. Please create a development build.'
      };
    }

    try {
      await this.GoogleSignin.hasPlayServices();
      const result = await this.GoogleSignin.signIn();
      
      return {
        success: true,
        idToken: result.data?.idToken
      };
    } catch (error: any) {
      if (error.code === this.statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          userCancelled: true,
          error: 'Sign-in cancelled by user'
        };
      } else if (error.code === this.statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: 'Sign-in already in progress'
        };
      } else if (error.code === this.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: 'Google Play Services not available'
        };
      } else {
        return {
          success: false,
          error: error.message || 'Google Sign-In failed'
        };
      }
    }
  }

  async signOut(): Promise<void> {
    if (isExpoGo) {
      console.log('Google Sign-In: Sign out skipped in Expo Go');
      return;
    }

    await this.ensureInitialized();
    
    if (this.isNativeModuleAvailable) {
      try {
        await this.GoogleSignin.signOut();
      } catch (error) {
        console.warn('Google Sign-Out failed:', error);
      }
    }
  }

  async isSignedIn(): Promise<boolean> {
    if (isExpoGo) {
      return false;
    }

    await this.ensureInitialized();
    
    if (!this.isNativeModuleAvailable) {
      return false;
    }

    try {
      return await this.GoogleSignin.isSignedIn();
    } catch (error) {
      console.warn('Google Sign-In status check failed:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<GoogleSignInUser | null> {
    if (isExpoGo) {
      return null;
    }

    await this.ensureInitialized();
    
    if (!this.isNativeModuleAvailable) {
      return null;
    }

    try {
      const userInfo = await this.GoogleSignin.getCurrentUser();
      return userInfo?.data?.user || null;
    } catch (error) {
      console.warn('Failed to get current Google user:', error);
      return null;
    }
  }
}

// Export singleton instance
export const safeGoogleAuth = new SafeGoogleAuth();

// Convenience functions that match the original API
export const configureGoogleSignIn = (webClientId?: string) => {
  if (isExpoGo) {
    console.log('Google Sign-In: Configuration skipped in Expo Go');
    return Promise.resolve();
  }

  if (!webClientId) {
    throw new Error('Google Web Client ID is required for configuration');
  }
  return safeGoogleAuth.configure(webClientId);
};

export const signInWithGoogle = () => safeGoogleAuth.signIn();
export const signOutFromGoogle = () => safeGoogleAuth.signOut();
export const isGoogleSignedIn = () => safeGoogleAuth.isSignedIn();
export const getCurrentGoogleUser = () => safeGoogleAuth.getCurrentUser();