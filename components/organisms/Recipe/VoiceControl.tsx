"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useEffect, useState } from "react"
import { Animated, Modal, Text, TouchableOpacity, View } from "react-native"


interface VoiceControlProps {
    visible: boolean
    onClose: () => void
    onVoiceInput: (input: string) => void
}

export default function VoiceControl({ visible, onClose, onVoiceInput }: VoiceControlProps): JSX.Element {
    const [isListening, setIsListening] = useState<boolean>(false)
    const [transcription, setTranscription] = useState<string>("")
    const [pulseAnim] = useState(new Animated.Value(1))

    useEffect(() => {
        if (isListening) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
            )
            pulse.start()
            return () => pulse.stop()
        }
    }, [isListening, pulseAnim])

    const startListening = (): void => {
        setIsListening(true)
        setTranscription("")

        setTimeout(() => {
            const mockTranscription = "I want to make a spicy Thai dish with chicken for 4 people in 30 minutes"
            setTranscription(mockTranscription)
            setIsListening(false)
        }, 3000)
    }

    const stopListening = (): void => {
        setIsListening(false)
    }

    const handleConfirm = (): void => {
        if (transcription) {
            onVoiceInput(transcription)
        }
    }

    const handleTryAgain = (): void => {
        setTranscription("")
        startListening()
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View className="flex-1 bg-black bg-opacity-95 justify-center items-center">
                <View className="bg-zinc-900 rounded-3xl p-8 mx-4 w-full max-w-sm border border-zinc-700">
                    <View className="flex-row justify-between items-center mb-6">
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text className="text-white text-lg font-bold">Voice Control</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View className="items-center mb-8">
                        <Animated.View
                            style={{
                                transform: [{ scale: pulseAnim }],
                            }}
                            className={`w-32 h-32 rounded-full items-center justify-center ${isListening ? "bg-red-500" : "bg-zinc-800"
                                }`}
                        >
                            <Ionicons name={isListening ? "mic" : "mic-outline"} size={48} color="#FFFFFF" />
                        </Animated.View>
                    </View>

                    <Text className="text-center text-white text-lg mb-4">
                        {isListening
                            ? "Listening... Speak now!"
                            : transcription
                                ? "Got it! Review your request:"
                                : "Tap the microphone to start"}
                    </Text>

                    {transcription && (
                        <View className="bg-zinc-800 rounded-xl p-4 mb-6 border border-zinc-700">
                            <Text className="text-white text-center">{transcription}</Text>
                        </View>
                    )}

                    <View className="space-y-3">
                        {!isListening && !transcription && (
                            <TouchableOpacity className="rounded-xl overflow-hidden" onPress={startListening}>
                                <LinearGradient
                                    colors={["#FBBF24", "#F97416"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-4"
                                >
                                    <View className="flex-row items-center justify-center">
                                        <Ionicons name="mic" size={20} color="#FFFFFF" />
                                        <Text className="text-white font-bold ml-2">Start Voice Input</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {isListening && (
                            <TouchableOpacity className="bg-red-500 rounded-xl py-4" onPress={stopListening}>
                                <View className="flex-row items-center justify-center">
                                    <Ionicons name="stop" size={20} color="#FFFFFF" />
                                    <Text className="text-white font-bold ml-2">Stop Listening</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {transcription && (
                            <View className="space-y-3">
                                <TouchableOpacity className="rounded-xl overflow-hidden" onPress={handleConfirm}>
                                    <LinearGradient
                                        colors={["#10B981", "#059669"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="py-4"
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                                            <Text className="text-white font-bold ml-2">Generate Recipe</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity className="bg-zinc-700 rounded-xl py-4" onPress={handleTryAgain}>
                                    <View className="flex-row items-center justify-center">
                                        <Ionicons name="refresh" size={20} color="#FFFFFF" />
                                        <Text className="text-white font-bold ml-2">Try Again</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View className="mt-6 pt-4 border-t border-zinc-800">
                        <Text className="text-zinc-400 text-sm text-center">
                            💡 Try saying: "Make me a vegetarian pasta for 2 people in 20 minutes"
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    )
}
