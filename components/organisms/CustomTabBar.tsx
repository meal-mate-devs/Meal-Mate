import { Feather, Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const visibleRoutes = state.routes.filter(route => !route.name.startsWith('(hidden)'));
    const tabWidth = SCREEN_WIDTH / visibleRoutes.length;
    const focusedRouteName = state.routes[state.index]?.name;
    const focusedIndex = visibleRoutes.findIndex(r => r.name === focusedRouteName);

    const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
    const iconScales = useRef(
        visibleRoutes.map((_, i) => new Animated.Value(i === focusedIndex ? 1.2 : 1))
    ).current;

    useEffect(() => {
        if (focusedIndex < 0) return;

        Animated.spring(tabIndicatorPosition, {
            toValue: focusedIndex * tabWidth,
            useNativeDriver: true,
            friction: 8,
            tension: 70,
        }).start();

        visibleRoutes.forEach((_, i) => {
            Animated.spring(iconScales[i], {
                toValue: i === focusedIndex ? 1.2 : 1,
                useNativeDriver: true,
                friction: 8,
            }).start();
        });
    }, [focusedIndex]);

    return (
        <View
            style={{
                paddingBottom: insets.bottom,
                backgroundColor: '#101010',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 10,
            }}
        >
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 8,
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    transform: [
                        { translateX: Animated.add(tabIndicatorPosition, tabWidth * 0.5 - 2.5) },
                    ],
                    zIndex: 1,
                    overflow: 'hidden',
                }}
            >
                <LinearGradient
                    colors={['#FACC15', '#F97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: '100%', height: '100%' }}
                />
            </Animated.View>

            <View style={{ flexDirection: 'row', height: 68 }}>
                {visibleRoutes.map((route, index) => {
                    const isFocused = focusedIndex === index;

                    const getTabIcon = (name: string, focused: boolean) => {
                        const cleanedName = name.split('/')[0];

                        if (cleanedName === 'home') {
                            return focused ?
                                <Ionicons name="home" size={24} color="#FFFFFF" /> :
                                <Ionicons name="home-outline" size={24} color="#9CA3AF" />;
                        }
                        else if (cleanedName === 'create') {
                            return (
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: -15,
                                    overflow: 'hidden'
                                }}>
                                    <LinearGradient
                                        colors={['#FACC15', '#F97316']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                                    >
                                        <Feather name="plus" size={24} color="white" />
                                    </LinearGradient>
                                </View>
                            );
                        }
                        else if (cleanedName === 'statistics') {
                            return focused ?
                                <Ionicons name="stats-chart" size={24} color="#FFFFFF" /> :
                                <Ionicons name="stats-chart-outline" size={24} color="#9CA3AF" />;
                        }
                        else if (cleanedName === 'community') {
                            return focused ?
                                <Ionicons name="people" size={24} color="#FFFFFF" /> :
                                <Ionicons name="people-outline" size={24} color="#9CA3AF" />;
                        }
                        else if (cleanedName === 'chef') {
                            return focused ?
                                <Ionicons name="restaurant" size={24} color="#FFFFFF" /> :
                                <Ionicons name="restaurant-outline" size={24} color="#9CA3AF" />;
                        }
                        else {
                            return focused ?
                                <Ionicons name="help-circle" size={24} color="#FFFFFF" /> :
                                <Ionicons name="help-circle-outline" size={24} color="#9CA3AF" />;
                        }
                    };

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <Pressable
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            onPress={onPress}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Animated.View
                                style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transform: [{ scale: iconScales[index] }],
                                }}
                            >
                                {getTabIcon(route.name, isFocused)}
                            </Animated.View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
