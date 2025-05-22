import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface LoadingIndicatorProps {
    message?: string;
    size?: 'small' | 'large' | number;
    fullScreen?: boolean;
    type?: 'default' | 'overlay' | 'inline';
    color?: string;
}

export default function LoadingIndicator({ 
    message = 'Loading...', 
    size = 'large', 
    fullScreen = false,
    type = 'default',
    color = '#FBBF24'  // Using your app's yellow color to match theme
}: LoadingIndicatorProps) {
    // Animation for subtle pulsing effect
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    
    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Loading dots animation for the text
    const [dots, setDots] = React.useState('');
    
    React.useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        
        return () => clearInterval(interval);
    }, []);
    
    // Choose the appropriate container based on type
    if (fullScreen) {
        return (
            <View style={styles.fullScreenContainer}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradientBackground}
                >
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <ActivityIndicator size={size} color={color} />
                    </Animated.View>
                    <Text className="mt-4 text-white font-medium text-center">
                        {message}{dots}
                    </Text>
                </LinearGradient>
            </View>
        );
    }
    
    if (type === 'overlay') {
        return (
            <View style={styles.overlayContainer}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.8)']}
                    style={styles.overlayGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <ActivityIndicator size={size} color={color} />
                    </Animated.View>
                    <Text className="mt-3 text-white text-sm font-medium">
                        {message}{dots}
                    </Text>
                </LinearGradient>
            </View>
        );
    }
    
    // Default inline indicator
    return (
        <View className="flex-col justify-center items-center py-4">
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <ActivityIndicator size={size} color={color} />
            </Animated.View>
            <Text className="mt-3 text-gray-300 font-medium text-center">
                {message}{dots}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    gradientBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    overlayGradient: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 120,
    },
});