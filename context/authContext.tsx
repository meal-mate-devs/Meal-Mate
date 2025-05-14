// context/AuthContext.tsx
import { auth } from "@/lib/config/clientApp";
import { fetchSignInMethodsForEmail, onAuthStateChanged, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import {
    login as firebaseLogin,
    loginWithGoogle as firebaseLoginWithGoogle,
    logout as firebaseLogout,
    register as firebaseRegister,
    sendEmailVerificationLink as firebaseSendEmailVerificationLink,
    sendPasswordReset as firebaseSendPasswordReset
} from "../lib/modules/firebase/authService";

type AuthState = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    sendEmailVerificationLink: (user: User) => Promise<void>;
    doesAccountExist: (email: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const doesAccountExist = async (email: string): Promise<boolean> => {
        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            // If there are any sign-in methods available, the account exists
            return methods.length > 0;
        } catch (error) {
            console.error("Error checking if account exists:", error);
            // In case of error, we return false to be safe
            return false;
        }
    };

    const values: AuthState = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login: firebaseLogin,
        register: firebaseRegister,
        logout: firebaseLogout,
        loginWithGoogle: firebaseLoginWithGoogle,
        sendPasswordReset: firebaseSendPasswordReset,
        sendEmailVerificationLink: firebaseSendEmailVerificationLink,
        doesAccountExist,
    };

    return (
        <AuthContext.Provider value={values}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = (): AuthState => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthContextProvider");
    }
    return context;
};