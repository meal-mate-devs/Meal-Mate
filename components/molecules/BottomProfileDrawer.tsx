"use client"

import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect, useRef, useState } from "react"
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useProfileStore } from "../../hooks/useProfileStore"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const DRAWER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.75, SCREEN_HEIGHT - 100)

interface EnhancedBottomProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const EnhancedBottomProfileDrawer: React.FC<EnhancedBottomProfileDrawerProps> = ({ isOpen, onClose }) => {
  const insets = useSafeAreaInsets()
  const { profileData, updateProfile, updateProfileImage, subscribe } = useProfileStore()
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(0.95)).current
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollOffset = useRef(0)

  // Form state
  const [formData, setFormData] = useState({
    name: String(profileData.name || ""),
    email: String(profileData.email || ""),
    gender: "",
    language: "English",
    dateOfBirth: "",
  })

  const [isImageLoading, setIsImageLoading] = useState(false)
  const [fieldAnimations] = useState(() => Array.from({ length: 5 }, () => new Animated.Value(0)))

  // Animation values for various effects
  const profileImageScale = useRef(new Animated.Value(1)).current
  const saveButtonScale = useRef(new Animated.Value(1)).current
  const glowAnimation = useRef(new Animated.Value(0)).current
  const successAnimation = useRef(new Animated.Value(0)).current
  const [localProfileData, setLocalProfileData] = useState(profileData)

  // Subscribe to profile updates
  useEffect(() => {
    const unsubscribe = subscribe((newData) => {
      const updatedData = newData || {}
      setLocalProfileData(updatedData) // Add this line
      setFormData((prev) => ({
        ...prev,
        name: String(updatedData.name || ""),
        email: String(updatedData.email || ""),
      }))
    })
    return unsubscribe
  }, [subscribe])

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

  // Reset form when drawer opens
  useEffect(() => {
    const localProfileData = profileData || {}
    if (isOpen) {
      setFormData({
        name: String(localProfileData.name || ""),
        email: String(localProfileData.email || ""),
        gender: "",
        language: "English",
        dateOfBirth: "",
      })
    }
  }, [isOpen, profileData])

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return scrollOffset.current <= 0 && gestureState.dy > 5
      },
      onPanResponderGrant: () => {
        ; (translateY as any).setOffset((translateY as any).__getValue())
        translateY.setValue(0)
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset()
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          onClose()
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  const handleScroll = (event: any) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y
  }

  useEffect(() => {
    if (isOpen) {
      // Opening animations
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
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

      // Staggered field animations
      fieldAnimations.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: 200 + index * 100,
          useNativeDriver: true,
        }).start()
      })
    } else {
      // Closing animations
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: DRAWER_HEIGHT,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
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

      // Reset field animations
      fieldAnimations.forEach((anim) => anim.setValue(0))
    }
  }, [isOpen])

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera roll permissions to upload a profile picture.")
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
        updateProfileImage(imageUri)

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

        showSuccessAnimation()
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
        updateProfileImage(imageUri)

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

        showSuccessAnimation()
      }
    } catch (error) {
      console.log("Error opening image library:", error)
      Alert.alert("Error", "Failed to open photo library")
    } finally {
      setIsImageLoading(false)
    }
  }

  const showSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handleSave = () => {
    // Animate save button
    Animated.sequence([
      Animated.spring(saveButtonScale, {
        toValue: 0.95,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(saveButtonScale, {
        toValue: 1,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start()

    // Update profile data
    updateProfile(formData)

    // Show success and close
    showSuccessAnimation()
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const updateFormField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
      <TouchableOpacity style={styles.profileImageContainer} onPress={handleImagePicker} activeOpacity={0.9}>
        <Animated.View
          style={[
            styles.profileImage,
            {
              transform: [{ scale: profileImageScale }],
            },
          ]}
        >
          {/* Enhanced glow effect */}
          <Animated.View
            style={[
              styles.profileGlow,
              {
                opacity: glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 0.8],
                }),
                transform: [
                  {
                    scale: glowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Profile image content */}
          {localProfileData.profileImage ? (
            <Image
              source={{ uri: localProfileData.profileImage ? `${localProfileData.profileImage}?timestamp=${Date.now()}` : undefined }}
              style={styles.avatarImage}
              key={`${localProfileData.profileImage}-${Date.now()}`}
            />
          ) : (
            <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.avatarGradient}>
              <Text style={styles.avatarInitial}>
                {String(localProfileData?.name || "User")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </LinearGradient>
          )}

          {/* Subtle edit indicator */}
          <View style={styles.editIndicator}>
            <Ionicons name="camera" size={16} color="rgba(255, 255, 255, 0.9)" />
          </View>
        </Animated.View>

        {/* Profile badge */}
        <View style={styles.profileBadge}>
          <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.badgeGradient}>
            <Ionicons name="star" size={12} color="#000" />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    )
  }

  const renderFormField = (
    label: string,
    field: string,
    placeholder: string,
    icon: string,
    index: number,
    keyboardType: "default" | "email-address" = "default",
  ) => (
    <Animated.View
      style={[
        styles.formField,
        {
          opacity: fieldAnimations[index],
          transform: [
            {
              translateY: fieldAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <LinearGradient
          colors={["rgba(250, 204, 21, 0.1)", "rgba(249, 115, 22, 0.05)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.inputIconContainer}>
          <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.iconGradient}>
            <Ionicons name={icon as any} size={18} color="#000" />
          </LinearGradient>
        </View>
        <TextInput
          style={styles.textInput}
          value={String(formData[field as keyof typeof formData] || "")}
          onChangeText={(value) => updateFormField(field, value)}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          keyboardType={keyboardType}
          autoCapitalize={field === "email" ? "none" : "words"}
          selectionColor="#FACC15"
        />
      </View>
    </Animated.View>
  )

  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
    } else {
      const timer = setTimeout(() => {
        setIsRendered(false)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isRendered && !isOpen) return null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[StyleSheet.absoluteFill, { zIndex: 50, pointerEvents: isOpen ? "auto" : "none" }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Enhanced backdrop with blur */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <View style={styles.backdrop} />
        </BlurView>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Enhanced drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            maxHeight: DRAWER_HEIGHT,
            transform: [{ translateY }, { scale: scaleAnimation }],
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(15, 23, 42, 0.98)", "rgba(0, 0, 0, 0.98)"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Modern drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Enhanced header with profile section */}
          <View style={styles.headerSection}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <BlurView intensity={60} style={styles.closeButtonBlur}>
                <Ionicons name="close" size={20} color="white" />
              </BlurView>
            </TouchableOpacity>

            {/* Profile section */}
            <View style={styles.profileSection}>
              {renderProfileImage()}
              
              {/* User info */}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {localProfileData?.name || "Welcome Back"}
                </Text>
                <Text style={styles.userEmail}>
                  {localProfileData?.email || "user@example.com"}
                </Text>
                <View style={styles.membershipBadge}>
                  <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.membershipGradient}>
                    <Ionicons name="diamond" size={12} color="#000" />
                    <Text style={styles.membershipText}>Premium Member</Text>
                  </LinearGradient>
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced form */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Profile Information</Text>
              <Text style={styles.formSubtitle}>Update your personal details</Text>
            </View>

            {renderFormField("Full Name", "name", "Enter your full name", "person-outline", 0)}
            {renderFormField("Email Address", "email", "Enter your email", "mail-outline", 1, "email-address")}
            {renderFormField("Gender", "gender", "Select your gender", "people-outline", 2)}
            {renderFormField("Language", "language", "Preferred language", "globe-outline", 3)}
            {renderFormField("Date of Birth", "dateOfBirth", "DD/MM/YYYY", "calendar-outline", 4)}

            {/* Enhanced save button */}
            <Animated.View
              style={[
                styles.saveButtonContainer,
                {
                  transform: [{ scale: saveButtonScale }],
                },
              ]}
            >
              <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#FACC15", "#F97316"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    elevation: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    marginTop: 80,
  },
  handleContainer: {
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  handle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // Modern header section
  headerSection: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 32,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 10,
  },
  closeButtonBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  
  // Profile section
  profileSection: {
    alignItems: "center",
    marginTop: 20,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "rgba(250, 204, 21, 0.3)",
    position: "relative",
  },
  profileGlow: {
    position: "absolute",
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 75,
    backgroundColor: "rgba(250, 204, 21, 0.2)",
    shadowColor: "#FACC15",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: "800",
    color: "#000",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  editIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  profileBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    borderRadius: 12,
    overflow: "hidden",
  },
  badgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  
  // User info section
  userInfo: {
    alignItems: "center",
    gap: 8,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  userEmail: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  membershipBadge: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  membershipGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  membershipText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
  },
  
  // Form section
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  formHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  formTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    minHeight: 56,
  },
  inputIconContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    color: "#FFFFFF",
    fontSize: 16,
    zIndex: 1,
    fontWeight: "500",
  },
  
  // Save button
  saveButtonContainer: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 24,
    elevation: 8,
    shadowColor: "#FACC15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  saveButton: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  saveButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  
  // Loading states
  loadingContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  
  // Success indicator
  successIndicator: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  successCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
})

export default EnhancedBottomProfileDrawer