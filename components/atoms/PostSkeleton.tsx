"use client"

import React, { JSX, useEffect, useRef } from "react"
import { Animated, View } from "react-native"

export default function PostSkeleton(): JSX.Element {
    const shimmerValue = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const shimmerAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerValue, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerValue, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        )

        shimmerAnimation.start()

        return () => shimmerAnimation.stop()
    }, [shimmerValue])

    const shimmerStyle = {
        opacity: shimmerValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
        }),
    }

    return (
        <View className="bg-zinc-800 rounded-xl mb-4 overflow-hidden border border-zinc-700">
            {/* Header Skeleton */}
            <View className="flex-row items-center p-4">
                <Animated.View
                    className="w-10 h-10 rounded-full bg-zinc-600"
                    style={shimmerStyle}
                />
                <View className="ml-3 flex-1">
                    <Animated.View
                        className="h-4 bg-zinc-600 rounded mb-2 w-3/4"
                        style={shimmerStyle}
                    />
                    <Animated.View
                        className="h-3 bg-zinc-600 rounded w-1/2"
                        style={shimmerStyle}
                    />
                </View>
            </View>

            {/* Content Skeleton */}
            <View className="px-4 pb-3">
                <Animated.View
                    className="h-4 bg-zinc-600 rounded mb-2"
                    style={shimmerStyle}
                />
                <Animated.View
                    className="h-4 bg-zinc-600 rounded mb-2 w-4/5"
                    style={shimmerStyle}
                />
                <Animated.View
                    className="h-4 bg-zinc-600 rounded w-3/5"
                    style={shimmerStyle}
                />
            </View>

            {/* Image Skeleton */}
            <Animated.View
                className="h-48 bg-zinc-600 mx-4 mb-3 rounded-xl"
                style={shimmerStyle}
            />

            {/* Action Buttons Skeleton */}
            <View className="flex-row items-center justify-between px-4 py-3 border-t border-zinc-700">
                <View className="flex-row items-center">
                    <Animated.View
                        className="w-6 h-6 bg-zinc-600 rounded mr-2"
                        style={shimmerStyle}
                    />
                    <Animated.View
                        className="w-8 h-4 bg-zinc-600 rounded"
                        style={shimmerStyle}
                    />
                </View>

                <View className="flex-row items-center">
                    <Animated.View
                        className="w-6 h-6 bg-zinc-600 rounded mr-2"
                        style={shimmerStyle}
                    />
                    <Animated.View
                        className="w-8 h-4 bg-zinc-600 rounded"
                        style={shimmerStyle}
                    />
                </View>

                <View className="flex-row items-center">
                    <Animated.View
                        className="w-6 h-6 bg-zinc-600 rounded mr-2"
                        style={shimmerStyle}
                    />
                    <Animated.View
                        className="w-8 h-4 bg-zinc-600 rounded"
                        style={shimmerStyle}
                    />
                </View>
            </View>
        </View>
    )
}