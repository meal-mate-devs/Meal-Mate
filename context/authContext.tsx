// context/AuthContext.tsx
import { auth } from '@/lib/config/clientApp';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

type Profile = {
  firebaseUid: string;
  userName: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  // dateOfBirth is stored as Date in DB but handled as string in frontend
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  profileImage?: {
    url: string | null;
    publicId: string | null;
  };
  isProfileComplete: boolean;
  isChef: boolean;
  isPro: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, username: string, firstName: string, lastName: string, age: number, gender: string, dateOfBirth: string, phoneNumber: string, profileImage?: any) => Promise<any>;
  updateUserProfile: (userData: Partial<Omit<Profile, 'firebaseUid' | 'email' | 'isProfileComplete' | 'isChef' | 'isPro'>>, profileImage?: any) => Promise<any>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  doesAccountExist: (email: string) => Promise<boolean>;
  doesUsernameExist: (username: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (firebaseUser: any) => {
    try {
      console.log('Fetching user profile...');
      const token = await firebaseUser.getIdToken();
      
      // Use the correct endpoint from the backend API: /api/auth/profile
      const profileEndpoint = `${API_BASE_URL}/auth/profile`;
      
      console.log('Making request to:', profileEndpoint);
      
      const response = await fetch(profileEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Profile fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          url: profileEndpoint
        });
        
        // If it's a 404, the user might have just been created - try one more time after a short delay
        if (response.status === 404) {
          console.log('User not found, retrying profile fetch after delay...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const retryResponse = await fetch(profileEndpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            if (retryData && retryData.user) {
              console.log('Profile fetch successful on retry:', retryData.user.userName);
              setProfile(retryData.user);
              return retryData.user;
            }
          }
        }
        
        // Create a basic fallback profile if the API call fails
        // This allows the app to function with minimal data
        const basicProfile: Profile = {
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email || '',
          userName: firebaseUser.email?.split('@')[0] || 'User',
          firstName: '',
          lastName: '',
          age: 0,
          gender: '',
          dateOfBirth: '',
          phoneNumber: '',
          profileImage: {
            url: null,
            publicId: null
          },
          isProfileComplete: false,
          isChef: false,
          isPro: false
        };
        
        console.log('Using basic fallback profile due to API error:', basicProfile);
        setProfile(basicProfile);
        
        return basicProfile;
      }

      // Parse the response and extract the user object
      const data = await response.json();
      
      if (!data || !data.user) {
        console.error('Profile fetch response missing user data:', data);
        throw new Error('Invalid profile data received');
      }
      
      console.log('Profile fetch successful:', data.user.userName);
      
      // Only update the profile if there are actual changes
      if (JSON.stringify(data.user) !== JSON.stringify(profile)) {
        console.log('Updating profile state with new data');
        setProfile(data.user);
      } else {
        console.log('Profile data unchanged, skipping state update');
      }

      return data.user;
    } catch (error) {
      console.log('Error fetching profile:', error);
      
      // Create a fallback profile as a last resort when even error handling fails
      const emergencyFallback: Profile = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || '',
        userName: firebaseUser.email?.split('@')[0] || 'User',
        firstName: '',
        lastName: '',
        age: 0,
        gender: '',
        dateOfBirth: '',
        phoneNumber: '',
        profileImage: {
          url: null,
          publicId: null
        },
        isProfileComplete: false,
        isChef: false,
        isPro: false
      };
      
      console.log('Using emergency fallback profile after catch block:', emergencyFallback);
      setProfile(emergencyFallback);
      return emergencyFallback;
    }
  };

  // Add a ref to track the last profile refresh time
  const lastProfileRefreshRef = React.useRef<number>(0);

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      console.log('No authenticated user found');
      return;
    }

    // Add debounce to prevent excessive API calls (min 2 seconds between refreshes)
    const now = Date.now();
    if (now - lastProfileRefreshRef.current < 2000) {
      console.log('Profile refresh throttled - too many requests');
      return;
    }

    lastProfileRefreshRef.current = now;
    await fetchUserProfile(auth.currentUser);
  };

  const refreshAuthState = async () => {
    if (!auth.currentUser) {
      console.log('No authenticated user found for auth state refresh');
      return;
    }

    try {
      await auth.currentUser.reload();
      const firebaseUser = auth.currentUser;
      
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified,
      });
      setIsAuthenticated(firebaseUser.emailVerified);
      
      console.log('Auth state refreshed - emailVerified:', firebaseUser.emailVerified);
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
        });
        setIsAuthenticated(firebaseUser.emailVerified);
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (email: string, password: string, username: string, firstName: string, lastName: string, age: number, gender: string, dateOfBirth: string, phoneNumber: string, profileImage: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        try {
          await sendEmailVerification(userCredential.user);
          console.log('Email verification sent successfully to:', userCredential.user.email);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }
      }
      const token = await userCredential.user.getIdToken();

      const dobDate = new Date(dateOfBirth);
      const formattedDOB = !isNaN(dobDate.getTime()) ? dobDate.toISOString() : dateOfBirth;

      const formData = new FormData();
      formData.append('userName', username);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('age', age.toString());
      formData.append('gender', gender);
      formData.append('dateOfBirth', formattedDOB);
      formData.append('phoneNumber', phoneNumber);

      if (profileImage) {
        const imageType = profileImage.type || profileImage.mimeType || 'image/jpeg';
        const fileName = profileImage.fileName || `profile_${Date.now()}.${imageType.split('/')[1]}`;

        formData.append('profileImage', {
          uri: profileImage.uri,
          type: imageType,
          name: fileName,
        } as any);

        console.log('Appending profile image to form data:', {
          uri: profileImage.uri,
          type: imageType,
          name: fileName
        });
      }

      console.log('Making registration request to:', `${API_BASE_URL}/auth/register`);
      console.log('Request details:', {
        method: 'POST',
        url: `${API_BASE_URL}/auth/register`,
        hasToken: !!token,
        hasImage: !!profileImage
      });



      // Important: When sending FormData, don't manually set Content-Type header
      // The browser/fetch API will set it automatically with the correct boundary
      const backendResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type when sending FormData
        },
        body: formData,
      });

      console.log('Backend registration response status:', backendResponse.status);
      const responseData = await backendResponse.json();
      console.log('Backend registration response:', responseData);

      if (!backendResponse.ok) {
        console.error('Backend registration failed:', {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          responseData
        });
        throw new Error(`Backend registration failed: ${responseData.error || responseData.message || 'Unknown error'}`);
      }

      // Update the profile state with the newly created user data
      if (responseData.user) {
        console.log('Updating profile state with registration data:', responseData.user);
        setProfile(responseData.user);
      }

      return backendResponse;

    } catch (error) {
      throw error;
    }
  };






  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Delete account function
  const deleteAccount = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      const token = await auth.currentUser.getIdToken();
      
      // Call backend to delete user data
      const response = await fetch(`${API_BASE_URL}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      console.log('Account deleted successfully from backend');
      
      // Clear local state
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  // Password reset function
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw error;
    }
  };

  const doesAccountExist = async (email: string): Promise<boolean> => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error('Error checking account existence:', error);
      return false;
    }
  };

  const doesUsernameExist = async (username: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) {
        console.error('Username check failed:', response.status, response.statusText);
        // If server error, we assume username might be available (fail-safe)
        return false;
      }

      const data = await response.json();
      console.log('Username check response:', data);
      return data.exists === true;
    } catch (error) {
      console.error('Error checking username existence:', error);
      // If network error, we assume username might be available (fail-safe)
      return false;
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        console.log('Verification email resent successfully to:', auth.currentUser.email);
      } else {
        throw new Error('No user is currently signed in');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  const updateUserProfile = async (userData: Partial<Omit<Profile, 'firebaseUid' | 'email' | 'isProfileComplete' | 'isChef' | 'isPro'>>, profileImage?: any) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      const token = await auth.currentUser.getIdToken();

      const formData = new FormData();

      // Add user data to formData
      if (userData.userName) formData.append('userName', userData.userName);
      if (userData.firstName) formData.append('firstName', userData.firstName);
      if (userData.lastName) formData.append('lastName', userData.lastName);
      if (userData.age) formData.append('age', userData.age.toString());
      if (userData.gender) formData.append('gender', userData.gender);

      // Handle date of birth with proper formatting
      if (userData.dateOfBirth) {
        const dobDate = new Date(userData.dateOfBirth);
        const formattedDOB = !isNaN(dobDate.getTime()) ? dobDate.toISOString() : userData.dateOfBirth;
        formData.append('dateOfBirth', formattedDOB);
      }

      if (userData.phoneNumber) formData.append('phoneNumber', userData.phoneNumber);

      if (profileImage) {
        const imageType = profileImage.type || profileImage.mimeType || 'image/jpeg';
        const fileName = profileImage.fileName || `profile_${Date.now()}.${imageType.split('/')[1]}`;

        formData.append('profileImage', {
          uri: profileImage.uri,
          type: imageType,
          name: fileName,
        } as any);

        console.log('Appending profile image to form data:', {
          uri: profileImage.uri,
          type: imageType,
          name: fileName
        });
      }

      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Profile update failed with status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Profile update response:', responseData);

      if (responseData.user) {
        console.log('New profile image URL:', responseData.user.profileImage?.url);
        setProfile(responseData.user);
      }

      return responseData;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoading,
        login,
        register,
        updateUserProfile,
        logout,
        deleteAccount,
        sendPasswordReset,
        doesAccountExist,
        doesUsernameExist,
        resendVerificationEmail,
        refreshProfile,
        refreshAuthState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthContextProvider');
  }

  return context;
}