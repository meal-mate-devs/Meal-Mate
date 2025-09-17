"use client"

import { useAuthContext } from '@/context/authContext'
import { useCallback, useEffect, useState } from "react"

interface ProfileData {
  name: string
  email: string
  profileImage?: string
}

// Global state store with default values
// These will be overridden by real user data from auth context via ProfileSyncProvider
let globalProfileData: ProfileData = {
  name: "",
  email: "",
  profileImage: "",
}

let subscribers: Array<(data: ProfileData) => void> = []

export const useProfileStore = () => {
  const [profileData, setProfileData] = useState<ProfileData>(globalProfileData)
  const auth = useAuthContext()

  // Initialize profile data from auth context when component mounts
  useEffect(() => {
    if (auth.profile) {
      const fullName = `${auth.profile.firstName || ''} ${auth.profile.lastName || ''}`.trim();
      const updatedData = {
        name: fullName || auth.profile.userName || auth.user?.displayName || 'User',
        email: auth.profile.email || auth.user?.email || '',
        profileImage: auth.profile.profileImage?.url || ''
      }

      // Update local state
      setProfileData(updatedData)
    } else if (auth.user) {
      // Fallback to Firebase user data
      setProfileData({
        name: auth.user.displayName || 'User',
        email: auth.user.email || '',
        profileImage: ''
      })
    }
  }, [
    auth.profile?.firstName,
    auth.profile?.lastName,
    auth.profile?.userName,
    auth.profile?.email,
    auth.profile?.profileImage?.url,
    auth.user?.displayName,
    auth.user?.email
  ])

  const subscribe = useCallback((callback: (data: ProfileData) => void) => {
    subscribers.push(callback)
    return () => {
      subscribers = subscribers.filter((sub) => sub !== callback)
    }
  }, [])

  const updateProfile = useCallback((newData: Partial<ProfileData>) => {
    // Update global store
    globalProfileData = { ...globalProfileData, ...newData }
    // Update local state
    setProfileData(globalProfileData)

    console.log('updateProfile: Updated profile data in store:', globalProfileData)

    // Notify all subscribers
    subscribers.forEach((callback) => callback(globalProfileData))
  }, [])

  const updateProfileImage = useCallback((imageUri: string) => {
    // Update global store
    globalProfileData = { ...globalProfileData, profileImage: imageUri }
    // Update local state
    setProfileData(globalProfileData)

    console.log('updateProfileImage: Updated profile image in store:', imageUri)

    // Notify all subscribers
    subscribers.forEach((callback) => callback(globalProfileData))
  }, [])

  const getProfileData = useCallback(() => {
    return globalProfileData
  }, [])

  return {
    profileData,
    updateProfile,
    updateProfileImage,
    getProfileData,
    subscribe,
  }
}

// Export functions for direct access
export const getGlobalProfileData = () => globalProfileData

// Update global profile data and notify all subscribers
export const updateGlobalProfile = (newData: Partial<ProfileData>) => {
  console.log('updateGlobalProfile called with:', newData);

  // Only update if there are actual changes and values are not empty
  const hasChanges = Object.entries(newData).some(([key, value]) => {
    const currentValue = globalProfileData[key as keyof ProfileData];
    return currentValue !== value &&
      (value !== undefined && value !== null &&
        (typeof value !== 'string' || value.trim() !== ''));
  });

  if (hasChanges) {
    console.log('Updating global profile with new data');

    // Update global store with non-empty values
    const filteredData = { ...newData };
    Object.entries(filteredData).forEach(([key, value]) => {
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        delete filteredData[key as keyof Partial<ProfileData>];
      }
    });

    globalProfileData = { ...globalProfileData, ...filteredData };

    // Notify all subscribers with updated data
    subscribers.forEach((callback) => callback(globalProfileData));
  } else {
    console.log('No valid changes detected in profile data, skipping update');
  }
}

// Update global profile image and notify all subscribers
export const updateGlobalProfileImage = (imageUri: string) => {
  console.log('updateGlobalProfileImage called with:', imageUri);

  // Only update if there are actual changes and image URI is valid
  if (globalProfileData.profileImage !== imageUri && imageUri && imageUri.trim() !== '') {
    console.log('Updating global profile image');
    globalProfileData = { ...globalProfileData, profileImage: imageUri };
    subscribers.forEach((callback) => callback(globalProfileData));
  } else {
    console.log('No valid changes in profile image, skipping update');
  }
}

export default useProfileStore;