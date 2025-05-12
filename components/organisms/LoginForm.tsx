import { useAuthContext } from '@/context/authContext';
import { isValidEmail } from '@/lib/utils';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
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
        } catch (error: any) {
            console.log(error)
            Alert.alert("Error occured !");

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
        <React.Fragment>
            <View className="items-center mb-10">
                <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-4">
                    <Text className="text-white text-2xl font-bold">MM</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-800">MealMate</Text>
            </View>

            <Text className="text-3xl font-bold text-gray-800 mb-2">Welcome back</Text>
            <Text className="text-base text-gray-500 mb-8">Sign in to continue</Text>

            <View className="mb-6">
                <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-800 mb-2">Email</Text>
                    <View className="flex-row border border-gray-200 rounded-xl bg-gray-50 h-14 items-center px-4">
                        <TextInput
                            className="flex-1 text-base text-gray-800"
                            placeholder="email@example.com"
                            placeholderTextColor="#A0A0A0"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-800 mb-2">Password</Text>
                    <View className="flex-row border border-gray-200 rounded-xl bg-gray-50 h-14 items-center px-4">
                        <TextInput
                            className="flex-1 text-base text-gray-800"
                            placeholder="Enter your password"
                            placeholderTextColor="#A0A0A0"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                        />
                        <TouchableOpacity onPress={togglePasswordVisibility} className="p-2">
                            <Text>{isPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity onPress={handleForgetPassword} className="items-end mb-6">
                    <Text className="text-blue-600 text-sm font-semibold">Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-blue-600 rounded-xl h-14 justify-center items-center shadow-md"
                    onPress={handleLogin}
                >
                    <Text className="text-white text-base font-semibold">{isLoading ? "Signing..." : "Sign in"}</Text>
                </TouchableOpacity>

                <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-gray-200" />
                    <Text className="text-gray-500 px-4 text-sm">OR</Text>
                    <View className="flex-1 h-px bg-gray-200" />
                </View>

                <View className="flex-row justify-center space-x-5 mb-6">
                    <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 justify-center items-center">
                        <Text className="text-lg font-medium text-gray-800">G</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 justify-center items-center">
                        <Text className="text-lg font-medium text-gray-800">f</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 justify-center items-center">
                        <Text className="text-lg font-medium text-gray-800">in</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="flex-row justify-center">
                <Text className="text-gray-500 text-sm">Don't have an account? </Text>
                <TouchableOpacity onPress={handleSignUp}>
                    <Text className="text-blue-600 text-sm font-semibold">Sign Up</Text>
                </TouchableOpacity>
            </View>
        </React.Fragment>
    );
};