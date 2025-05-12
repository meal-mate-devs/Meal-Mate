"use client";

import { auth } from "@/lib/config/clientApp";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoading(true);
            if (!user) {
                setIsLoading(false);
                setIsAuthenticated(false);
                setUser(user);
            } else {
                if (!user.emailVerified) {
                    setIsLoading(false);
                    setUser(user);
                    setIsAuthenticated(false);
                } else {
                    setIsLoading(false);
                    setIsAuthenticated(true);
                    setUser(user);
                }
            }
        });

        return () => unsubscribe();
    }, []);


    return { user, isAuthenticated, isLoading };
}

export default useAuth;
