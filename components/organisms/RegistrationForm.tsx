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

export default function RegistrationForm() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const { register } = useAuthContext();

    const handleSignup = async () => {
        if (email == '' || password == '') {
            Alert.alert("Fill all the required fields")
            return
        }
        if (!isValidEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            setIsLoading(true);
            await register(email, password);
            router.push('/verify-email')
        } catch (error) {
            Alert.alert("Error occurred!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignIn = () => {
        router.push('/login');
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
    };

    const toggleAcceptTerms = () => {
        setAcceptTerms(!acceptTerms);
    };

    return (
        <View className="flex-1 bg-green-500">
            <View className="flex-1 bg-green-500 p-6 pt-0 pb-12 items-center justify-center">
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
                    <Text className="text-lg font-semibold text-gray-700 mb-4 text-center">Create Your Account</Text>

                    <View>
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

                        <View className="bg-green-100 rounded-full h-14 flex-row items-center px-4 mb-4">
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

                        <View className="bg-green-100 rounded-full h-14 flex-row items-center px-4 mb-4">
                            <TextInput
                                className="flex-1 text-base text-gray-800"
                                placeholder="Confirm Password"
                                placeholderTextColor="#90A4AE"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!isConfirmPasswordVisible}
                            />
                            <TouchableOpacity onPress={toggleConfirmPasswordVisibility} className="p-2">
                                <Ionicons
                                    name={isConfirmPasswordVisible ? "eye-off" : "eye"}
                                    size={20}
                                    color="#66BB6A"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            className="flex-row items-center mt-1 mb-6"
                            onPress={toggleAcceptTerms}
                        >
                            <View className={`w-5 h-5 rounded-sm mr-2 border ${acceptTerms ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                {acceptTerms && <Ionicons name="checkmark" size={16} color="white" />}
                            </View>
                            <Text className="text-gray-600 text-sm">I accept the terms and conditions</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-green-500 rounded-full h-12 justify-center items-center shadow-md mb-6"
                            onPress={handleSignup}
                        >
                            <Text className="text-white text-base font-semibold">Sign up</Text>
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
                            <Text className="text-gray-500 text-sm">Already have an account? </Text>
                            <TouchableOpacity onPress={handleSignIn}>
                                <Text className="text-green-600 text-sm font-semibold">Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

