"use client"

import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import React, { JSX, useEffect, useRef, useState } from "react";
import { Alert, Dimensions, Modal, Text, TouchableOpacity, View } from "react-native";

interface IngredientScannerProps {
    visible: boolean
    onClose: () => void
    onIngredientsDetected: (ingredients: string[]) => void
}

const { width } = Dimensions.get("window")

export default function IngredientScanner({
    visible,
    onClose,
    onIngredientsDetected,
}: IngredientScannerProps): JSX.Element {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [isScanning, setIsScanning] = useState<boolean>(false)
    const [detectedIngredients, setDetectedIngredients] = useState<string[]>([])
    const [scanProgress, setScanProgress] = useState<number>(0)
    const [showImageOptions, setShowImageOptions] = useState<boolean>(false)
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
    }, [visible, permission]);

    const handlePermissionRequest = async (): Promise<void> => {
        try {
            const result = await requestPermission();

            if (!result.granted) {
                Alert.alert("Camera Permission Required", "Please enable camera access to scan ingredients", [
                    { text: "OK", onPress: onClose },
                ])
            }
        } catch (error) {
            console.error("Error requesting camera permission:", error)
            Alert.alert("Error", "Failed to request camera permission")
        }
    }

    const processImage = async (imageUri: string): Promise<void> => {
        try {
            setIsScanning(true)
            setScanProgress(0)
            setDetectedIngredients([])
            setShowImageOptions(false)

            const fileInfo = await FileSystem.getInfoAsync(imageUri);
            const formData = new FormData();

            formData.append('file', {
                uri: fileInfo.uri,
                name: 'image.jpg',
                type: 'image/jpeg',
            } as any);

            const response = await fetch('http://127.0.0.1:8000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const result = await response.json();
            const predictedClass = result.predicted_class;

            if (predictedClass) {
                setDetectedIngredients([predictedClass]);
            } else {
                Alert.alert('Error', 'Could not detect ingredient.');
            }

        } catch (error) {
            console.error("Error scanning image:", error);
            Alert.alert("Error", "Failed to scan image.");
        } finally {
            setIsScanning(false);
            setScanProgress(100);
        }
    };

    const handleTakePicture = async (): Promise<void> => {
        if (!permission?.granted || !cameraRef.current) {
            await handlePermissionRequest()
            return
        }

        try {
            const photo = await cameraRef.current.takePictureAsync({ base64: false });
            await processImage(photo.uri);
        } catch (error) {
            console.error("Error taking picture:", error);
            Alert.alert("Error", "Failed to take picture.");
        }
    };

    const handleSelectFromGallery = async (): Promise<void> => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant permission to access your photo library.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Error selecting image from gallery:", error);
            Alert.alert("Error", "Failed to select image from gallery.");
        }
    };

    const handleStartScan = (): void => {
        setShowImageOptions(true);
    };

    const handleConfirmIngredients = (): void => {
        onIngredientsDetected(detectedIngredients)
        onClose()
    }

    const handleRemoveIngredient = (ingredient: string): void => {
        setDetectedIngredients((prev) => prev.filter((item) => item !== ingredient))
    }

    const handleAddCustomIngredient = (): void => {
        Alert.prompt("Add Ingredient", "Enter ingredient name:", (text) => {
            if (text && text.trim()) {
                setDetectedIngredients((prev) => [...prev, text.trim()])
            }
        })
    }

    const toggleCameraFacing = (): void => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    if (!visible) return <></>

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View className="flex-1 bg-black">
                <View className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-70 pt-12 pb-4">
                    <View className="flex-row justify-between items-center px-4">
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View className="items-center">
                            <Text className="text-white text-lg font-bold">Ingredient Scanner</Text>
                            <View className="flex-row items-center mt-1">
                                <View className="w-2 h-2 rounded-full bg-yellow-400 mr-1" />
                                <Text className="text-yellow-400 text-xs font-bold">PRO FEATURE</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={toggleCameraFacing}
                            className="p-2"
                        >
                            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {!permission ? (
                    <View className="flex-1 justify-center items-center bg-zinc-900">
                        <Ionicons name="camera-outline" size={64} color="#FBBF24" />
                        <Text className="text-white text-lg font-bold mt-4">Requesting Camera Permission</Text>
                        <Text className="text-zinc-400 text-center mt-2 px-8">We need camera access to scan your ingredients</Text>
                    </View>
                ) : !permission.granted ? (
                    <View className="flex-1 justify-center items-center bg-zinc-900">
                        <Ionicons name="camera" size={64} color="#EF4444" />
                        <Text className="text-white text-lg font-bold mt-4">Camera Access Denied</Text>
                        <Text className="text-zinc-400 text-center mt-2 px-8">
                            Please enable camera permissions in your device settings
                        </Text>
                        <TouchableOpacity className="mt-6 rounded-xl overflow-hidden" onPress={handlePermissionRequest}>
                            <LinearGradient
                                colors={["#FBBF24", "#F97416"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="px-6 py-3"
                            >
                                <Text className="text-white font-bold">Try Again</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
                        <View className="flex-1 justify-center items-center">
                            <View className="relative">
                                <View
                                    className="border-2 border-yellow-400 rounded-2xl bg-transparent"
                                    style={{ width: width * 0.8, height: width * 0.8 }}
                                >
                                    <View className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-yellow-400 rounded-tl-lg" />
                                    <View className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-yellow-400 rounded-tr-lg" />
                                    <View className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-yellow-400 rounded-bl-lg" />
                                    <View className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-yellow-400 rounded-br-lg" />

                                    {isScanning && (
                                        <View className="absolute inset-0 justify-center">
                                            <View className="h-1 bg-yellow-400 opacity-80" style={{ width: `${scanProgress}%` }} />
                                        </View>
                                    )}
                                </View>

                                <View className="absolute -bottom-16 left-0 right-0">
                                    <Text className="text-white text-center font-bold">
                                        {isScanning ? `Scanning... ${Math.round(scanProgress)}%` : "Point camera at your ingredients"}
                                    </Text>
                                    <Text className="text-zinc-400 text-center text-sm mt-1">
                                        {isScanning ? "AI is analyzing your ingredients" : "Take a photo or select from gallery"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </CameraView>
                )}

                <Modal visible={showImageOptions} transparent={true} animationType="fade">
                    <View className="flex-1 bg-black bg-opacity-50 justify-end">
                        <View className="bg-zinc-900 rounded-t-3xl p-6">
                            <View className="w-12 h-1 bg-zinc-600 rounded-full self-center mb-6" />

                            <Text className="text-white text-xl font-bold text-center mb-6">
                                Choose Image Source
                            </Text>

                            <View className="space-y-4">
                                <TouchableOpacity
                                    className="flex-row items-center bg-zinc-800 rounded-xl p-4"
                                    onPress={handleTakePicture}
                                >
                                    <View className="w-12 h-12 bg-yellow-400 rounded-full items-center justify-center mr-4">
                                        <Ionicons name="camera" size={24} color="#000000" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-bold text-lg">Take Photo</Text>
                                        <Text className="text-zinc-400 text-sm">Use camera to capture ingredients</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="flex-row items-center bg-zinc-800 rounded-xl p-4"
                                    onPress={handleSelectFromGallery}
                                >
                                    <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
                                        <Ionicons name="images" size={24} color="#FFFFFF" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-bold text-lg">Choose from Gallery</Text>
                                        <Text className="text-zinc-400 text-sm">Select existing photo from your device</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                className="mt-6 bg-zinc-700 rounded-xl py-3"
                                onPress={() => setShowImageOptions(false)}
                            >
                                <Text className="text-white font-bold text-center">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <View className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 pb-8 pt-4">
                    {detectedIngredients.length > 0 ? (
                        <View className="px-4">
                            <Text className="text-white font-bold text-lg mb-3 text-center">
                                🎉 Found {detectedIngredients.length} Ingredients!
                            </Text>

                            <View className="flex-row flex-wrap justify-center mb-4">
                                {detectedIngredients.map((ingredient, index) => (
                                    <View key={index} className="bg-yellow-400 rounded-full px-3 py-2 m-1 flex-row items-center">
                                        <Text className="text-black font-bold text-sm">{ingredient}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveIngredient(ingredient)} className="ml-2">
                                            <Ionicons name="close" size={16} color="#000000" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <View className="flex-row justify-between">
                                <TouchableOpacity
                                    className="flex-1 bg-zinc-700 rounded-xl py-3 mr-2"
                                    onPress={handleAddCustomIngredient}
                                >
                                    <View className="flex-row items-center justify-center">
                                        <Ionicons name="add" size={20} color="#FFFFFF" />
                                        <Text className="text-white font-bold ml-2">Add More</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity className="flex-1 rounded-xl overflow-hidden ml-2" onPress={handleConfirmIngredients}>
                                    <LinearGradient
                                        colors={["#10B981", "#059669"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="py-3"
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                                            <Text className="text-white font-bold ml-2">Use These</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                className="mt-3 bg-zinc-800 rounded-xl py-3"
                                onPress={() => {
                                    setDetectedIngredients([])
                                    setScanProgress(0)
                                }}
                            >
                                <View className="flex-row items-center justify-center">
                                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                                    <Text className="text-white font-bold ml-2">Scan Again</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="items-center px-4">
                            <TouchableOpacity
                                className="w-20 h-20 rounded-full overflow-hidden mb-4"
                                onPress={handleStartScan}
                                disabled={isScanning || !permission?.granted}
                            >
                                <LinearGradient
                                    colors={isScanning ? ["#6B7280", "#4B5563"] : ["#FBBF24", "#F97416"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="flex-1 items-center justify-center"
                                >
                                    <Ionicons name={isScanning ? "hourglass" : "scan"} size={32} color="#FFFFFF" />
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text className="text-white font-bold text-lg">{isScanning ? "Scanning..." : "Tap to Scan"}</Text>
                            <Text className="text-zinc-400 text-sm text-center mt-1">
                                AI will identify ingredients from camera or gallery
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    )
}