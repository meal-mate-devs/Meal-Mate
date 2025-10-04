import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleSignIn = () => {
    return Google.useAuthRequest({
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email']
    });
};

export const isSuccessResponse = (response: any): boolean => {
    return response && response.user && response.idToken;
};

export const isErrorWithCode = (error: any): error is { code: string } => {
    return error && typeof error.code === 'string';
};