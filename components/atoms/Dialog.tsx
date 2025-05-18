import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';

type DialogType = 'success' | 'error' | 'warning' | 'loading';

interface DialogProps {
    visible: boolean;
    type: DialogType;
    title: string;
    message?: string;
    onClose?: () => void;
    onConfirm?: () => void;
    confirmText?: string;
}

const Dialog = ({
    visible,
    type,
    title,
    message,
    onClose,
    onConfirm,
    confirmText = 'OK'
}: DialogProps) => {
    const getIconAndColor = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'checkmark-outline',
                    bgColor: 'bg-orange-400',
                    iconColor: 'text-white'
                };
            case 'error':
                return {
                    icon: 'close-outline',
                    bgColor: 'bg-red-500',
                    iconColor: 'text-white'
                };
            case 'warning':
                return {
                    icon: 'alert-outline',
                    bgColor: 'bg-yellow-400',
                    iconColor: 'text-white'
                };
            case 'loading':
                return {
                    icon: '',
                    bgColor: 'bg-white',
                    iconColor: 'text-black'
                };
            default:
                return {
                    icon: 'information-outline',
                    bgColor: 'bg-to-blue-500',
                    iconColor: 'text-white'
                };
        }
    };

    const { icon, bgColor } = getIconAndColor();

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white rounded-3xl p-6 w-10/12 max-w-sm items-center">
                    {type === 'loading' ? (
                        <ActivityIndicator size="large" color="#FFC107" className="my-4" />
                    ) : (
                        <View className="w-20 h-20 rounded-full items-center justify-center mb-4 overflow-hidden">
                            <View className={`w-full h-full items-center justify-center ${bgColor}`}>
                                <Ionicons name={icon as any} size={40} color="white" />
                            </View>
                        </View>
                    )}

                    <Text className="text-xl font-bold text-center mb-2">
                        {title}
                    </Text>

                    {message && (
                        <Text className="text-gray-600 text-center mb-4">
                            {message}
                        </Text>
                    )}

                    {type !== 'loading' && (
                        <TouchableOpacity
                            onPress={onConfirm || onClose}
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 w-full py-3 rounded-full mt-2"
                        >
                            <Text className="text-white text-center font-bold">
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default Dialog;