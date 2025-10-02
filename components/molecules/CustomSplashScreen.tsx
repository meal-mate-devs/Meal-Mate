
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function CustomSplashScreen() {
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const textFadeAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Start rotation animation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();

        // Text fade in
        Animated.timing(textFadeAnim, {
            toValue: 1,
            duration: 1000,
            delay: 500,
            useNativeDriver: true,
        }).start();

        // Glow animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    return (
        <View style={styles.container}>
            {/* Animated Background Gradient */}
            <LinearGradient
                colors={['#000000', '#0F172A', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Floating Particles Background */}
                <View style={styles.particlesContainer}>
                    {[...Array(6)].map((_, i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.particle,
                                {
                                    width: 4 + Math.random() * 8,
                                    height: 4 + Math.random() * 8,
                                    backgroundColor: ['#FACC15', '#F97316', '#10B981'][i % 3],
                                    left: Math.random() * SCREEN_WIDTH,
                                    top: Math.random() * SCREEN_HEIGHT,
                                    transform: [{
                                        rotate: rotateAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [`${i * 60}deg`, `${i * 60 + 360}deg`],
                                        })
                                    }],
                                }
                            ]}
                        />
                    ))}
                </View>

                {/* Main Content Container */}
                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        }
                    ]}
                >
                    {/* Outer Glow Ring */}
                    <Animated.View
                        style={[
                            styles.glowRing,
                            styles.outerGlow,
                            {
                                transform: [{ rotate }],
                                shadowOpacity: glowOpacity,
                            }
                        ]}
                    />

                    {/* Middle Glow Ring */}
                    <Animated.View
                        style={[
                            styles.glowRing,
                            styles.middleGlow,
                            {
                                shadowOpacity: glowOpacity,
                            }
                        ]}
                    />

                    {/* Inner Glow Ring */}
                    <Animated.View
                        style={[
                            styles.glowRing,
                            styles.innerGlow,
                            {
                                shadowOpacity: glowOpacity,
                            }
                        ]}
                    />

                    {/* Lottie Animation Container */}
                    <View style={styles.lottieContainer}>
                        <LottieView
                            source={require('@/assets/lottie/splashscrreenloading.json')}
                            autoPlay
                            loop
                            style={styles.lottie}
                        />
                    </View>

                    {/* App Title */}
                    <Animated.View
                        style={[
                            styles.titleContainer,
                            { opacity: textFadeAnim }
                        ]}
                    >
                        <Text style={styles.appTitle}>MealMate</Text>
                        <Text style={styles.appSubtitle}>Your Personal Culinary Companion</Text>
                    </Animated.View>

                    {/* Loading Indicator */}
                    <Animated.View
                        style={[
                            styles.loadingContainer,
                            { opacity: textFadeAnim }
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.loadingDot,
                                styles.yellowDot,
                                {
                                    opacity: glowAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0.3, 1, 0.3],
                                    }),
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.loadingDot,
                                styles.orangeDot,
                                {
                                    opacity: glowAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0.3, 0.3, 1],
                                    }),
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.loadingDot,
                                styles.greenDot,
                                {
                                    opacity: glowAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [1, 0.3, 0.3],
                                    }),
                                }
                            ]}
                        />
                        <Text style={styles.loadingText}>Connecting to MealMate...</Text>
                    </Animated.View>

                    {/* Decorative Bottom Elements */}
                    <Animated.View
                        style={[
                            styles.decorativeContainer,
                            { opacity: textFadeAnim }
                        ]}
                    >
                        <View style={styles.decorativeRow}>
                            <View style={[styles.decorativeBar, styles.yellowBar]} />
                            <View style={[styles.decorativeBar, styles.orangeBar]} />
                            <View style={[styles.decorativeBar, styles.blueBar]} />
                        </View>
                    </Animated.View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    particlesContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    particle: {
        position: 'absolute',
        borderRadius: 50,
        opacity: 0.2,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    glowRing: {
        position: 'absolute',
        borderRadius: 140,
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 30,
    },
    outerGlow: {
        width: 280,
        height: 280,
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
    },
    middleGlow: {
        width: 220,
        height: 220,
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        shadowColor: '#F97316',
        shadowRadius: 25,
    },
    innerGlow: {
        width: 160,
        height: 160,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        shadowColor: '#10B981',
        shadowRadius: 20,
    },
    lottieContainer: {
        position: 'relative',
        zIndex: 10,
        marginBottom: 32,
    },
    lottie: {
        width: 200,
        height: 200,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    appTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        letterSpacing: 2,
    },
    appSubtitle: {
        fontSize: 18,
        color: '#D1D5DB',
        textAlign: 'center',
        lineHeight: 24,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    yellowDot: {
        backgroundColor: '#FACC15',
    },
    orangeDot: {
        backgroundColor: '#F97316',
    },
    greenDot: {
        backgroundColor: '#10B981',
    },
    loadingText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginLeft: 12,
    },
    decorativeContainer: {
        position: 'absolute',
        bottom: 80,
        left: 32,
        right: 32,
    },
    decorativeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    decorativeBar: {
        height: 4,
        borderRadius: 2,
        opacity: 0.5,
    },
    yellowBar: {
        width: 48,
        backgroundColor: '#FACC15',
    },
    orangeBar: {
        width: 32,
        backgroundColor: '#F97316',
    },
    blueBar: {
        width: 40,
        backgroundColor: '#3B82F6',
    },
});
