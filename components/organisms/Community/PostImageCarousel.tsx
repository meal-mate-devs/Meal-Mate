"use client"

import { Ionicons } from "@expo/vector-icons"
import React, { JSX, useRef, useState } from "react"
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native"

interface PostImageCarouselProps {
    images: (any | string)[]
}

const { width } = Dimensions.get("window")
const imageWidth = width

export default function PostImageCarousel({ images }: PostImageCarouselProps): JSX.Element {
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const scrollViewRef = useRef<ScrollView>(null)

    if (!images || images.length === 0) return <></>

    const handleScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x
        const newIndex = Math.round(contentOffsetX / imageWidth)
        setCurrentIndex(newIndex)
    }

    const scrollToIndex = (index: number) => {
        scrollViewRef.current?.scrollTo({
            x: index * imageWidth,
            animated: true,
        })
        setCurrentIndex(index)
    }

    if (images.length === 1) {
        return (
            <View className="w-full aspect-square">
                <Image
                    source={typeof images[0] === "string" ? { uri: images[0] } : images[0]}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            </View>
        )
    }

    return (
        <View className="w-full aspect-square relative">
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={imageWidth}
                snapToAlignment="start"
            >
                {images.map((image, index) => (
                    <View key={index} style={{ width: imageWidth }}>
                        <Image
                            source={typeof image === "string" ? { uri: image } : image}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>
                ))}
            </ScrollView>

            <View className="absolute top-4 right-4 bg-black bg-opacity-70 rounded-full px-3 py-1">
                <Text className="text-white text-sm font-bold">
                    {currentIndex + 1}/{images.length}
                </Text>
            </View>

            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
                {images.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => scrollToIndex(index)}
                        className={`w-2 h-2 rounded-full mx-1 ${index === currentIndex ? "bg-yellow-400" : "bg-white bg-opacity-50"
                            }`}
                    />
                ))}
            </View>

            {currentIndex > 0 && (
                <TouchableOpacity
                    className="absolute left-4 top-1/2 w-8 h-8 bg-black bg-opacity-70 rounded-full items-center justify-center"
                    onPress={() => scrollToIndex(currentIndex - 1)}
                >
                    <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {currentIndex < images.length - 1 && (
                <TouchableOpacity
                    className="absolute right-4 top-1/2 w-8 h-8 bg-black bg-opacity-70 rounded-full items-center justify-center"
                    onPress={() => scrollToIndex(currentIndex + 1)}
                >
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            )}
        </View>
    )
}
