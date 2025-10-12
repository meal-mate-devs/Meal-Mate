import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Create shape animations outside component to avoid recreation
const shapeAnims = Array.from({ length: 10 }, () => ({
  translateY: new Animated.Value(0),
  rotate: new Animated.Value(0),
  opacity: new Animated.Value(1),
}));

// Pre-calculate shape properties to avoid Math.random during render
const shapeProperties = Array.from({ length: 10 }, () => ({
  size: Math.floor(Math.random() * 80) + 20,
  left: Math.floor(Math.random() * (Dimensions.get('window').width - (Math.floor(Math.random() * 80) + 20))),
}));

// Main App Component - The Splash Screen
export default function CustomSplashScreen() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const logoGlowAnim = useRef(new Animated.Value(0)).current;
  const particleAnim1 = useRef(new Animated.Value(0)).current;
  const particleAnim2 = useRef(new Animated.Value(0)).current;
  const particleAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animations to initial state
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    rotateAnim.setValue(0);
    textFadeAnim.setValue(0);
    logoGlowAnim.setValue(0);
    particleAnim1.setValue(0);
    particleAnim2.setValue(0);
    particleAnim3.setValue(0);

    // Reset shape animations
    shapeAnims.forEach(anim => {
      anim.translateY.setValue(0);
      anim.rotate.setValue(0);
      anim.opacity.setValue(1);
    });

    // Start mount animations
    const startAnimations = () => {
      // Create shape animations
      const shapeAnimations = shapeAnims.map((anim, i) =>
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: -height,
            duration: 12000 + (i * 1000),
            delay: i * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 4,
            duration: 12000 + (i * 1000),
            delay: i * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 12000 + (i * 1000),
            delay: i * 500,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 10,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 700,
          delay: 800,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(logoGlowAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(logoGlowAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.timing(particleAnim1, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(particleAnim2, {
            toValue: 1,
            duration: 4000,
            delay: 1000,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(particleAnim3, {
            toValue: 1,
            duration: 3500,
            delay: 2000,
            useNativeDriver: true,
          })
        ),
        ...shapeAnimations,
      ]).start();
    };

    // Start animations after component mounts
    const timer = setTimeout(startAnimations, 100);

    return () => {
      clearTimeout(timer);
      // Stop all animations when component unmounts
      Animated.timing(fadeAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 0, useNativeDriver: true }).start();
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-45deg', '0deg'],
  });

  const logoGlowInterpolate = logoGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const particle1Y = particleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.3, height * 0.1],
  });

  const particle2Y = particleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.6, height * 0.4],
  });

  const particle3Y = particleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.8, height * 0.7],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background Gradient */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a', '#1f1f1f', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Floating Particles */}
        <View style={styles.particlesContainer}>
          <Animated.View
            style={[
              styles.particle,
              styles.particle1,
              { transform: [{ translateY: particle1Y }] }
            ]}
          />
          <Animated.View
            style={[
              styles.particle,
              styles.particle2,
              { transform: [{ translateY: particle2Y }] }
            ]}
          />
          <Animated.View
            style={[
              styles.particle,
              styles.particle3,
              { transform: [{ translateY: particle3Y }] }
            ]}
          />
        </View>

        {/* Background Animated Shapes */}
        <View style={styles.shapesContainer}>
          {shapeAnims.map((anim, i) => {
            const { size, left } = shapeProperties[i];

            return (
              <Animated.View
                key={i}
                style={[
                  styles.shape,
                  {
                    width: size,
                    height: size,
                    left,
                    transform: [
                      { translateY: anim.translateY },
                      { rotate: anim.rotate.interpolate({
                        inputRange: [0, 4],
                        outputRange: ['0deg', '720deg'],
                      })},
                    ],
                    opacity: anim.opacity,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Main content container */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          {/* Elegant Logo with Glow Effect */}
          <View style={styles.logoContainer}>
            <Animated.View
              style={[
                styles.logoGlow,
                { transform: [{ scale: logoGlowInterpolate }] }
              ]}
              >
              <Image

                  source={require('../../assets/images/splash-icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
            </Animated.View>
          </View>

          {/* App Title with Enhanced Typography */}
          <Animated.View style={[styles.titleContainer, { opacity: textFadeAnim }]}>
            <Text style={styles.titleText}>MealMate</Text>
            <Text style={styles.subtitleText}>Your Culinary Companion</Text>
          </Animated.View>

          {/* Decorative Elements */}
          <View style={styles.decorativeContainer}>
            <View style={styles.decorativeLine} />
            <View style={styles.decorativeDot} />
            <View style={styles.decorativeLine} />
          </View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.6)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  particle1: {
    left: width * 0.2,
  },
  particle2: {
    right: width * 0.25,
  },
  particle3: {
    left: width * 0.7,
  },
  shapesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  shape: {
    position: 'absolute',
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderRadius: 8,
    bottom: -150,
  },
  contentContainer: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    opacity: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#FCD34D',
    textAlign: 'center',
    letterSpacing: 1,
    opacity: 0.9,
  },
  decorativeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  decorativeLine: {
    width: 40,
    height: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 1,
    opacity: 0.6,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginHorizontal: 16,
    opacity: 0.8,
  },
});
