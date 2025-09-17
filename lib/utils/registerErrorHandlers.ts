export const isNetworkRelatedError = (error: any): boolean => {
    if (!error) return false;

    let errorMessage = '';
    let errorCode = '';

    if (typeof error === 'object') {
        errorMessage = error.message || error.toString();
        errorCode = (error as { code?: string }).code || '';

        if (error.name === 'TimeoutError') return true;

        if (error instanceof TypeError &&
            (errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('Network request failed'))) {
            return true;
        }
    } else {
        errorMessage = String(error);
    }

    const networkErrorCodes = [
        'auth/network-request-failed',
        'NETWORK_ERROR',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
    ];
    if (networkErrorCodes.includes(errorCode)) {
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

export const getAuthErrorMessage = (error: any): { errorCode?: string; errorMessage: string } => {
    let errorMessage = '';
    let errorCode = '';

    if (typeof error === 'object' && error !== null) {
        const errorStr = (error as { message?: string }).message ?? error.toString();
        if (errorStr.includes('FirebaseError:')) {
            const match = errorStr.match(/\(([^)]+)\)/);
            if (match && match[1]) {
                errorCode = match[1];
            }
            errorMessage = errorStr;
        } else {
            errorMessage = (error as { message?: string }).message || '';
            errorCode = (error as { code?: string }).code || '';
        }
    } else {
        const errorStr = String(error);
        if (errorStr.includes('FirebaseError:')) {
            const match = errorStr.match(/\(([^)]+)\)/);
            if (match && match[1]) {
                errorCode = match[1];
            }
            errorMessage = errorStr;
        } else {
            errorMessage = errorStr;
            errorCode = '';
        }
    }

    if (isNetworkRelatedError(error)) {
        return {
            errorCode: 'network-error',
            errorMessage: 'Network issue. Please check your connection and try again.'
        };
    }

    switch (errorCode) {
        case 'auth/email-already-in-use':
            return { errorCode, errorMessage: 'This email is already registered. Please login instead.' };
        case 'auth/invalid-email':
            return { errorCode, errorMessage: 'Invalid email format' };
        case 'auth/weak-password':
            return { errorCode, errorMessage: 'Password is too weak. Please use a stronger password.' };
        case 'auth/operation-not-allowed':
            return { errorCode, errorMessage: 'Registration is currently not allowed. Please try again later.' };
        case 'auth/network-request-failed':
            return { errorCode, errorMessage: 'Network issue. Please check your connection and try again.' };
        case 'auth/invalid-credential':
            return { errorCode, errorMessage: 'Invalid credentials. Please check your information and try again.' };
        case 'auth/too-many-requests':
            return { errorCode, errorMessage: 'Too many attempts. Please try again later.' };
        default:
            if (errorCode.startsWith('auth/')) {
                return { errorCode, errorMessage: 'An authentication error occurred. Please try again.' };
            }
            if (errorMessage.toLowerCase().includes('password')) {
                return { errorCode, errorMessage: 'Password issue. Please try again with a different password.' };
            }
            if (errorMessage.toLowerCase().includes('email')) {
                return { errorCode, errorMessage: 'Email issue. Please check again.' };
            }
            return { errorCode, errorMessage: 'Registration failed. Please try again later.' };
    }
};