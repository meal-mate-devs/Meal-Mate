"use client"

import { useAuthContext } from "@/context/authContext"
import { logout } from "@/lib/modules/firebase/authService"
import { Feather, Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import { Alert, Animated, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useProfileStore } from "../../hooks/useProfileStore"
import Dialog from "../atoms/Dialog"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

// Enhanced menu items with descriptions
const menuItems = [
  { icon: "bell", label: "Notifications", route: "(tabs)/(hidden)/settings/notifications", description: "Updates & Alerts" },
  { icon: "heart", label: "Favorites", route: "recipe/favorites", description: "Saved Recipes" },
  { icon: "package", label: "Pantry", route: "recipe/pantry", description: "Pantry Management" },
  { icon: "shopping-cart", label: "Grocery List", route: "(tabs)/(hidden)/settings/grocery-list", description: "Shopping & Groceries" },
  { icon: "credit-card", label: "Subscription", route: "(tabs)/(hidden)/settings/subscription", description: "Manage Your Plan" },
  { icon: "settings", label: "Settings", route: "(tabs)/(hidden)/settings", description: "App Preferences" },
]

// Custom Image Picker Dialog Component
interface ImagePickerDialogProps {
  visible: boolean
  onClose: () => void
  onCamera: () => void
  onLibrary: () => void
  profileImage?: string
  onViewImage?: () => void
}

const ImagePickerDialog: React.FC<ImagePickerDialogProps> = ({ visible, onClose, onCamera, onLibrary, profileImage, onViewImage }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.9)
    }
  }, [visible])

  const handleCamera = () => {
    onClose()
    setTimeout(onCamera, 300)
  }

  const handleLibrary = () => {
    onClose()
    setTimeout(onLibrary, 300)
  }

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={imagePickerStyles.backdrop}>
        <Animated.View
          style={[
            imagePickerStyles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={imagePickerStyles.dialogContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Camera Icon */}
            <View style={imagePickerStyles.iconContainer}>
              <LinearGradient
                colors={['#FACC15', '#F97316']}
                style={imagePickerStyles.iconBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="camera" size={32} color="white" />
              </LinearGradient>
            </View>

            <Text style={imagePickerStyles.title}>
              Select Profile Picture
            </Text>

            <Text style={imagePickerStyles.message}>
              Choose how you want to select your profile picture
            </Text>

            <View style={imagePickerStyles.buttonContainer}>
              {/* View Image Button - only show if there's a profile image */}
              {profileImage && profileImage.trim() !== "" && (
                <TouchableOpacity
                  style={[imagePickerStyles.optionButton, { height: 50 }]}
                  onPress={() => {
                    onClose()
                    setTimeout(() => onViewImage?.(), 300)
                  }}
                  activeOpacity={0.8}
                >
                  <View style={imagePickerStyles.buttonContent}>
                    <View style={[imagePickerStyles.iconCircle, { width: 40, height: 40, borderRadius: 20, marginRight: 12 }]}>
                      <LinearGradient
                        colors={['rgba(250, 204, 21, 0.2)', 'rgba(249, 115, 22, 0.2)']}
                        style={imagePickerStyles.iconGradient}
                      />
                      <Ionicons name="eye" size={20} color="#FACC15" />
                    </View>
                    <View style={imagePickerStyles.textContainer}>
                      <Text style={imagePickerStyles.optionTitle}>View Image</Text>
                      <Text style={imagePickerStyles.optionSubtitle}>See current profile picture</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={imagePickerStyles.optionButton}
                onPress={handleCamera}
                activeOpacity={0.8}
              >
                <View style={imagePickerStyles.buttonContent}>
                  <View style={imagePickerStyles.iconCircle}>
                    <LinearGradient
                      colors={['rgba(250, 204, 21, 0.2)', 'rgba(249, 115, 22, 0.2)']}
                      style={imagePickerStyles.iconGradient}
                    />
                    <Ionicons name="camera" size={24} color="#FACC15" />
                  </View>
                  <View style={imagePickerStyles.textContainer}>
                    <Text style={imagePickerStyles.optionTitle}>Camera</Text>
                    <Text style={imagePickerStyles.optionSubtitle}>Take a new photo</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={imagePickerStyles.optionButton}
                onPress={handleLibrary}
                activeOpacity={0.8}
              >
                <View style={imagePickerStyles.buttonContent}>
                  <View style={imagePickerStyles.iconCircle}>
                    <LinearGradient
                      colors={['rgba(250, 204, 21, 0.2)', 'rgba(249, 115, 22, 0.2)']}
                      style={imagePickerStyles.iconGradient}
                    />
                    <Ionicons name="images" size={24} color="#FACC15" />
                  </View>
                  <View style={imagePickerStyles.textContainer}>
                    <Text style={imagePickerStyles.optionTitle}>Gallery</Text>
                    <Text style={imagePickerStyles.optionSubtitle}>Choose from library</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={imagePickerStyles.cancelButton}
              onPress={onClose}
            >
              <Text style={imagePickerStyles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  )
}

// Full Screen Image Viewer Component
interface FullScreenImageViewerProps {
  visible: boolean
  imageUri: string
  onClose: () => void
}

const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({ visible, imageUri, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start()
    }
  }, [visible])

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={fullScreenImageStyles.backdrop}>
        <Animated.View
          style={[
            fullScreenImageStyles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Image
            source={{ uri: imageUri }}
            style={fullScreenImageStyles.fullImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Close Button */}
        <TouchableOpacity
          style={fullScreenImageStyles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <BlurView intensity={60} style={fullScreenImageStyles.closeButtonBlur}>
            <Ionicons name="close" size={24} color="white" />
          </BlurView>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const fullScreenImageStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width * 0.95,
    height: Dimensions.get('window').height * 0.8,
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
})

const imagePickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedContainer: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 340,
  },
  dialogContainer: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 90,
    height: 90,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
    overflow: 'hidden',
  },
  iconBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  optionButton: {
    height: 70,
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  iconGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  cancelButton: {
    height: 50,
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  viewImageButton: {
    height: 70,
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewImageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
})

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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showImagePickerDialog, setShowImagePickerDialog] = useState(false)
  const [showFullScreenImage, setShowFullScreenImage] = useState(false)

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
      // For recipe-related pages (pantry, favorites), pass sidebar context
      if (route.includes("recipe/")) {
        router.push({ pathname: route as any, params: { from: "sidebar" } })
      } 
      // For settings pages and grocery list, pass sidebar context 
      else if (route.includes("settings")) {
        router.push({ pathname: route as any, params: { from: "sidebar" } })
      }
      // Default navigation
      else {
        router.push({ pathname: route as any, params: { from: "sidebar" } })
      }
    }, 300)
  }

  const handleEditProfile = () => {
    onClose()
    if (typeof onEditProfile === "function") {
      onEditProfile()
    }
  }

  const handleViewImage = () => {
    setShowFullScreenImage(true)
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

      // Show custom image picker dialog
      setShowImagePickerDialog(true)
    } catch (error) {
      console.log("Error picking image:", error)
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
          console.log('Error updating real user profile:', updateError);
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
      console.log("Error opening camera:", error)
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
            // Using consistent image type/extension like in openCamera to ensure compatibility
            const imageObject = {
              uri: imageUri,
              type: 'image/jpeg',
              name: `profile_${Date.now()}.jpg`,
            };

            await updateUserProfile({}, imageObject);
            console.log('Real user profile updated with new image from gallery');
          }
        } catch (updateError) {
          console.log('Error updating real user profile:', updateError);
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
      console.log("Error opening image library:", error)
      Alert.alert("Error", "Failed to open photo library")
    } finally {
      setIsImageLoading(false)
    }
  }

  const handleLogout = () => {
    setShowLogoutDialog(true)
  }

  const confirmLogout = () => {
    setShowLogoutDialog(false)
    onClose()
    logout()
      .then(() => {
        router.replace('/login')
      })
      .catch((error: unknown) => {
        console.log('Logout failed:', error)
      })
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
              source={{ uri: localProfileData.profileImage ? `${localProfileData.profileImage}?timestamp=${Date.now()}` : undefined }}
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

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.editProfileButton}
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
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Menu Items with ScrollView - includes Sign Out button */}
        <ScrollView 
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 12 }}
        >
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

          {/* Sign Out Button inside ScrollView */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <View style={styles.logoutTextContainer}>
              <Text style={styles.logoutText}>Sign Out</Text>
              <Text style={styles.logoutDescription}>End your session</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <BlurView intensity={60} style={styles.closeButtonBlur}>
            <Ionicons name="close" size={20} color="white" />
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

      {/* Logout Confirmation Dialog */}
      <Dialog
        visible={showLogoutDialog}
        type="warning"
        title="Sign Out"
        message="Are you sure you want to sign out?"
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        confirmText="Sign Out"
        cancelText="Cancel"
        showCancelButton={true}
      />

      {/* Custom Image Picker Dialog */}
      <ImagePickerDialog
        visible={showImagePickerDialog}
        onClose={() => setShowImagePickerDialog(false)}
        onCamera={openCamera}
        onLibrary={openImageLibrary}
        profileImage={localProfileData.profileImage}
        onViewImage={handleViewImage}
      />

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        visible={showFullScreenImage}
        imageUri={localProfileData.profileImage || ''}
        onClose={() => setShowFullScreenImage(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: Math.min(320, SCREEN_WIDTH * 0.80),
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  profileHeader: {
    alignItems: "center",
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 40,
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  loadingContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "center",
  },
  userEmail: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
  editProfileButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
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
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 1,
  },
  menuItemDescription: {
    color: "#9CA3AF",
    fontSize: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingTop: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoutTextContainer: {
    flex: 1,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  logoutDescription: {
    color: "#9CA3AF",
    fontSize: 12,
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
    backgroundColor: "rgba(255, 255, 255, 0.15)",
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