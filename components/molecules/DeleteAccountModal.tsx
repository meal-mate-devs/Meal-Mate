import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface DeleteAccountModalProps {
    visible: boolean;
    onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ visible, onClose }) => {
    const { deleteAccount, profile } = useAuthContext();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [canDelete, setCanDelete] = useState(false);

    useEffect(() => {
        if (visible) {
            setCountdown(5);
            setCanDelete(false);
            setIsDeleting(false);
        }
    }, [visible]);

    useEffect(() => {
        if (visible && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setCanDelete(true);
        }
    }, [visible, countdown]);

    const handleDeleteAccount = async () => {
        if (!canDelete || isDeleting) return;

        setIsDeleting(true);
        try {
            await deleteAccount();
            // Navigate to login screen after successful deletion
            router.replace('/(auth)/login');
        } catch (error) {
            console.log('Failed to delete account:', error);
            alert('Failed to delete account. Please try again.');
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/80 justify-center items-center px-6">
                <View className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-zinc-700">
                    {/* Header */}
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-red-900/30 rounded-full items-center justify-center mb-4">
                            <Ionicons name="warning" size={32} color="#EF4444" />
                        </View>
                        <Text className="text-white text-xl font-bold text-center">
                            Delete Account
                        </Text>
                        <Text className="text-red-400 text-sm text-center mt-2">
                            This action cannot be undone
                        </Text>

                        {/* User Info */}
                        {profile && (
                            <View className="mt-4 mb-2 bg-zinc-800/50 rounded-xl py-3 px-6 border border-zinc-700/50">
                                <Text className="text-amber-400 font-bold text-center text-lg">
                                    {profile.firstName} {profile.lastName}
                                </Text>
                                <Text className="text-gray-400 text-sm text-center mt-1">
                                    @{profile.userName}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Warning Message */}
                    <View className="mb-6">
                        <Text className="text-gray-300 text-base text-center leading-6">
                            Are you sure you want to permanently delete your account?
                        </Text>
                        <Text className="text-gray-400 text-sm text-center mt-3 leading-5">
                            This will permanently delete:
                        </Text>
                        <View className="mt-3 space-y-2">
                            <Text className="text-gray-400 text-sm">• Your profile and personal data</Text>
                            <Text className="text-gray-400 text-sm">• All saved recipes and favorites</Text>
                            <Text className="text-gray-400 text-sm">• Your cooking history and statistics</Text>
                            <Text className="text-gray-400 text-sm">• All uploaded images</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="space-y-5">
                        {/* Delete Button */}
                        <TouchableOpacity
                            onPress={handleDeleteAccount}
                            disabled={!canDelete || isDeleting}
                            className={`rounded-xl overflow-hidden ${(!canDelete || isDeleting) ? 'opacity-50' : ''}`}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="py-4 px-6"
                            >
                                <View className="flex-row items-center justify-center">
                                    {isDeleting ? (
                                        <>
                                            <Ionicons name="hourglass" size={18} color="white" />
                                            <Text className="text-white font-semibold ml-2">
                                                Deleting Account...
                                            </Text>
                                        </>
                                    ) : !canDelete ? (
                                        <>
                                            <Ionicons name="time" size={18} color="white" />
                                            <Text className="text-white font-semibold ml-2">
                                                Wait {countdown} seconds
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="trash" size={18} color="white" />
                                            <Text className="text-white font-semibold ml-2">
                                                Delete My Account
                                            </Text>
                                        </>
                                    )}
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={isDeleting}
                            className={`bg-zinc-700 py-4 px-6 rounded-xl mt-2 ${isDeleting ? 'opacity-50' : ''}`}
                        >
                            <Text className="text-white font-semibold text-center">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Warning */}
                    <Text className="text-gray-500 text-xs text-center mt-4">
                        We cannot recover your account once it's deleted
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

export default DeleteAccountModal;