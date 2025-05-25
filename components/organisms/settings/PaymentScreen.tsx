"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React from "react"
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

interface CardData {
  id: string
  type: "mastercard" | "visa"
  last4: string
  expiry: string
  isDefault: boolean
  cardholderName: string
}

const PaymentScreen: React.FC = () => {
  const router = useRouter()

  const cards: CardData[] = [
    {
      id: "1",
      type: "mastercard",
      last4: "8675",
      expiry: "03/25",
      isDefault: true,
      cardholderName: "Max Mustermann",
    },
    {
      id: "2",
      type: "visa",
      last4: "1230",
      expiry: "07/27",
      isDefault: false,
      cardholderName: "Max Mustermann",
    },
  ]

  const getCardGradient = (type: string): readonly [string, string] => {
    switch (type) {
      case "mastercard":
        return ["#1F2937", "#374151"] as const
      case "visa":
        return ["#1E40AF", "#3B82F6"] as const
      default:
        return ["#1F2937", "#374151"] as const
    }
  }

  const getCardLogo = (type: string) => {
    switch (type) {
      case "mastercard":
        return (
          <View className="flex-row">
            <View className="w-4 h-4 rounded-full bg-red-500 mr-1" />
            <View className="w-4 h-4 rounded-full bg-yellow-500 -ml-2" />
          </View>
        )
      case "visa":
        return <Text className="text-white text-sm font-bold italic">VISA</Text>
      default:
        return null
    }
  }

  const renderCard = (card: CardData, index: number) => {
    return (
      <View key={card.id} className="mb-4">
        <TouchableOpacity
          className="overflow-hidden rounded-2xl"
          onPress={() => router.push(`/settings/card-details?id=${card.id}`)}
        >
          <LinearGradient
            colors={getCardGradient(card.type)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-4 relative"
          >
            {/* Card Header */}
            <View className="flex-row justify-between items-center mb-4">
              {getCardLogo(card.type)}
              <View className="flex-row items-center">
                {card.isDefault && (
                  <View className="bg-green-500 px-2 py-1 rounded-full mr-2">
                    <Text className="text-white text-xs font-semibold">DEFAULT</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </View>

            {/* Card Number */}
            <View className="mb-3">
              <Text className="text-white text-lg font-mono tracking-wider">•••• •••• •••• {card.last4}</Text>
            </View>

            {/* Card Details */}
            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-gray-300 text-xs mb-1">CARDHOLDER</Text>
                <Text className="text-white text-sm font-semibold">{card.cardholderName}</Text>
              </View>
              <View>
                <Text className="text-gray-300 text-xs mb-1">EXPIRES</Text>
                <Text className="text-white text-sm font-semibold">{card.expiry}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header with proper spacing */}
      <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Payment Methods</Text>
          <TouchableOpacity onPress={() => router.push("/settings/add-card")}>
            <Ionicons name="add" size={24} color="#FACC15" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-400 text-center">Manage your payment cards</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View className="flex-row justify-between mb-6">
          <View className="flex-1 bg-zinc-800 rounded-2xl p-4 mr-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="card-outline" size={20} color="#FACC15" />
              <Text className="text-gray-400 text-sm ml-2">Total Cards</Text>
            </View>
            <Text className="text-white text-2xl font-bold">{cards.length}</Text>
          </View>

          <View className="flex-1 bg-zinc-800 rounded-2xl p-4 ml-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="star" size={20} color="#10B981" />
              <Text className="text-gray-400 text-sm ml-2">Default</Text>
            </View>
            <Text className="text-white text-2xl font-bold">
              {cards.find((card) => card.isDefault)?.type === "mastercard" ? "MC" : "VISA"}
            </Text>
          </View>
        </View>

        {/* Credit Cards Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-4 px-2 uppercase tracking-wide">Your Cards</Text>
          {cards.map((card, index) => renderCard(card, index))}
        </View>

        {/* Add New Card */}
        <TouchableOpacity
          className="overflow-hidden rounded-2xl mb-6"
          onPress={() => router.push("/settings/add-card")}
        >
          <LinearGradient
            colors={["#FACC15", "#F97316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-4 flex-row items-center justify-center"
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-3">Add New Card</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Payment Options */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">
            Other Payment Options
          </Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center py-4 px-4">
              <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                <Ionicons name="phone-portrait-outline" size={20} color="#FACC15" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Apple Pay</Text>
                <Text className="text-gray-400 text-sm">Quick and secure payments</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" className="mr-3" />
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="h-px bg-zinc-700 ml-14" />

            <TouchableOpacity className="flex-row items-center py-4 px-4">
              <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                <Ionicons name="logo-google" size={20} color="#FACC15" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Google Pay</Text>
                <Text className="text-gray-400 text-sm">Pay with your Google account</Text>
              </View>
              <Ionicons name="close-circle" size={20} color="#EF4444" className="mr-3" />
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="h-px bg-zinc-700 ml-14" />

            <TouchableOpacity className="flex-row items-center py-4 px-4">
              <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                <Ionicons name="wallet-outline" size={20} color="#FACC15" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">PayPal</Text>
                <Text className="text-gray-400 text-sm">Link your PayPal account</Text>
              </View>
              <Ionicons name="close-circle" size={20} color="#EF4444" className="mr-3" />
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Information */}
        <View className="bg-zinc-800 rounded-2xl p-4 mb-8">
          <View className="flex-row items-center mb-3">
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text className="text-white font-bold text-lg ml-3">Secure Payments</Text>
          </View>
          <Text className="text-gray-300 leading-6">
            All your payment information is encrypted and stored securely. We never store your full card details on our
            servers.
          </Text>
          <TouchableOpacity className="mt-4">
            <Text className="text-orange-500 font-semibold">Learn more about security →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default PaymentScreen
