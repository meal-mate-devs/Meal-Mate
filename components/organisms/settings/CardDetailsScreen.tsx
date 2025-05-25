"use client"

import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import React, { useState } from "react"
import { Alert, SafeAreaView, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from "react-native"

// This would normally come from a route param or context
const cardData = {
  id: "1",
  type: "mastercard",
  last4: "8675",
  fullNumber: "•••• •••• •••• 8675",
  cardholderName: "MAX MUSTERMANN",
  expiry: "03/25",
  cvv: "•••",
  isDefault: true,
  billingAddress: {
    street: "Musterstraße 123",
    city: "Berlin",
    zip: "10115",
    country: "Germany",
  },
}

const CardDetailsScreen: React.FC = () => {
  const [isDefault, setIsDefault] = useState(cardData.isDefault)

  const handleMakeDefault = (value: boolean) => {
    setIsDefault(value)
    // In a real app, you would save this change to your backend
  }

  const handleEditCard = () => {
    // Navigate to edit card screen
    router.push('/settings/add-card')
  }

  const handleRemoveCard = () => {
    Alert.alert("Remove Card", "Are you sure you want to remove this card from your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          // In a real app, you would call an API to remove the card
          router.back()
        },
      },
    ])
  }

  const getCardGradient = () => {
    switch (cardData.type) {
      case "mastercard":
        return ["#1F2937", "#374151"] as const
      case "visa":
        return ["#1E40AF", "#3B82F6"] as const
      default:
        return ["#1F2937", "#374151"] as const
    }
  }

  const getCardLogo = () => {
    switch (cardData.type) {
      case "mastercard":
        return (
          <View className="flex-row">
            <View className="w-6 h-6 rounded-full bg-red-500 mr-1" />
            <View className="w-6 h-6 rounded-full bg-yellow-500 -ml-3" />
          </View>
        )
      case "visa":
        return <Text className="text-white text-lg font-bold italic">VISA</Text>
      default:
        return null
    }
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
          <Text className="text-white text-xl font-bold">Card Details</Text>
          <TouchableOpacity onPress={handleEditCard}>
            <Feather name="edit-2" size={20} color="#FACC15" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-400 text-center">Manage your payment method</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Card Visual */}
        <View className="mb-6">
          <View className="overflow-hidden rounded-2xl">
            <LinearGradient colors={getCardGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-6">
              <View className="flex-row justify-between items-center mb-8">
                {getCardLogo()}
                <MaterialCommunityIcons name="contactless-payment" size={28} color="#FFF" />
              </View>

              <View className="mb-6">
                <Text className="text-gray-300 text-sm mb-1">Card Number</Text>
                <Text className="text-white text-xl font-mono tracking-wider">{cardData.fullNumber}</Text>
              </View>

              <View className="flex-row justify-between">
                <View>
                  <Text className="text-gray-300 text-xs mb-1">CARDHOLDER NAME</Text>
                  <Text className="text-white font-semibold">{cardData.cardholderName}</Text>
                </View>
                <View>
                  <Text className="text-gray-300 text-xs mb-1">EXPIRY DATE</Text>
                  <Text className="text-white font-semibold">{cardData.expiry}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row space-x-3 mb-6">
          <TouchableOpacity onPress={handleEditCard} className="flex-1 overflow-hidden rounded-2xl">
            <LinearGradient
              colors={["#FACC15", "#F97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 flex-row items-center justify-center"
            >
              <Feather name="edit-2" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Edit Card</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity className="bg-zinc-800 p-4 rounded-2xl flex-row items-center">
            <Feather name="copy" size={18} color="white" />
            <Text className="text-white font-semibold ml-2">Copy Details</Text>
          </TouchableOpacity>
        </View>

        {/* Card Information */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">Card Information</Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            <View className="flex-row justify-between items-center py-4 px-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                  <Ionicons name="card-outline" size={20} color="#FACC15" />
                </View>
                <Text className="text-white font-medium">Card Type</Text>
              </View>
              <Text className="text-gray-300">{cardData.type === "mastercard" ? "Mastercard" : "Visa"}</Text>
            </View>

            <View className="h-px bg-zinc-700 ml-14" />

            <View className="flex-row justify-between items-center py-4 px-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                  <Ionicons name="keypad-outline" size={20} color="#FACC15" />
                </View>
                <Text className="text-white font-medium">Last 4 digits</Text>
              </View>
              <Text className="text-gray-300 font-mono">•••• {cardData.last4}</Text>
            </View>

            <View className="h-px bg-zinc-700 ml-14" />

            <View className="flex-row justify-between items-center py-4 px-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                  <Ionicons name="calendar-outline" size={20} color="#FACC15" />
                </View>
                <Text className="text-white font-medium">Expiry date</Text>
              </View>
              <Text className="text-gray-300">{cardData.expiry}</Text>
            </View>

            <View className="h-px bg-zinc-700 ml-14" />

            <View className="flex-row justify-between items-center py-4 px-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                  <Ionicons name="star-outline" size={20} color="#FACC15" />
                </View>
                <View>
                  <Text className="text-white font-medium">Default payment method</Text>
                  <Text className="text-gray-400 text-sm">Use this card for all payments</Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: "#4B5563", true: "#FACC15" }}
                thumbColor={isDefault ? "#F97316" : "#9CA3AF"}
                ios_backgroundColor="#4B5563"
                onValueChange={handleMakeDefault}
                value={isDefault}
              />
            </View>
          </View>
        </View>

        {/* Billing Address */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">Billing Address</Text>
          <View className="bg-zinc-800 rounded-2xl p-4">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4 mt-1">
                <Ionicons name="location-outline" size={20} color="#FACC15" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base mb-1">{cardData.billingAddress.street}</Text>
                <Text className="text-gray-300 mb-1">
                  {cardData.billingAddress.zip} {cardData.billingAddress.city}
                </Text>
                <Text className="text-gray-400">{cardData.billingAddress.country}</Text>
              </View>
              <TouchableOpacity>
                <Feather name="edit-2" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Security Information */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">Security</Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center py-4 px-4">
              <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Security Status</Text>
                <Text className="text-green-400 text-sm">Card is secure and verified</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="h-px bg-zinc-700 ml-14" />

            <TouchableOpacity className="flex-row items-center py-4 px-4">
              <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                <Ionicons name="notifications-outline" size={20} color="#FACC15" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Transaction Alerts</Text>
                <Text className="text-gray-400 text-sm">Get notified of all transactions</Text>
              </View>
              <Switch
                trackColor={{ false: "#4B5563", true: "#FACC15" }}
                thumbColor="#F97316"
                ios_backgroundColor="#4B5563"
                value={true}
                onValueChange={() => {}}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-8">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">Danger Zone</Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center py-4 px-4" onPress={handleRemoveCard}>
              <View className="w-10 h-10 rounded-full bg-red-900/30 items-center justify-center mr-4">
                <Feather name="trash-2" size={20} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-red-400 font-medium">Remove this card</Text>
                <Text className="text-gray-500 text-sm">Permanently delete this payment method</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default CardDetailsScreen
