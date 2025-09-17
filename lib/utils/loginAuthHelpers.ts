import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const validateEmail = (email: string): boolean => {
    return emailRegex.test(email);
};

export const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
        if (Platform.OS === 'web') {
            return navigator.onLine;
        } else {
            const netInfoState = await NetInfo.fetch();
            return !!(netInfoState.isConnected && netInfoState.isInternetReachable);
        }
    } catch (error) {
        console.log('Network check error:', error);
        return true;
    }
};

export const isNetworkRelatedError = (error: any): boolean => {
    if (!error) return false;

    let errorMessage = '';
    let errorCode = '';

    if (typeof error === 'object') {
        errorMessage = error.message || error.toString();
        errorCode = error.code || '';

        if (error.name === 'TimeoutError') return true;

        if (error instanceof TypeError &&
            (errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('Network request failed'))) {
            return true;
        }
    } else {
        errorMessage = String(error);
    }

    if (errorCode === 'auth/network-request-failed' ||
        errorCode === 'NETWORK_ERROR' ||
        errorCode === 'ENOTFOUND' ||
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ECONNRESET' ||
        errorCode === 'ETIMEDOUT') {
        return true;
    }

    const networkErrorPhrases = [
        'network', 'connection', 'internet', 'offline', 'timeout',
        'unreachable', 'connect', 'dns', 'host', 'socket', 'request failed',
        'cannot reach', 'server unavailable', 'no internet'
    ];

    return networkErrorPhrases.some(phrase =>
        errorMessage.toLowerCase().includes(phrase));
};

export const handleLoginError = (error: any, setEmailError: (error: string) => void, setPasswordError: (error: string) => void, showDialog: (type: 'success' | 'error' | 'warning' | 'loading', title: string, message?: string) => void): void => {
    let errorMessage = '';
    let errorCode = '';

    const errorStr = typeof error === 'string' ? error : (error && typeof error === 'object' && 'toString' in error) ? (error as any).toString() : '';

    if (errorStr.includes('FirebaseError:')) {
        const match = errorStr.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            errorCode = match[1];
        }
        errorMessage = errorStr;
    } else {
        if (typeof error === 'object' && error !== null) {
            errorMessage = (error as any).message || errorStr;
            errorCode = (error as any).code || '';
        } else {
            errorMessage = errorStr;
            errorCode = '';
        }
    }

    console.log('Error code:', errorCode);
    console.log('Error message:', errorMessage);

    if (isNetworkRelatedError(error)) {
        showDialog('error', 'Network Error', 'Network issue. Please check your connection and try again.');
    } else if (errorCode) {
        switch (errorCode) {
            case 'auth/user-not-found':
                setEmailError('Account does not exist. Please sign up first.');
                break;
            case 'auth/wrong-password':
                setPasswordError('Wrong password. Please try again.');
                break;
            case 'auth/invalid-email':
                setEmailError('Invalid email format');
                break;
            case 'auth/user-disabled':
                showDialog('error', 'Account Disabled', 'Your account has been disabled. Please contact support.');
                break;
            case 'auth/too-many-requests':
                showDialog('warning', 'Too Many Attempts', 'Too many attempts. Please try again later or reset your password.');
                break;
            case 'auth/invalid-credential':
            case 'auth/invalid-login-credentials':
                if (errorMessage.toLowerCase().includes('verify') || errorMessage.toLowerCase().includes('verification')) {
                    showDialog('warning', 'Email Not Verified', 'Please verify your email address first. Check your inbox for the verification email.');
                } else {
                    showDialog('error', 'Invalid Credentials', 'Your email/username or password is incorrect. Please try again.');
                }
                break;
            case 'auth/network-request-failed':
                showDialog('error', 'Network Error', 'Network issue. Please check your connection and try again.');
                break;
            case 'auth/account-exists-with-different-credential':
                showDialog('error', 'Sign-in Method Error', 'This email is registered with a different sign-in method. Try another option.');
                break;
            case 'auth/operation-not-allowed':
                showDialog('error', 'Sign-in Error', 'This sign-in method is not available. Please try another option.');
                break;
            case 'auth/requires-recent-login':
                showDialog('warning', 'Session Expired', 'For security, please log out and log in again before retrying.');
                break;
            default:
                if (errorCode.startsWith('auth/')) {
                    if (errorMessage.toLowerCase().includes('password')) {
                        setPasswordError('Password issue. Please try again or reset your password.');
                    } else if (errorMessage.toLowerCase().includes('email')) {
                        setEmailError('Email issue. Please check again.');
                    } else {
                        showDialog('error', 'Sign-in Failed', 'Sign-in failed. Please try again.');
                    }
                } else {
                    showDialog('error', 'Sign-in Error', 'Unable to sign in. Please try again later.');
                }
        }
    } else if (errorMessage) {
        if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
            showDialog('error', 'Network Error', 'Network issue. Please check your connection and try again.');
        } else if (errorMessage.toLowerCase().includes('password')) {
            setPasswordError('Password issue. Please try again or reset your password.');
        } else if (errorMessage.toLowerCase().includes('email')) {
            setEmailError('Email issue. Please check again.');
        } else {
            showDialog('error', 'Sign-in Failed', 'Sign-in failed. Please try again later.');
        }
    } else {
        showDialog('error', 'Sign-in Failed', 'Sign-in failed. Please try again or contact support if the issue persists.');
    }
};