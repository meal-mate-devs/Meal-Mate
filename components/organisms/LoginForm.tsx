import { useAuthContext } from '@/context/authContext';
import { isValidEmail } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuthContext();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter all required fields');
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        try {
            setIsLoading(true);
            await login(email, password);
            router.push('/home')
        } catch (error) {
            console.log(error)
            Alert.alert("Error occurred!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        router.push('/register');
    };

    const handleForgetPassword = () => {
        router.push('/forgot-password');
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <View className="flex-1 bg-green-500">
            <View className="flex-1 bg-green-500 rounded-b-3xl p-6 pt-12 pb-12 items-center justify-center">
                <View className="items-center">
                    <Image
                        source={require('@/assets/images/plants.png')}
                        className="w-64 h-64"
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View className="flex-1 px-6 pt-6 -mt-6">
                <View className="bg-white rounded-3xl shadow-md p-6 -mt-12">
                    <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</Text>

                    <View className="mb-4">
                        <View className="bg-green-100 rounded-full h-14 flex-row items-center px-4 mb-4">
                            <TextInput
                                className="flex-1 text-base text-gray-800"
                                placeholder="Email"
                                placeholderTextColor="#90A4AE"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View className="bg-green-100 rounded-full h-14 flex-row items-center px-4 mb-2">
                            <TextInput
                                className="flex-1 text-base text-gray-800"
                                placeholder="Password"
                                placeholderTextColor="#90A4AE"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!isPasswordVisible}
                            />
                            <TouchableOpacity onPress={togglePasswordVisibility} className="p-2">
                                <Ionicons
                                    name={isPasswordVisible ? "eye-off" : "eye"}
                                    size={20}
                                    color="#66BB6A"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={handleForgetPassword} className="items-end mb-6">
                            <Text className="text-gray-500 text-sm">Forgot password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-green-500 rounded-full h-12 justify-center items-center shadow-md"
                            onPress={handleLogin}
                        >
                            <Text className="text-white text-base font-semibold">
                                {isLoading ? "Signing in..." : "Login"}
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center items-center my-4">
                            <View className="flex-1 h-px bg-gray-200" />
                            <Text className="text-gray-500 px-4 text-sm">OR</Text>
                            <View className="flex-1 h-px bg-gray-200" />
                        </View>

                        <View className="flex-row justify-center space-x-5 mb-6">
                            <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 justify-center items-center">
                                <Text className="text-lg font-medium text-gray-800">G</Text>
                            </TouchableOpacity>


                            <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 justify-center items-center">
                                <Text className="text-lg font-medium text-gray-800">F</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 justify-center items-center">
                                <Text className="text-lg font-medium text-gray-800">T</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-center">
                            <Text className="text-gray-500 text-sm">Don't have an account? </Text>
                            <TouchableOpacity onPress={handleSignUp}>
                                <Text className="text-green-600 text-sm font-semibold">Sign up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};