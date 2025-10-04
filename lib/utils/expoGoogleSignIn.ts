import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider } from 'firebase/auth';

// Make sure to call this at the root level of your app
WebBrowser.maybeCompleteAuthSession();

/**
 * A simpler Google authentication flow that works better with Expo
 * Modified to avoid code_challenge_method errors
 */
export const getGoogleAuthCredential = async () => {
  try {
    console.log('Starting Google Auth flow');
    
    // Create auth request
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Missing Google Client ID in environment variables');
      throw new Error('Google Client ID not configured');
    }
    
    console.log('Google Client ID found:', clientId.substring(0, 5) + '...');
    
    // Define redirect URI with app scheme
    const redirectUri = AuthSession.makeRedirectUri({ 
      scheme: 'authapp',
      // Use a simpler path to avoid potential URI parsing issues
      path: 'redirect'
    });
    
    console.log('Using redirect URI:', redirectUri);
    
    // Create a Google OAuth provider configuration
    console.log('Fetching Google OAuth discovery document...');
    const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
    console.log('Discovery document fetched');
    
    // Create the auth request - IMPORTANT CHANGES HERE
    console.log('Creating AuthRequest...');
    const request = new AuthSession.AuthRequest({
      clientId: clientId,
      scopes: ['openid', 'profile', 'email'],
      // Use Token response type instead of IdToken to avoid PKCE requirements
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
      // Add state parameter for security
      extraParams: {
        prompt: 'select_account',
        access_type: 'offline',
        state: Math.random().toString(36).substring(2, 15),
      },
      // Important: Disable PKCE since it's causing the error
      usePKCE: false,
    });
    
    // Prompt user for authentication with custom settings
    console.log('Prompting for Google authentication...');
    const result = await request.promptAsync(discovery, {
      toolbarColor: '#000000',
      showInRecents: true,
    });
    
    console.log('Auth result type:', result.type);
    
    if (result.type !== 'success') {
      console.error('Google auth unsuccessful, result type:', result.type);
      throw new Error(`Google authentication was ${result.type}`);
    }
    
    // With Token response type, we'll get access_token but not id_token
    const { access_token } = result.params;
    
    if (!access_token) {
      console.error('Missing access token in result params');
      throw new Error('Google authentication did not return an access token');
    }
    
    console.log('Access token received:', access_token.substring(0, 10) + '...');
    
    try {
      // Get user info with the access token to extract ID token or create credential directly
      console.log('Fetching user info with access token...');
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }
      
      const userData = await userInfoResponse.json();
      console.log('User data retrieved:', userData.name || userData.email || 'User data received');
      
      // Create a credential using access token
      console.log('Creating Firebase credential with Google access token');
      // For access token only auth, pass null as the first parameter
      const credential = GoogleAuthProvider.credential(null, access_token);
      
      console.log('Google authentication flow completed successfully');
      return credential;
    } catch (error) {
      console.error('Error retrieving user info:', error);
      throw error;
    }
  } catch (error) {
    console.error('Google Auth Error:', error);
    throw error;
  }
};