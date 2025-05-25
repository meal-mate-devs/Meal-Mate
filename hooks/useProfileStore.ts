"use client"

import { useCallback, useState } from "react"

interface ProfileData {
  name: string
  email: string
  profileImage?: string
}

// Global state store
let globalProfileData: ProfileData = {
  name: "Test User",
  email: "testuser@example.com",
  profileImage: "",
}

let subscribers: Array<(data: ProfileData) => void> = []

export const useProfileStore = () => {
  const [profileData, setProfileData] = useState<ProfileData>(globalProfileData)

  const subscribe = useCallback((callback: (data: ProfileData) => void) => {
    subscribers.push(callback)
    return () => {
      subscribers = subscribers.filter((sub) => sub !== callback)
    }
  }, [])

  const updateProfile = useCallback((newData: Partial<ProfileData>) => {
    globalProfileData = { ...globalProfileData, ...newData }
    setProfileData(globalProfileData)

    // Notify all subscribers
    subscribers.forEach((callback) => callback(globalProfileData))
  }, [])

  const updateProfileImage = useCallback((imageUri: string) => {
    globalProfileData = { ...globalProfileData, profileImage: imageUri }
    setProfileData(globalProfileData)

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
export const updateGlobalProfile = (newData: Partial<ProfileData>) => {
  globalProfileData = { ...globalProfileData, ...newData }
  subscribers.forEach((callback) => callback(globalProfileData))
}
export const updateGlobalProfileImage = (imageUri: string) => {
  globalProfileData = { ...globalProfileData, profileImage: imageUri }
  subscribers.forEach((callback) => callback(globalProfileData))
}

export default useProfileStore;