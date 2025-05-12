import { auth } from "@/lib/config/clientApp";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    User,
    UserCredential
} from "firebase/auth";

export const login = async (email: string, password: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const register = async (email: string, password: string) => {
    try {
        const newUser: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (newUser) {
            sendEmailVerification(newUser.user)
        }
    } catch (error: any) {
        throw new Error(error);
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const loginWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const sendPasswordReset = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw new Error(error);
    }
};


export const sendEmailVerificationLink = async (user: User) => {
    try {
        if (user) {
            await sendEmailVerification(user);
        }
        else {
            throw new Error("User not found !");
        }
    } catch (error: any) {
        throw new Error(error);
    }
}

// export const loginWithGoogle = async () => {
//     try {
//         await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
//         const signInResult = await GoogleSignin.signIn();

//         const idToken = signInResult.data?.idToken;
//         if (!idToken) {
//             throw new Error('No ID token found');
//         }
//         if (!signInResult) {
//             throw new Error('No signInResult found');
//         }
//         const googleCredential = GoogleAuthProvider.credential(signInResult.data?.idToken);

//         return signInWithCredential(getAuth(), googleCredential);

//     } catch (error: any) {
//         throw new Error(error);
//     }
// }