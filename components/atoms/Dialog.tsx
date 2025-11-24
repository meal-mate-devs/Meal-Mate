import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    ColorValue,
    Dimensions,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type DialogType = 'success' | 'error' | 'warning' | 'loading' | 'confirm' | 'info' | 'withdraw';

interface DialogProps {
    visible: boolean;
    type: DialogType;
    title: string;
    message?: string | React.ReactNode;
    onClose?: () => void;
    onCloseButton?: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancelButton?: boolean;
    showCloseButton?: boolean;
    autoClose?: boolean;
    autoCloseTime?: number;
}

const Dialog = ({
    visible,
    type,
    title,
    message,
    onClose,
    onCloseButton,
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancelButton = false,
    showCloseButton = false,
    autoClose = false,
    autoCloseTime = 2500
}: DialogProps) => {
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;
    
    // Food animation values
    const plateRotate = useRef(new Animated.Value(0)).current;
    const foodScale = useRef(new Animated.Value(0)).current;
    const steamOpacity = useRef(Array(3).fill(0).map(() => new Animated.Value(0))).current;
    const steamOffset = useRef(Array(3).fill(0).map(() => new Animated.Value(0))).current;
    
    // Auto close dialog after specified time
    useEffect(() => {
        if (visible && autoClose && type !== 'loading') {
            const timer = setTimeout(() => {
                onClose && onClose();
            }, autoCloseTime);
            return () => clearTimeout(timer);
        }
    }, [visible, type, autoClose]);
    
    // Dialog entry animation
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
            ]).start();
            
            // Start specific animations based on dialog type
            if (type === 'loading') {
                startLoadingAnimation();
            } else if (type === 'success') {
                startSuccessAnimation();
            } else if (type === 'error') {
                startErrorAnimation();
            } else if (type === 'warning' || type === 'withdraw') {
                startWarningAnimation();
            }
        } else {
            // Reset animations when dialog closes
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);
            pulseAnim.setValue(1);
            iconOpacity.setValue(0);
            foodScale.setValue(0);
            plateRotate.setValue(0);
            steamOpacity.forEach(anim => anim.setValue(0));
            steamOffset.forEach(anim => anim.setValue(0));
        }
    }, [visible, type]);
    
    // Loading animation - Food with rising steam
    const startLoadingAnimation = () => {
        foodScale.setValue(0.7);
        
        // Pulsating food in the center
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.9,
                    duration: 1000,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true
                })
            ])
        ).start();
        
        // Steam animation
        const createSteamAnimation = (index: number) => {
            // Reset steam values
            steamOpacity[index].setValue(0);
            steamOffset[index].setValue(0);
            
            // Create steam rising animation
            Animated.loop(
                Animated.sequence([
                    // Delay each steam cloud differently
                    Animated.delay(index * 500),
                    // Start animation sequence
                    Animated.parallel([
                        // Fade in and out
                        Animated.sequence([
                            Animated.timing(steamOpacity[index], {
                                toValue: 0.8,
                                duration: 800,
                                useNativeDriver: true
                            }),
                            Animated.timing(steamOpacity[index], {
                                toValue: 0,
                                duration: 1200,
                                useNativeDriver: true
                            })
                        ]),
                        // Rise up
                        Animated.timing(steamOffset[index], {
                            toValue: -30,
                            duration: 2000,
                            useNativeDriver: true
                        })
                    ]),
                    // Reset for loop
                    Animated.timing(steamOffset[index], {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true
                    })
                ])
            ).start();
        };
        
        // Start steam animations with delays
        createSteamAnimation(0);
        createSteamAnimation(1);
        createSteamAnimation(2);
    };
    
    // Success animation - Plate with check (completed meal)
    const startSuccessAnimation = () => {
        plateRotate.setValue(0);
        foodScale.setValue(0);
        iconOpacity.setValue(0);
        
        // Completed meal animation
        Animated.sequence([
            // Show plate with slight tilt
            Animated.timing(plateRotate, {
                toValue: 0.05, // Slight tilt for effect
                duration: 400,
                easing: Easing.out(Easing.back(2)),
                useNativeDriver: true
            }),
            // Show food
            Animated.timing(foodScale, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.back(2)),
                useNativeDriver: true
            }),
            // Show checkmark
            Animated.timing(iconOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }),
            // Final satisfied wiggle
            Animated.sequence([
                Animated.timing(plateRotate, {
                    toValue: -0.05,
                    duration: 150,
                    useNativeDriver: true
                }),
                Animated.timing(plateRotate, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true
                })
            ])
        ]).start();
    };
    
    // Error animation - Dropped plate/broken food
    const startErrorAnimation = () => {
        plateRotate.setValue(0);
        foodScale.setValue(0);
        iconOpacity.setValue(0);
        
        // Food error animation (dropped/burnt food)
        Animated.sequence([
            // Show plate with tilt
            Animated.timing(plateRotate, {
                toValue: 0.2, // Tilted plate
                duration: 300,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true
            }),
            // Show food
            Animated.timing(foodScale, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            }),
            // Show error icon
            Animated.timing(iconOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }),
            // Error shake
            Animated.sequence([
                Animated.timing(plateRotate, {
                    toValue: -0.1,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(plateRotate, {
                    toValue: 0.1,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(plateRotate, {
                    toValue: -0.05,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(plateRotate, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true
                })
            ])
        ]).start();
    };
    
    // Warning animation - Hot food / caution
    const startWarningAnimation = () => {
        plateRotate.setValue(0);
        foodScale.setValue(0);
        iconOpacity.setValue(0);
        
        // Warning animation - pulse effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(foodScale, {
                    toValue: 1.1,
                    duration: 300,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(foodScale, {
                    toValue: 0.9,
                    duration: 300,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true
                })
            ])
        ).start();
        
        // Show plate and food with caution icon
        Animated.sequence([
            // Show plate
            Animated.timing(plateRotate, {
                toValue: 0.05,
                duration: 350,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            }),
            // Show food
            Animated.timing(foodScale, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true
            }),
            // Show warning icon
            Animated.timing(iconOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }),
        ]).start();
    };
    
    const getIconAndColor = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'check-circle',
                    iconLibrary: 'MaterialCommunityIcons',
                    foodIcon: 'silverware-fork-knife',
                    gradientColors: ['#34D399', '#10B981'] as readonly [ColorValue, ColorValue],
                    iconColor: 'white'
                };
            case 'error':
                return {
                    icon: 'skull',
                    iconLibrary: 'MaterialCommunityIcons',
                    foodIcon: 'food-off',
                    gradientColors: ['#F87171', '#DC2626'] as readonly [ColorValue, ColorValue],
                    iconColor: 'white'
                };
            case 'warning':
                return {
                    icon: 'alert-circle',
                    iconLibrary: 'MaterialCommunityIcons',
                    foodIcon: 'food-hot-dog',
                    gradientColors: ['#FBBF24', '#D97706'] as readonly [ColorValue, ColorValue],
                    iconColor: 'white'
                };
            case 'loading':
                return {
                    icon: 'bowl',
                    iconLibrary: 'MaterialCommunityIcons',
                    foodIcon: 'food-drumstick',
                    // Changed to match your app's yellow-orange theme
                    gradientColors: ['#FBBF24', '#F97416'] as readonly [ColorValue, ColorValue],
                    iconColor: 'white'
                };
            case 'confirm':
                return {
                    icon: 'alert-circle',
                    iconLibrary: 'MaterialCommunityIcons',
                    foodIcon: 'food-off',
                    gradientColors: ['#F87171', '#DC2626'] as readonly [ColorValue, ColorValue],
                    iconColor: 'white'
                };
            case 'info':
                return {
                    icon: 'share',
                    iconLibrary: 'FontAwesome5',
                    foodIcon: 'food-apple',
                    gradientColors: ['#3B82F6', '#1D4ED8'] as readonly [ColorValue, ColorValue],
                    iconColor: 'white'
                };
            case 'withdraw':
                return {
                    icon: 'help-circle',
                    iconLibrary: 'Ionicons',
                    foodIcon: 'wallet-outline',
                    gradientColors: ['#FBBF24', '#D97706'] as readonly [ColorValue, ColorValue],
                    iconColor: 'white'
                };
            default:
                return {
                    icon: 'share',
                    iconLibrary: 'FontAwesome5',
                    foodIcon: 'food-apple',
                    gradientColors: ['#FBBF24', '#F97416'] as readonly [ColorValue, ColorValue],
                    iconColor: 'white'
                };
        }
    };

    const { icon, iconLibrary, foodIcon, gradientColors, iconColor } = getIconAndColor();
    
    // Create rotation interpolation for plate
    const plateRotation = plateRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });
    
    // Render steam clouds for loading animation
    const renderSteam = () => {
        return steamOpacity.map((opacity, index) => (
            <Animated.View
                key={`steam-${index}`}
                style={[
                    styles.steamCloud,
                    {
                        opacity,
                        transform: [
                            { translateY: steamOffset[index] },
                            { translateX: (index - 1) * 8 } // Spread steam clouds horizontally
                        ]
                    }
                ]}
            >
                <MaterialCommunityIcons name="smoke" size={16} color="rgba(255,255,255,0.8)" />
            </Animated.View>
        ));
    };
    
    // Render the icon based on dialog type
    const renderIcon = () => {
        if (type === 'loading') {
            return (
                <View style={styles.iconContainer}>
                    {/* Steam rising from food */}
                    <View style={styles.steamContainer}>
                        {renderSteam()}
                    </View>
                    
                    {/* Food icon with pulse animation */}
                    <Animated.View 
                        style={[
                            styles.foodCircle,
                            {
                                transform: [{ scale: pulseAnim }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={gradientColors}
                            style={styles.iconBackground}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons 
                                name={foodIcon as any} 
                                size={30} 
                                color={iconColor} 
                            />
                        </LinearGradient>
                    </Animated.View>
                </View>
            );
        }
        
        if (type === 'success') {
            return (
                <View style={styles.iconContainer}>
                    {/* Clean plate with gradient ring */}
                    <View style={styles.plateContainer}>
                        <LinearGradient
                            colors={['rgba(52, 211, 153, 0.3)', 'rgba(16, 185, 129, 0.1)']}
                            style={styles.plateGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </View>
                    
                    {/* Food icon that scales in */}
                    <Animated.View 
                        style={[
                            styles.foodCircle,
                            {
                                transform: [
                                    { scale: foodScale },
                                    { rotate: plateRotation }
                                ]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={gradientColors}
                            style={styles.iconBackground}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons 
                                name={foodIcon as any} 
                                size={26} 
                                color={iconColor} 
                            />
                        </LinearGradient>
                    </Animated.View>
                    
                    {/* Success checkmark that fades in */}
                    <Animated.View 
                        style={[
                            styles.checkmarkOverlay,
                            { opacity: iconOpacity }
                        ]}
                    >
                        {iconLibrary === 'FontAwesome5' ? (
                            <FontAwesome5 name={icon as any} size={22} color="#FFFFFF" />
                        ) : (
                            <MaterialCommunityIcons name={icon as any} size={22} color="#FFFFFF" />
                        )}
                    </Animated.View>
                </View>
            );
        }
        
        if (type === 'error') {
            return (
                <View style={styles.iconContainer}>
                    {/* Plate with error gradient */}
                    <View style={styles.plateContainer}>
                        <LinearGradient
                            colors={['rgba(248, 113, 113, 0.3)', 'rgba(220, 38, 38, 0.1)']}
                            style={styles.plateGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </View>
                    
                    {/* Tilted food */}
                    <Animated.View 
                        style={[
                            styles.foodCircle,
                            {
                                transform: [
                                    { scale: foodScale },
                                    { rotate: plateRotation }
                                ]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={gradientColors}
                            style={styles.iconBackground}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name={foodIcon as any} size={26} color={iconColor} />
                        </LinearGradient>
                    </Animated.View>
                    
                    {/* Error icon overlay */}
                    <Animated.View 
                        style={[
                            styles.checkmarkOverlay,
                            { opacity: iconOpacity }
                        ]}
                    >
                        {iconLibrary === 'FontAwesome5' ? (
                            <FontAwesome5 name={icon as any} size={22} color="#FFFFFF" />
                        ) : (
                            <MaterialCommunityIcons name={icon as any} size={22} color="#FFFFFF" />
                        )}
                    </Animated.View>
                </View>
            );
        }
        
        if (type === 'warning') {
            return (
                <View style={styles.iconContainer}>
                    {/* Plate with warning gradient */}
                    <View style={styles.plateContainer}>
                        <LinearGradient
                            colors={['rgba(251, 191, 36, 0.3)', 'rgba(217, 119, 6, 0.1)']}
                            style={styles.plateGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </View>
                    
                    {/* Hot food with caution */}
                    <Animated.View 
                        style={[
                            styles.foodCircle,
                            {
                                transform: [
                                    { scale: foodScale }
                                ]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={gradientColors}
                            style={styles.iconBackground}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name={foodIcon as any} size={26} color={iconColor} />
                        </LinearGradient>
                    </Animated.View>
                    
                    {/* Warning icon overlay */}
                    <Animated.View 
                        style={[
                            styles.checkmarkOverlay,
                            { opacity: iconOpacity }
                        ]}
                    >
                        <Ionicons name={icon as any} size={18} color="#FFFFFF" />
                    </Animated.View>
                </View>
            );
        }
        
        if (type === 'withdraw') {
            return (
                <View style={styles.iconContainer}>
                    {/* Plate with warning gradient */}
                    <View style={styles.plateContainer}>
                        <LinearGradient
                            colors={['rgba(251, 191, 36, 0.3)', 'rgba(217, 119, 6, 0.1)']}
                            style={styles.plateGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </View>
                    
                    {/* Wallet with caution */}
                    <Animated.View 
                        style={[
                            styles.foodCircle,
                            {
                                transform: [
                                    { scale: foodScale }
                                ]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={gradientColors}
                            style={styles.iconBackground}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name={foodIcon as any} size={26} color={iconColor} />
                        </LinearGradient>
                    </Animated.View>
                    
                    {/* Question mark overlay */}
                    <Animated.View 
                        style={[
                            styles.checkmarkOverlay,
                            { opacity: iconOpacity }
                        ]}
                    >
                        <Ionicons name={icon as any} size={18} color="#FFFFFF" />
                    </Animated.View>
                </View>
            );
        }
        
        if (type === 'confirm') {
            return (
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={['#DC2626', '#EF4444']}
                        style={styles.iconBackground}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <MaterialCommunityIcons name="alert-circle" size={32} color="#FFFFFF" />
                    </LinearGradient>
                </View>
            );
        }
        
        if (type === 'info') {
            return (
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={['#0EA5E9', '#0284C7']}
                        style={styles.iconBackground}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <MaterialCommunityIcons name="information" size={32} color="#FFFFFF" />
                    </LinearGradient>
                </View>
            );
        }
        
        return (
            <View style={styles.iconContainer}>
                <LinearGradient
                    colors={gradientColors}
                    style={styles.iconBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <MaterialCommunityIcons name={foodIcon as any} size={32} color={iconColor} />
                </LinearGradient>
            </View>
        );
    };

    return (
        <Modal
            transparent={true}
            animationType="none"
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.backdrop}>
                <Animated.View 
                    style={[
                        styles.animatedContainer,
                        { 
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['#1F2937', '#111827']}
                        style={styles.dialogContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {showCloseButton && (onClose || onCloseButton) && (
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onCloseButton || onClose}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}

                        {renderIcon()}

                        <Text style={styles.title}>
                            {title}
                        </Text>

                        {message && (
                            typeof message === 'string' || typeof message === 'number' ? (
                                <Text style={styles.message}>
                                    {message}
                                </Text>
                            ) : (
                                <View style={{ marginTop: 12 }}>
                                    {message}
                                </View>
                            )
                        )}

                        <View style={styles.buttonContainer}>
                            {(type !== 'loading' && showCancelButton) && (
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        if (onCancel) {
                                            onCancel();
                                        } else if (onClose) {
                                            onClose();
                                        }
                                    }}
                                >
                                    <Text style={styles.cancelText}>
                                        {cancelText}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            
                            {type !== 'loading' && (
                                <TouchableOpacity
                                    style={[
                                        styles.confirmButton, 
                                        !showCancelButton && styles.fullWidthButton
                                    ]}
                                    onPress={() => {
                                        if (onConfirm) {
                                            onConfirm();
                                        } else if (onClose) {
                                            onClose();
                                        }
                                    }}
                                >
                                    <LinearGradient
                                        colors={gradientColors}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                    <Text style={styles.confirmText}>
                                        {confirmText}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    animatedContainer: {
        width: width * 0.85,
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
        position: 'relative',
    },
    steamContainer: {
        position: 'absolute',
        top: -10,
        alignItems: 'center',
        width: '100%',
        height: 40,
        zIndex: 10,
    },
    steamCloud: {
        position: 'absolute',
        top: 0,
    },
    plateContainer: {
        width: 80,
        height: 80,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden'
    },
    plateGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    foodCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
    },
    checkmarkOverlay: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
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
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 4,
    },
    confirmButton: {
        height: 50,
        flex: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    cancelButton: {
        height: 50,
        flex: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    fullWidthButton: {
        width: '100%',
    },
    confirmText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 8,
        textAlign: 'center',
    },
    cancelText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 8,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
});

export default Dialog;