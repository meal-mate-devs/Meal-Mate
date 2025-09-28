"use client"

import React, { JSX, useEffect, useRef } from "react"
import { Animated, View } from "react-native"

export default function PantrySkeleton(): JSX.Element {
    const shimmerValue = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const shimmerAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerValue, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerValue, {
                    toValue: 0,
                    duration: 1200,
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
            outputRange: [0.25, 0.75],
        }),
    }

    // Single row skeleton representing a pantry item
    const Row = ({ keyIndex }: { keyIndex: number }) => (
        <View key={keyIndex} className="flex-row items-center mb-4" style={{ alignItems: 'center' }}>
            <Animated.View className="bg-zinc-600 rounded-xl" style={[{ width: 120, height: 80, borderRadius: 14 }, shimmerStyle]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Animated.View className="bg-zinc-600 rounded mb-2" style={[{ height: 16, width: '60%', borderRadius: 6 }, shimmerStyle]} />
                <Animated.View className="bg-zinc-600 rounded mb-2" style={[{ height: 12, width: '45%', borderRadius: 6 }, shimmerStyle]} />
                <Animated.View className="bg-zinc-600 rounded" style={[{ height: 12, width: '30%', borderRadius: 6 }, shimmerStyle]} />
            </View>
            <Animated.View className="bg-zinc-600 rounded" style={[{ width: 36, height: 20, borderRadius: 8, marginLeft: 8 }, shimmerStyle]} />
        </View>
    )

    return (
        <View className="px-4 pt-4">
            {Array.from({ length: 5 }).map((_, i) => Row({ keyIndex: i }))}
        </View>
    )
}
