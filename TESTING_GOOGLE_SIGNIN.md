# Testing Google Sign-In Authentication

Follow these steps to test the updated Google Sign-In functionality after implementing the fixes for the "Access blocked: Authorization Error" and "Error 400: invalid_request" issues.

## Prerequisites

Before testing, ensure you have:

1. Updated your Firebase Console configuration as described in `FIREBASE_CONFIG_INSTRUCTIONS.md`
2. Made all the code changes to `expoGoogleSignIn.ts` and other files
3. Restarted your Expo development server completely

## Testing Steps

### 1. Access the Test Menu

Start the app and access the test menu by:
- When the app is loading, tap on the version number at the bottom of the screen
- This will take you to the Test Menu screen

### 2. Check Environment Variables

1. From the Test Menu, select "Environment Variables"
2. Verify that the following environment variables are properly set:
   - `EXPO_PUBLIC_GOOGLE_CLIENT_ID` should show as "Set" 
   - `expo.scheme` should show as "authapp"

### 3. Test Google Sign-In

1. From the Test Menu, select "Google Auth Test"
2. Observe your current authentication status (should be "Not Authenticated")
3. Tap the "Sign In with Google" button
4. The Google authentication flow should open
5. Select your Google account
6. If successful, you should be returned to the app and see "Authenticated" status
7. You should see your user details displayed (User ID, Email, etc.)
8. Test signing out by tapping the "Sign Out" button
9. Confirm you return to the "Not Authenticated" state

## Debugging Issues

If you encounter errors during testing, check:

### "Access blocked: Authorization Error" or "Error 400: invalid_request"

This likely indicates your Firebase OAuth configuration isn't properly set up:
1. Verify all redirect URIs are correctly added in Firebase Console and Google Cloud Platform
2. Make sure the app scheme matches exactly ("authapp")
3. Check that you've restarted the app completely after making changes

### "Google authentication was canceled" or "User canceled the flow" 

This could happen if:
1. The user manually cancels the authentication
2. The redirect URI isn't properly registered
3. The WebBrowser module isn't properly initialized

### No Token Received

If the authentication completes but no token is received:
1. Check the console logs for detailed error information
2. Verify that your Google Client ID is correct
3. Try clearing your Google auth state in device settings
4. Make sure the Firebase project is properly set up with Google as a provider

## Logs to Monitor

During the sign-in process, look for these logs in the console:
1. "Starting Google Auth flow"
2. "Using redirect URI: [your-uri]"
3. "Auth result type: success" (should be success)
4. "Access token received: [token-preview]..."
5. "Google authentication flow completed successfully"
6. "Google sign-in successful: [user-name]"

If you see errors in any of these steps, they will help identify where the problem is occurring.