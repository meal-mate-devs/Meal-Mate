"use client"

import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect, useRef, useState } from "react"
import { Animated, Image, Text, TouchableOpacity, View } from "react-native"
import { useProfileStore } from "../../hooks/useProfileStore"
interface StandaloneHomeHeaderProps {
  onProfilePress: () => void
}

const StandaloneHomeHeader: React.FC<StandaloneHomeHeaderProps> = ({
  onProfilePress,
}) => {
  const { profileData, subscribe } = useProfileStore()
  const [localProfileData, setLocalProfileData] = useState(profileData)
  const greetingAnimation = useRef(new Animated.Value(0)).current
  const profilePulse = useRef(new Animated.Value(1)).current
  // Subscribe to profile updates
  useEffect(() => {
    const unsubscribe = subscribe((updatedData) => {
      console.log("Header received update:", updatedData) // Debug log
      setLocalProfileData(updatedData)
    })

    return unsubscribe
  }, [subscribe])

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    if (hour < 20) return "Good Evening"
    return "Good Evening"
  }

  // Entrance animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(greetingAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    // Profile pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(profilePulse, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(profilePulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    )
    pulseLoop.start()

    return () => pulseLoop.stop()
  }, [])

  const handleProfilePress = () => {
    // Add haptic feedback animation
    Animated.sequence([
      Animated.spring(profilePulse, {
        toValue: 0.95,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(profilePulse, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start()

    onProfilePress()
  }

  const firstName = localProfileData.name.split(" ")[0] || "User"

  return (
    <View className="relative">
      {/* Background Gradient */}
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 0.4)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />

      {/* Main Header Content */}
      <View className="flex-row items-center justify-between px-6 py-6 pt-6 pb-2">
        {/* Greeting Section */}
        <Animated.View
          className="flex-1"
          style={{
            opacity: greetingAnimation,
            transform: [
              {
                translateY: greetingAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <View className="mb-1">
            <Text className="text-gray-400 text-sm font-medium tracking-wide">
              {getGreeting()},
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-white text-2xl font-bold mr-2">{firstName}</Text>
            <View className="w-2 h-2 rounded-full bg-orange-500 opacity-80" />
          </View>
          <View className="mt-1">
            <Text className="text-gray-500 text-xs">Ready to cook something amazing?</Text>
          </View>
        </Animated.View>

        <View className="flex-row items-center space-x-4">  
          {/* Profile Picture */}
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8} className="relative">
            <Animated.View
              style={{
                transform: [{ scale: profilePulse }],
              }}
            >
              {/* Glow Effect */}
              <View className="absolute -inset-2 rounded-full bg-gradient-to-r from-yellow-400/30 to-orange-500/30 blur-lg" />

              {/* Profile Container */}
              <View className="relative w-16 h-16 rounded-full overflow-hidden">
                {/* Border Ring */}
                <View className="absolute inset-0 rounded-full p-0">
                  <LinearGradient
                    colors={["#FACC15", "#F97316", "#FACC15"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-1 rounded-full p-0.5"
                  >
                    <View className="flex-1 rounded-full bg-black" />
                  </LinearGradient>
                </View>

                {/* Profile Image/Avatar */}
                <View className="absolute inset-1 rounded-full overflow-hidden">
                  {localProfileData.profileImage ? (
                    <Image
                      key={localProfileData.profileImage}
                      source={{ uri: localProfileData.profileImage }}
                      className="w-full h-full"
                      resizeMode="cover"
                      onLoad={() => console.log("Image loaded:", localProfileData.profileImage)} // Debug
                      onError={(error) => console.log("Image error:", error)} // Debug
                    />
                  ) : (
                    <LinearGradient
                      colors={["#FACC15", "#F97316"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="w-full h-full items-center justify-center"
                    >
                      <Text className="text-white text-xl font-bold">
                        {firstName.charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
              </View>
              {/* Subtle Shadow */}
              <View
                className="absolute inset-0 rounded-full"
                style={{
                  shadowColor: "#FACC15",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Decorative Elements */}
      <View className="absolute top-4 left-4 w-1 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full opacity-60" />
      <View className="absolute top-6 right-4 w-1 h-4 bg-gradient-to-b from-orange-500 to-yellow-400 rounded-full opacity-40" />

      {/* Bottom Fade */}
      <LinearGradient
        colors={["transparent", "rgba(0, 0, 0, 0.1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="absolute bottom-0 left-0 right-0 h-4"
      />
    </View>
  )
}

export default StandaloneHomeHeader