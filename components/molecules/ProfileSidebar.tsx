"use client"

import { useAuthContext } from "@/context/authContext"
import { logout } from "@/lib/modules/firebase/authService"
import { Feather, Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import { Alert, Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useProfileStore } from "../../hooks/useProfileStore"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

// Enhanced menu items with descriptions
const menuItems = [
  { icon: "home", label: "Home", route: "/home", description: "Dashboard & Overview" },
  { icon: "heart", label: "Favorites", route: "recipe/favorites", description: "Saved Recipes" },
  { icon: "bell", label: "Notifications", route: "settings/notifications", description: "Updates & Alerts" },
  { icon: "package", label: "Pantry", route: "/recipe/pantry", description: "Pantry Management" },
  { icon: "settings", label: "Settings", route: "/settings", description: "App Preferences" },
  { icon: "shopping-cart", label: "Grocery List", route: "settings/grocery-list", description: "Shopping & Groceries" },
]

interface ProfileSidebarProps {
  isOpen: boolean
  onClose: () => void
  onEditProfile?: () => void
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isOpen, onClose, onEditProfile }) => {
  const insets = useSafeAreaInsets()
  const { profileData, updateProfileImage, subscribe } = useProfileStore()
  const { profile, user, updateUserProfile } = useAuthContext()

  // Add local state to force re-renders
  const [localProfileData, setLocalProfileData] = useState(profileData)

  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(0.95)).current
  const router = useRouter()

  const [isImageLoading, setIsImageLoading] = useState(false)

  // Animation values
  const menuItemAnimations = useRef(menuItems.map(() => new Animated.Value(0))).current
  const profileAnimation = useRef(new Animated.Value(0)).current
  const glowAnimation = useRef(new Animated.Value(0)).current
  const profileImageScale = useRef(new Animated.Value(1)).current

  // Get data from auth context (primary source of truth)
  useEffect(() => {
    if (profile) {
      // Create user data from auth profile
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      const realUserData = {
        name: fullName || profile.userName || (user?.displayName || 'User'),
        email: profile.email || user?.email || '',
        profileImage: profile.profileImage?.url || ''
      };

      console.log('ProfileSidebar: Using real profile data:', realUserData);
      setLocalProfileData(realUserData);
    } else if (user) {
      // Fallback to Firebase user object
      const fallbackData = {
        name: user.displayName || 'User',
        email: user.email || '',
        profileImage: ''
      };

      console.log('ProfileSidebar: Using fallback user data:', fallbackData);
      setLocalProfileData(fallbackData);
    }
  }, [
    profile?.firstName,
    profile?.lastName,
    profile?.userName,
    profile?.email,
    profile?.profileImage?.url,
    user?.displayName,
    user?.email
  ])

  // Subscribe to profile store updates as backup
  useEffect(() => {
    // Only use profile store data if we don't have direct profile data
    if (!profile && !user) {
      console.log('ProfileSidebar: Using store data as fallback:', profileData);
      setLocalProfileData(profileData);
    }

    const unsubscribe = subscribe((updatedData) => {
      console.log('ProfileSidebar received store update:', updatedData);

      // Only use store updates if we don't have direct profile data
      if (!profile && !user) {
        setLocalProfileData(updatedData);
      }
    });

    return unsubscribe;
  }, [subscribe, profileData])

  // Continuous glow animation
  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    )
    glowLoop.start()
    return () => glowLoop.stop()
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Opening animations
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start()

      // Profile section animation
      Animated.timing(profileAnimation, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }).start()

      // Staggered menu items animation
      menuItemAnimations.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: 300 + index * 80,
          useNativeDriver: true,
        }).start()
      })
    } else {
      // Closing animations
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -SCREEN_WIDTH,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 0.95,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start()

      // Reset animations
      profileAnimation.setValue(0)
      menuItemAnimations.forEach((anim) => anim.setValue(0))
    }
  }, [isOpen])

  const handleNavigation = (route: string) => {
    onClose()
    setTimeout(() => {
      if (route === "/settings/payment") {
        router.push({ pathname: route, params: { from: "sidebar" } })
      } else {
        router.push({ pathname: route as any })
      }
    }, 300)
  }

  const handleEditProfile = () => {
    onClose()
    if (typeof onEditProfile === "function") {
      onEditProfile()
    }
  }

  const pickImage = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (cameraPermission.status !== "granted" || mediaLibraryPermission.status !== "granted") {
        Alert.alert("Permission needed", "Camera and photo library permissions are required to change profile picture.")
        return
      }

      // Animate profile image
      Animated.sequence([
        Animated.spring(profileImageScale, {
          toValue: 0.9,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(profileImageScale, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start()

      Alert.alert(
        "Select Profile Picture",
        "Choose how you want to select your profile picture",
        [
          {
            text: "Camera",
            onPress: () => openCamera(),
          },
          {
            text: "Photo Library",
            onPress: () => openImageLibrary(),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
        { cancelable: true },
      )
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to open image picker")
    }
  }

  const openCamera = async () => {
    try {
      setIsImageLoading(true)
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri

        // Update both profile store and real user profile
        updateProfileImage(imageUri)

        try {
          // Update the real user profile in the auth context
          if (updateUserProfile) {
            console.log('Updating user profile with new image');
            // The image object expected by updateUserProfile
            const imageObject = {
              uri: imageUri,
              type: 'image/jpeg',
              name: `profile_${Date.now()}.jpg`,
            };

            await updateUserProfile({}, imageObject);
            console.log('Real user profile updated with new image');
          }
        } catch (updateError) {
          console.error('Error updating real user profile:', updateError);
          // Continue with local update even if server update fails
        }

        // Success animation
        Animated.sequence([
          Animated.spring(profileImageScale, {
            toValue: 1.1,
            friction: 6,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.spring(profileImageScale, {
            toValue: 1,
            friction: 6,
            tension: 200,
            useNativeDriver: true,
          }),
        ]).start()

        Alert.alert("Success!", "Profile picture updated successfully!")
      }
    } catch (error) {
      console.error("Error opening camera:", error)
      Alert.alert("Error", "Failed to open camera")
    } finally {
      setIsImageLoading(false)
    }
  }

  const openImageLibrary = async () => {
    try {
      setIsImageLoading(true)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri

        // Update profile store for immediate UI feedback
        updateProfileImage(imageUri)

        try {
          // Update the real user profile in the auth context
          if (updateUserProfile) {
            console.log('Updating user profile with new image from gallery');
            // The image object expected by updateUserProfile
            const imageObject = {
              uri: imageUri,
              type: result.assets[0].type || 'image/jpeg',
              name: `profile_${Date.now()}.${result.assets[0].type?.split('/')[1] || 'jpg'}`,
            };

            await updateUserProfile({}, imageObject);
            console.log('Real user profile updated with new image from gallery');
          }
        } catch (updateError) {
          console.error('Error updating real user profile:', updateError);
          // Continue with local update even if server update fails
        }

        // Success animation
        Animated.sequence([
          Animated.spring(profileImageScale, {
            toValue: 1.1,
            friction: 6,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.spring(profileImageScale, {
            toValue: 1,
            friction: 6,
            tension: 200,
            useNativeDriver: true,
          }),
        ]).start()

        Alert.alert("Success!", "Profile picture updated successfully!")
      }
    } catch (error) {
      console.error("Error opening image library:", error)
      Alert.alert("Error", "Failed to open photo library")
    } finally {
      setIsImageLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          onClose();
          logout()
            .then(() => {
              router.replace('/login');
            })
            .catch((error: unknown) => {
              console.error('Logout failed:', error);
            });
        },
      },
    ])
  }

  const renderProfileImage = () => {
    if (isImageLoading) {
      return (
        <View style={styles.profileImageContainer}>
          <Animated.View
            style={[
              styles.profileImage,
              {
                transform: [{ scale: profileImageScale }],
              },
            ]}
          >
            <View style={styles.loadingContainer}>
              <Animated.View
                style={[
                  styles.loadingSpinner,
                  {
                    transform: [
                      {
                        rotate: glowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.spinnerGradient} />
              </Animated.View>
              <Text style={styles.loadingText}>Uploading...</Text>
            </View>
          </Animated.View>
        </View>
      )
    }

    return (
      <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.profileImage,
            {
              transform: [{ scale: profileImageScale }],
            },
          ]}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.profileGlow,
              {
                opacity: glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
              },
            ]}
          />

          {/* Profile image content - USE localProfileData */}
          {localProfileData.profileImage && localProfileData.profileImage.trim() !== "" ? (
            <Image
              source={{ uri: localProfileData.profileImage }}
              style={styles.avatar}
              key={localProfileData.profileImage} // Force re-render
              onError={(error) => {
                console.log('Error loading profile image:', error);
                // Image loading failed, but we'll show the fallback gradient in the UI
              }}
            />
          ) : (
            <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>
                {localProfileData.name && localProfileData.name.length > 0
                  ? localProfileData.name.charAt(0).toUpperCase()
                  : "U"}
              </Text>
            </LinearGradient>
          )}
        </Animated.View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50, pointerEvents: isOpen ? "auto" : "none" }]}>
      {/* Enhanced Backdrop with Blur */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <View style={styles.backdrop} />
        </BlurView>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Enhanced Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            transform: [{ translateX }, { scale: scaleAnimation }],
          },
        ]}
      >
        <BlurView intensity={80} style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={["rgba(0, 0, 0, 0.85)", "rgba(0, 0, 0, 0.9)", "rgba(0, 0, 0, 0.95)"]}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>

        {/* Animated border glow */}
        <Animated.View
          style={[
            styles.borderGlow,
            {
              opacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.6],
              }),
            },
          ]}
        />

        {/* Enhanced Profile Section */}
        <Animated.View
          style={[
            styles.profileSection,
            {
              opacity: profileAnimation,
              transform: [
                {
                  translateY: profileAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.profileHeader}>
            {renderProfileImage()}

            <Text style={styles.userName}>{localProfileData.name}</Text>
            <Text style={styles.userEmail}>{localProfileData.email}</Text>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={[styles.editProfileButton, { marginRight: 8 }]}
                onPress={() => {
                  onClose();
                  router.push('/profile');
                }}
              >
                <LinearGradient
                  colors={["rgba(250, 204, 21, 0.2)", "rgba(249, 115, 22, 0.2)"]}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="person-outline" size={16} color="#FACC15" />
                  <Text style={styles.editProfileText}>View Profile</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
                <LinearGradient
                  colors={["rgba(250, 204, 21, 0.2)", "rgba(249, 115, 22, 0.2)"]}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="create-outline" size={16} color="#FACC15" />
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Animated.View
              key={index}
              style={{
                opacity: menuItemAnimations[index],
                transform: [
                  {
                    translateX: menuItemAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Feather name={item.icon as any} size={20} color="#FACC15" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Enhanced Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <View style={styles.logoutTextContainer}>
            <Text style={styles.logoutText}>Sign Out</Text>
            <Text style={styles.logoutDescription}>End your session</Text>
          </View>
        </TouchableOpacity>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <BlurView intensity={60} style={styles.closeButtonBlur}>
            <Ionicons name="close" size={20} color="white" />
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Increased from 0.4 to 0.7
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: Math.min(320, SCREEN_WIDTH * 0.85),
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  borderGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#FACC15",
    shadowColor: "#FACC15",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  profileSection: {
    paddingHorizontal: 24,
    paddingBottom: 16, // Reduced from 24
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  profileHeader: {
    alignItems: "center",
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 12, // Reduced from 16
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    position: "relative",
  },
  profileGlow: {
    position: "absolute",
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 65,
    backgroundColor: "rgba(250, 204, 21, 0.3)",
    shadowColor: "#FACC15",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
  },
  overlayBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Increased from 0.4
  },
  loadingContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)", // Increased from 0.8
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 8,
  },
  spinnerGradient: {
    flex: 1,
  },
  loadingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  userName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2, // Reduced from 4
    textAlign: "center",
  },
  userEmail: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 12, // Reduced from 20
    textAlign: "center",
  },
  editProfileButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5, // Reduced from 10
    paddingHorizontal: 16, // Reduced from 20
    borderWidth: 1,
  },
  editProfileText: {
    color: "#FACC15",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 12, // Reduced from 20
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12, // Reduced from 16
    paddingHorizontal: 24,
    marginLeft: 2,
    marginHorizontal: 18,
    marginVertical: 1, // Reduced from 2
    borderRadius: 16,
  },
  menuIconContainer: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
    borderRadius: 18, // Reduced from 20
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14, // Reduced from 16
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 1,
  },
  menuItemDescription: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 0,
    paddingHorizontal: 26,
    marginLeft: 2,
    marginHorizontal: 12,
  },
  logoutIconContainer: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
    borderRadius: 18, // Reduced from 20
    backgroundColor: "rgba(239, 68, 68, 0.15)", // Increased from 0.1
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  logoutTextContainer: {
    flex: 1,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 1, // Reduced from 2
  },
  logoutDescription: {
    color: "#9CA3AF",
    fontSize: 11, // Reduced from 12
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  closeButtonBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)", // Increased from 0.1
  },
  iconStack: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundIcon: {
    opacity: 0.8,
  },
  foregroundIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
})

export default ProfileSidebar