import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Adjusted height to account for navigation bar
const DRAWER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.8, SCREEN_HEIGHT - 80);

interface BottomProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    userData?: { // Make it optional
        name?: string;
        email?: string;
        profileImage?: string;
    };
}

const BottomProfileDrawer: React.FC<BottomProfileDrawerProps> = ({ 
    isOpen, 
    onClose, 
    userData = { // Provide default values
        name: 'Guest User',
        email: 'guest@example.com',
        profileImage: '',
    } 
}) => {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollOffset = useRef(0);

    // Form state
    const [fullName, setFullName] = useState(userData?.name || '');
    const [email, setEmail] = useState(userData?.email || '');
    const [gender, setGender] = useState('');
    const [language, setLanguage] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');

    // Reset form when drawer opens
    useEffect(() => {
        if (isOpen) {
            setFullName(userData?.name || '');
            setEmail(userData?.email || '');
        }
    }, [isOpen, userData]);

    // Add pan responder for swipe-down gesture
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only activate for downward swipes when scrolled to the top
                return scrollOffset.current <= 0 && gestureState.dy > 5;
            },
            onPanResponderGrant: () => {
                // @ts-ignore: using internal Animated API to read current value
                (translateY as any).setOffset((translateY as any).__getValue());
                translateY.setValue(0);
            },
            onPanResponderMove: (_, gestureState) => {
                // Only allow downward movement
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                translateY.flattenOffset();
                
                // Close if swiped down far enough or with enough velocity
                if (gestureState.dy > 150 || gestureState.vy > 0.5) {
                    onClose();
                } else {
                    // Otherwise snap back to open position
                    Animated.spring(translateY, {
                        toValue: 0,
                        friction: 8,
                        tension: 80,
                        useNativeDriver: true,
                    }).start();
                }
            }
        })
    ).current;

    // Handle scroll events
    const handleScroll = (event: any) => {
        scrollOffset.current = event.nativeEvent.contentOffset.y;
    };

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 8,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: DRAWER_HEIGHT,
                    friction: 8,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    const handleSave = () => {
        // Save profile logic would go here
        onClose();
    };

    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
        } else {
            const timer = setTimeout(() => {
                setIsRendered(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered && !isOpen) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="absolute inset-0 z-50"
            style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'black', opacity }
                ]}
            >
                <TouchableOpacity
                    className="absolute inset-0"
                    activeOpacity={1}
                    onPress={onClose}
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.drawer,
                    {
                        maxHeight: DRAWER_HEIGHT,
                        transform: [{ translateY }],
                        paddingBottom: insets.bottom,
                    }
                ]}
            >
                {/* Drag handle indicator */}
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
                    {/* Header with cover image */}
                    <View style={styles.coverImageContainer}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }}
                            style={styles.coverImage}
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,1)']} // To true black
                            style={styles.coverGradient}
                            locations={[0, 0.85]} // Smooth transition point
                        />
                        
                        {/* Close button */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <View style={styles.closeButtonCircle}>
                                <Feather name="x" size={18} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        
                        {/* Title */}
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>Edit Profile</Text>
                        </View>
                        
                        {/* Profile image positioned correctly on the cover */}
                        <View style={styles.profileImageContainer}>
                            <View style={styles.profileImageWrapper}>
                                <View style={styles.profileImage}>
                                    {userData.profileImage ? (
                                        <Image
                                            source={{ uri: userData.profileImage }}
                                            style={styles.avatarImage}
                                        />
                                    ) : (
                                        <LinearGradient
                                            colors={['#FACC15', '#F97316']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.avatarGradient}
                                        >
                                            <Text style={styles.avatarInitial}>
                                                {userData?.name?.charAt(0) || 'G'}
                                            </Text>
                                        </LinearGradient>
                                    )}
                                </View>
                                <TouchableOpacity style={styles.editButton}>
                                    <Feather name="edit-2" size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Form fields */}
                    <View style={styles.formContainer}>
                        {/* Full Name */}
                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>Full Name</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="user" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Full Name"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="mail" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Email"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Gender */}
                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>Gender</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="users" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={gender}
                                    onChangeText={setGender}
                                    placeholder="Gender"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        {/* Language */}
                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>Language</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="globe" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={language}
                                    onChangeText={setLanguage}
                                    placeholder="Language"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        {/* Date of Birth */}
                        <View style={[styles.formField, styles.lastField]}>
                            <Text style={styles.fieldLabel}>Date of Birth</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="calendar" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={dateOfBirth}
                                    onChangeText={setDateOfBirth}
                                    placeholder="Date of Birth"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>
                        
                        {/* Save Button - Moved inside scrollview for better UX */}
                        <TouchableOpacity
                            style={styles.saveButtonContainer}
                            onPress={handleSave}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FACC15', '#F97316']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.saveButton}
                            >
                                <Feather name="check" size={18} color="white" style={styles.saveButtonIcon} />
                                <Text style={styles.saveButtonText}>
                                    Save
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    drawer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000000', // TRUE black
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    handleContainer: {
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    scrollContent: {
        flexGrow: 1,
    },
    coverImageContainer: {
        height: 170, // Increased height to accommodate profile image
        width: '100%',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    coverGradient: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    closeButtonCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    titleContainer: {
        position: 'absolute',
        bottom: 70,
        left: 20,
        right: 20,
    },
    titleText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    profileImageContainer: {
        position: 'absolute',
        bottom: -50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    profileImageWrapper: {
        position: 'relative',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#000000', // True black to match background
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3F3F46', // zinc-700
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#000000', // True black to match background
        elevation: 3,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 60, // Added space for the profile image
        paddingBottom: 24,
    },
    formField: {
        marginBottom: 18, // Slightly reduced for a cleaner look
    },
    lastField: {
        marginBottom: 24,
    },
    fieldLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        marginLeft: 2,
    },
    inputContainer: {
        backgroundColor: '#27272A', // Keep form inputs slightly gray
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#3F3F46', // zinc-700
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputIcon: {
        marginLeft: 16,
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        paddingVertical: 14,
        paddingRight: 16,
        color: 'white',
        fontSize: 15,
    },
    saveButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: "#FACC15",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        width: '40%', // Make button more compact
        alignSelf: 'center', // Center the button
        marginTop: 8,
        marginBottom: 16,
    },
    saveButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    saveButtonIcon: {
        marginRight: 8,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    }
});

export default BottomProfileDrawer;