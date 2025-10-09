"use client"

import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect, useRef } from "react"
import { Animated, Dimensions, StyleSheet, View } from "react-native"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface PantryLoadingAnimationProps {
  message?: string
}

const PantryLoadingAnimation: React.FC<PantryLoadingAnimationProps> = ({
  message = "Loading your pantry..."
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const bounceAnim = useRef(new Animated.Value(0)).current

  // Individual food item animations
  const foodAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current

  // Animated dots for loading text
  const dotAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current

  useEffect(() => {
    // Main container animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()

    // Rotating animation for the central icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start()

    // Bouncing animation for the text
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Staggered food item animations
    const foodItems = foodAnimations.map((anim, index) =>
      Animated.sequence([
        Animated.delay(index * 200),
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ])
    )

    Animated.stagger(150, foodItems).start()

    // Animated dots
    const dotAnims = dotAnimations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 300),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      )
    )

    dotAnims.forEach(anim => anim.start())
  }, [])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const foodIcons = [
    { name: "nutrition-outline", color: "#22C55E" }, // vegetables
    { name: "restaurant-outline", color: "#F97316" }, // fruits
    { name: "fish-outline", color: "#EF4444" }, // meat
    { name: "water-outline", color: "#3B82F6" }, // dairy
    { name: "leaf-outline", color: "#8B5CF6" }, // grains
  ]

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.mainContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Central rotating pantry icon */}
        <View style={styles.centerIconContainer}>
          <LinearGradient
            colors={['#FACC15', '#F97316']}
            style={styles.centerIconBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <MaterialIcons name="kitchen" size={40} color="white" />
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Animated food icons orbiting around */}
        <View style={styles.foodIconsContainer}>
          {foodIcons.map((icon, index) => (
            <Animated.View
              key={index}
              style={[
                styles.foodIconWrapper,
                {
                  transform: [
                    {
                      scale: foodAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                    {
                      translateY: foodAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[icon.color, icon.color + '80']}
                style={styles.foodIconBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={icon.name as any} size={24} color="white" />
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  centerIconContainer: {
    marginBottom: 40,
  },
  centerIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FACC15',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  foodIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    flexWrap: 'wrap',
  },
  foodIconWrapper: {
    margin: 8,
  },
  foodIconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FACC15',
    marginHorizontal: 4,
  },
})

export default PantryLoadingAnimation