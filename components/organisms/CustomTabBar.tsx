import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const tabWidth = SCREEN_WIDTH / state.routes.length;

    const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
    const iconScales = useRef(
        state.routes.map((_, i) => new Animated.Value(i === 0 ? 1.2 : 1))
    ).current;

    useEffect(() => {
        Animated.spring(tabIndicatorPosition, {
            toValue: state.index * tabWidth,
            useNativeDriver: true,
            friction: 8,
            tension: 70,
        }).start();

        state.routes.forEach((_, i) => {
            Animated.spring(iconScales[i], {
                toValue: i === state.index ? 1.2 : 1,
                useNativeDriver: true,
                friction: 8,
            }).start();
        });
    }, [state.index]);

    return (
        <View
            style={{
                paddingBottom: insets.bottom,
                backgroundColor: 'white',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 10,
            }}
        >
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    width: tabWidth * 0.5,
                    height: 4,
                    backgroundColor: '#2ECC71',
                    borderRadius: 2,
                    transform: [{ translateX: Animated.add(tabIndicatorPosition, tabWidth * 0.25) }],
                    zIndex: 1,
                }}
            />

            <View style={{ flexDirection: 'row', height: 70 }}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;

                    const getTabIcon = (name: string): keyof typeof Ionicons.glyphMap => {
                        const cleanedName = name.split('/')[0];
                        switch (cleanedName) {
                            case 'home':
                                return 'home';
                            case 'profile':
                                return 'person';
                            case 'statistics':
                                return 'bar-chart';
                            case 'settings':
                                return 'settings';
                            default:
                                return 'help-circle-outline';
                        }
                    };

                    const getTabLabel = (name: string): string => {
                        const cleanedName = name.split('/')[0];
                        switch (cleanedName) {
                            case 'home':
                                return 'Home';
                            case 'profile':
                                return 'Profile';
                            case 'settings':
                                return 'Settings';
                            case 'statistics':
                                return 'Statistics';
                            default:
                                return cleanedName;
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
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Animated.View
                                style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transform: [{ scale: iconScales[index] }],
                                }}
                            >
                                <Ionicons
                                    name={getTabIcon(route.name)}
                                    size={22}
                                    color={isFocused ? '#2ECC71' : '#95A5A6'}
                                />
                                <Text
                                    style={{
                                        color: isFocused ? '#2ECC71' : '#95A5A6',
                                        fontSize: 12,
                                        marginTop: 4,
                                        fontWeight: isFocused ? '600' : '400',
                                    }}
                                >
                                    {getTabLabel(route.name)}
                                </Text>
                            </Animated.View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}