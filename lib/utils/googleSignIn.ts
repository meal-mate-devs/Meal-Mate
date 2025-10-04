import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export const handleGoogleSignIn = async () => {
    try {
        await GoogleSignin.hasPlayServices();

        const userInfo = await GoogleSignin.signIn();

        const idToken = await GoogleSignin.getTokens();

        const googleCredential = auth.GoogleAuthProvider.credential(idToken.idToken);

        return auth().signInWithCredential(googleCredential);
    } catch (error: any) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('User cancelled the login flow');
            return null;
        } else if (error.code === statusCodes.IN_PROGRESS) {
            console.log('Operation in progress');
            throw new Error('Sign in operation already in progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            console.log('Play services not available');
            throw new Error('Google Play Services not available or outdated');
        } else {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    }
};