/**
 * Environment validation utility for Google Sign-In
 */

export const validateGoogleEnvironment = () => {
  console.log('=== Google Sign-In Environment Check ===');
  console.log('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:', process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? 'SET' : 'NOT SET');
  
  if (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    console.log('Web Client ID (first 20 chars):', clientId.substring(0, 20) + '...');
    console.log('Web Client ID format valid:', clientId.includes('.apps.googleusercontent.com'));
  }
  
  console.log('========================================');
};