import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function WelcomeScreen() {
    const router = useRouter();
    const { user } = useAuthContext();

    const handleLogin = () => {
        router.push('/(auth)/login');
    };

    const handleSignUp = () => {
        router.push('/(auth)/register');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            <View className="flex-1 p-6">
                <View className="flex-row justify-end">
                    {user ? (
                        <TouchableOpacity
                            className="bg-green-100 rounded-full px-4 py-2"
                            onPress={() => router.push('/home')}
                        >
                            <Text className="text-green-600 font-semibold">Dashboard</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            className="bg-green-100 rounded-full px-4 py-2"
                            onPress={handleLogin}
                        >
                            <Text className="text-green-600 font-semibold">Sign in</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View className="items-center justify-center flex-1 -mt-10">
                    <Image
                        source={require('@/assets/images/plants.png')}
                        className="w-72 h-72"
                        resizeMode="contain"
                    />

                    <Text className="text-3xl font-bold text-gray-800 mt-6">Welcome</Text>
                    <Text className="text-gray-600 text-center text-base mt-2 mb-8">
                        please login or sign up to continue using our app
                    </Text>

                    <TouchableOpacity
                        className="bg-green-500 rounded-full w-full h-14 flex-row justify-center items-center shadow-md mb-4"
                        onPress={handleSignUp}
                    >
                        <Text className="text-white text-base font-semibold">Sign up</Text>
                    </TouchableOpacity>

                    <View className="w-full">
                        <TouchableOpacity
                            className="bg-white border border-green-500 rounded-full h-14 flex-row justify-center items-center mb-6"
                            onPress={() => { }}
                        >
                            <Ionicons name="logo-facebook" size={20} color="#4267B2" />
                            <Text className="text-gray-700 text-base font-semibold ml-2">Continue with Facebook</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row h-14 justify-center items-center"
                        >
                            <TextInput className="border-b border-gray-300 flex-1 text-base pb-1"
                                placeholder="Email or phone"
                                placeholderTextColor="#90A4AE"
                            />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-center mt-8">
                        <View className="flex-row space-x-2">
                            <TouchableOpacity className="bg-white rounded-full w-10 h-10 justify-center items-center shadow-sm">
                                <Image
                                    source={require('@/assets/images/google.png')}
                                    className="w-6 h-6"
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity className="bg-white rounded-full w-10 h-10 justify-center items-center shadow-sm">
                                <Image
                                    source={require('@/assets/images/twitter.png')}
                                    className="w-6 h-6"
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mt-8">
                        <Text className="text-gray-500 text-xs text-center">
                            Already have an account? <Text className="text-green-600 font-semibold" onPress={handleLogin}>Login here</Text>
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};