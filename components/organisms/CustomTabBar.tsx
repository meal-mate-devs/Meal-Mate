"use client"

import { Feather, Ionicons } from "@expo/vector-icons"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect, useRef } from "react"
import { Animated, Dimensions, Pressable, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const order = ["home/index", "community/index", "create/index", "chef/index", "statistics/index"]

  const visibleRoutes = order
    .map((name) => state.routes.find((route) => route.name === name))
    .filter((route): route is any => route !== undefined)

  const tabWidth = SCREEN_WIDTH / visibleRoutes.length
  const focusedRouteName = state.routes[state.index]?.name
  const focusedIndex = visibleRoutes.findIndex((r) => r.name === focusedRouteName)

  // Animated values
  const iconScales = useRef(visibleRoutes.map((_, i) => new Animated.Value(i === focusedIndex ? 1.2 : 1))).current
  const iconOpacities = useRef(visibleRoutes.map((_, i) => new Animated.Value(i === focusedIndex ? 1 : 0.6))).current
  const circleScales = useRef(visibleRoutes.map((_, i) => new Animated.Value(i === focusedIndex ? 1 : 0))).current
  const createButtonScale = useRef(new Animated.Value(1)).current
  const createButtonRotation = useRef(new Animated.Value(0)).current
  const backgroundGlow = useRef(new Animated.Value(0)).current

  // Floating animation for create button
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(createButtonScale, {
          toValue: 1.07,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(createButtonScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    )
    floatAnimation.start()

    return () => floatAnimation.stop()
  }, [])

  useEffect(() => {
    if (focusedIndex < 0) return

    // Background glow animation
    Animated.timing(backgroundGlow, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start()

    // Icon and circle animations
    visibleRoutes.forEach((_, i) => {
      Animated.parallel([
        Animated.spring(iconScales[i], {
          toValue: i === focusedIndex ? 1.1 : 0.9,
          useNativeDriver: true,
          friction: 6,
          tension: 120,
        }),
        Animated.timing(iconOpacities[i], {
          toValue: i === focusedIndex ? 1 : 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(circleScales[i], {
          toValue: i === focusedIndex && i !== 2 ? 1 : 0,
          useNativeDriver: true,
          friction: 8,
          tension: 100,
        }),
      ]).start()
    })

    // Create button special animation when focused
    if (focusedIndex === 2) {
      Animated.sequence([
        Animated.timing(createButtonRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(createButtonRotation, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [focusedIndex])

  const getTabIcon = (name: string, focused: boolean, index: number) => {
    const cleanedName = name.split("/")[0]

    const iconProps = {
      size: 24,
      color: focused ? "#FFFFFF" : "#9CA3AF",
    }

    if (cleanedName === "home") {
      return focused ? <Ionicons name="home" {...iconProps} /> : <Ionicons name="home-outline" {...iconProps} />
    } else if (cleanedName === "community") {
      return focused ? <Ionicons name="people" {...iconProps} /> : <Ionicons name="people-outline" {...iconProps} />
    } else if (cleanedName === "create") {
      return (
        <Animated.View
          style={{
            width: 44,
            height: 44,
            borderRadius: 25,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 0,
            overflow: "hidden",
            transform: [
              { scale: createButtonScale },
              {
                rotate: createButtonRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                }),
              },
            ],
            shadowColor: "#FACC15",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 15,
          }}
        >
          <LinearGradient
            colors={["#FACC15", "#F97316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: "100%",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Feather name="plus" size={26} color="white" />
          </LinearGradient>
        </Animated.View>
      )
    } else if (cleanedName === "chef") {
      return focused ? (
        <Ionicons name="restaurant" {...iconProps} />
      ) : (
        <Ionicons name="restaurant-outline" {...iconProps} />
      )
    } else if (cleanedName === "statistics") {
      return focused ? (
        <Ionicons name="stats-chart" {...iconProps} />
      ) : (
        <Ionicons name="stats-chart-outline" {...iconProps} />
      )
    } else {
      return focused ? (
        <Ionicons name="help-circle" {...iconProps} />
      ) : (
        <Ionicons name="help-circle-outline" {...iconProps} />
      )
    }
  }

  return (
    <View
      style={{
        paddingBottom: insets.bottom + 8,
        backgroundColor: "#000000",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 15,
        position: "relative",
      }}
    >      
      {/* Tab buttons */}
      <View style={{ flexDirection: "row", height: 80, paddingTop: 0 }}>
        {visibleRoutes.map((route, index) => {
          const isFocused = focusedIndex === index

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            })
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
              }}
            >
              {/* Gradient circle around active icon (excluding create button) */}
              {index !== 2 && (
                <Animated.View
                  style={{
                    position: "absolute",
                    width: 50,
                    height: 50,
                    borderRadius: 0,
                    transform: [{ scale: circleScales[index] }],
                    opacity: circleScales[index],
                  }}
                >
                  <LinearGradient
                    colors={["#FACC10", "#F97416"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 25,
                      padding: 1.5, // This creates the border thickness
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#000000",
                        borderRadius: 23,
                      }}
                    />
                  </LinearGradient>
                </Animated.View>
              )}

              <Animated.View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ scale: iconScales[index] }],
                  opacity: iconOpacities[index],
                  zIndex: 1,
                }}
              >
                {getTabIcon(route.name, isFocused, index)}
              </Animated.View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}