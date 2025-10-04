# Firebase Configuration for Google Sign-In

To fix the "Access blocked: Authorization Error" and "Error 400: invalid_request" issue, you need to update your Firebase Authentication configuration in the Firebase Console.

## Steps to Update Firebase Console Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project "meal-mate-fdb24"
3. In the left sidebar, click on **Authentication**
4. Click on the **Sign-in method** tab
5. Find and click on **Google** in the list of providers
6. Make sure Google sign-in is **enabled**

## Update Authorized Domains

In the Authentication > Settings > Authorized Domains section:

1. Add `authapp.firebaseapp.com` to the list of authorized domains if it's not already there
2. Add your Expo redirect domain: `auth.expo.io`

## Update OAuth Redirect URLs

In the Google provider settings:

1. Click on **Web SDK configuration**
2. Add the following URLs to the **Authorized domains** list:
   - `auth.expo.io`
   - Your app's custom scheme URI: `authapp://*`
   - `localhost`

3. Under **Authorized redirect URIs**, add:
   - `https://auth.expo.io/@your-expo-account-name/meal-mate/redirect`
   - `authapp://redirect`
   - Your Firebase auth redirect: `https://meal-mate-fdb24.firebaseapp.com/__/auth/handler`

## Check Google Cloud Platform Settings

Since we're using a Google OAuth client ID, you should also verify settings in the Google Cloud Platform:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **Credentials**
4. Find and edit your OAuth client ID
5. Under **Authorized redirect URIs**, add:
   - `https://auth.expo.io/@your-expo-account-name/meal-mate/redirect`
   - `authapp://redirect`

## Important Settings Summary

- **App scheme**: authapp
- **Redirect path**: redirect
- **Full redirect URI**: authapp://redirect

These changes should resolve the "Parameter not allowed for this message type: code_challenge_method" error by ensuring your OAuth configuration properly accepts the authentication request without PKCE.