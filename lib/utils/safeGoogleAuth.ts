/**
 * Safe Google Auth wrapper to prevent native module errors during development
 * This module conditionally imports Google Sign-In only when needed
 */

import Constants from 'expo-constants';

// Type definitions for Google Sign-In response
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

    try {
      console.log('Google Sign-In: Configuring with enhanced settings...');
      console.log('App ownership:', Constants.appOwnership);
      console.log('Client ID (first 20 chars):', webClientId.substring(0, 20) + '...');
      console.log('Full Client ID:', webClientId);
      console.log('Bundle ID/Package:', Constants.expoConfig?.android?.package);
      
      this.GoogleSignin.configure({
        webClientId,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });
      
      console.log('Google Sign-In: Configuration completed successfully');
    } catch (error) {
      console.log('Google Sign-In: Configuration failed:', error);
      throw error;
    }
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
      console.log('Google Sign-In: Checking Play Services...');
      await this.GoogleSignin.hasPlayServices();
      
      // Sign out first to force account picker to show
      console.log('Google Sign-In: Signing out to show account picker...');
      try {
        await this.GoogleSignin.signOut();
      } catch (signOutError) {
        console.log('Google Sign-In: Sign out before sign-in not needed or failed (this is okay):', signOutError);
      }
      
      console.log('Google Sign-In: Starting sign-in process...');
      const result = await this.GoogleSignin.signIn();
      
      console.log('Google Sign-In: Sign-in successful');
      return {
        success: true,
        idToken: result.data?.idToken
      };
    } catch (error: any) {
      console.log('Google Sign-In error:', error);
      
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
      } else if (error.message?.includes('DEVELOPER_ERROR')) {
        return {
          success: false,
          error: 'Google Sign-In configuration error. Please check:\n' +
                 '1. SHA-1 fingerprint in Google Console\n' +
                 '2. Package name matches: com.mealmate.app\n' +
                 '3. Client ID configuration\n' +
                 '4. google-services.json file'
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

  // Try multiple sources for the web client ID
  const clientId = webClientId || 
                   process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
                   Constants.expoConfig?.extra?.googleWebClientId ||
                   '230655221183-5n78pgvp7ubplngladbmmhepebqrlqgf.apps.googleusercontent.com'; // Fallback to your known client ID
  
  if (!clientId) {
    console.log('Google Sign-In: No client ID found in any source');
    throw new Error('Google Web Client ID is required for configuration. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file');
  }
  
  console.log('Google Sign-In: Configuring with client ID:', clientId.substring(0, 20) + '...');
  return safeGoogleAuth.configure(clientId);
};

export const signInWithGoogle = () => safeGoogleAuth.signIn();
export const signOutFromGoogle = () => safeGoogleAuth.signOut();
export const isGoogleSignedIn = () => safeGoogleAuth.isSignedIn();
export const getCurrentGoogleUser = () => safeGoogleAuth.getCurrentUser();