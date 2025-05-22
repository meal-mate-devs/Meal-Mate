// components/molecules/ProfileSidebar.tsx
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../../context/authContext'; // Correct relative path

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Menu items definition
const menuItems = [
    { icon: 'home', label: 'Home', route: '/' },
    { icon: 'heart', label: 'Favorites', route: '/favorites' },
    { icon: 'clipboard', label: 'Your Orders', route: '/orders' },
    { icon: 'credit-card', label: 'Payment Methods', route: '/payment' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
    { icon: 'help-circle', label: 'Help Center', route: '/help' },
];

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    name: string;
    email: string;
    profileImage: string;
  };
  onEditProfile?: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
    isOpen,
    onClose,
    userData = { // Default values
        name: 'Guest User',
        email: 'guest@example.com',
        profileImage: '',
    },
    onEditProfile
}) => {
    const insets = useSafeAreaInsets();
    const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const router = useRouter();
    
    // Use the correct hook name from your auth context
    const { logout } = useAuthContext();

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.spring(translateX, {
                    toValue: 0,
                    friction: 8,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(translateX, {
                    toValue: -SCREEN_WIDTH,
                    friction: 8,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    const handleNavigation = (route: string) => {
        // First close the sidebar
        onClose();
        
        // Then navigate after a slight delay to ensure sidebar is closed first
        setTimeout(() => {
            router.push(route as any);
        }, 100);
    };

    const handleEditProfile = () => {
        // First close the sidebar
        onClose();
        
        // Then open the profile drawer after sidebar is closed
        if (typeof onEditProfile === 'function') {
            setTimeout(() => {
                onEditProfile();
            }, 300);
        }
    };

    return (
        <View
            style={[
                StyleSheet.absoluteFill,
                { zIndex: 50, pointerEvents: isOpen ? 'auto' : 'none' },
            ]}
        >
            {/* Backdrop */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'black', opacity: backdropOpacity },
                ]}
            >
                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPress={onClose}
                />
            </Animated.View>

            {/* Sidebar */}
            <Animated.View
                style={[
                    styles.sidebar,
                    {
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom,
                        transform: [{ translateX }],
                    },
                ]}
            >
                {/* Profile section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileHeader}>
                        <View style={styles.profileImage}>
                            {userData.profileImage ? (
                                <Image
                                    source={{ uri: userData.profileImage }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <LinearGradient
                                    colors={['#FACC15', '#F97316']} // yellow-400 to orange-500
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.avatarGradient}
                                >
                                    <Text style={styles.avatarText}>
                                        {userData?.name?.charAt(0) || 'G'}
                                    </Text>
                                </LinearGradient>
                            )}
                        </View>
                        <Text style={styles.userName}>{userData?.name || 'Guest User'}</Text>
                        <Text style={styles.userEmail}>{userData?.email || 'guest@example.com'}</Text>
                        <TouchableOpacity
                            style={styles.editProfileButton}
                            onPress={handleEditProfile}
                        >
                            <Text style={styles.editProfileText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Menu items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => handleNavigation(item.route)}
                            activeOpacity={0.7}
                        >
                            <Feather name={item.icon as any} size={20} color="#F5F5F5" />
                            <Text style={styles.menuItemText}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => {
                        onClose();
                        // Execute logout immediately
                        logout()
                            .then(() => {
                                router.replace('/login');
                            })
                            .catch((error: unknown) => {
                                console.error('Logout failed:', error);
                            });
                    }}
                >
                    <Feather name="log-out" size={20} color="#F87171" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                {/* Close button for larger devices */}
                {SCREEN_WIDTH > 768 && (
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Feather name="x" size={24} color="#F5F5F5" />
                    </TouchableOpacity>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: Math.min(300, SCREEN_WIDTH * 0.8),
        backgroundColor: '#000000', // TRUE black
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        display: 'flex',
        flexDirection: 'column',
    },
    profileSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    profileHeader: {
        alignItems: 'center',
    },
    profileImage: {
        height: 80,
        width: 80,
        borderRadius: 40,
        marginBottom: 12,
        overflow: 'hidden',
    },
    avatar: {
        height: '100%',
        width: '100%',
    },
    avatarGradient: {
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    userName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        color: '#9CA3AF', // gray-400
        fontSize: 14,
        marginBottom: 16,
    },
    editProfileButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    editProfileText: {
        color: '#FACC15', // yellow-400
        fontSize: 14,
        fontWeight: '600',
    },
    menuContainer: {
        flex: 1,
        paddingTop: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    menuItemText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    logoutText: {
        color: '#F87171', // red-400
        fontSize: 16,
        marginLeft: 16,
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ProfileSidebar;