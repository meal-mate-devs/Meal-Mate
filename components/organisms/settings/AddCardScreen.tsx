"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import React, { useState } from "react"
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"

interface CardFormData {
  cardNumber: string
  cardholderName: string
  expiryDate: string
  cvv: string
  makeDefault: boolean
}

const AddCardScreen: React.FC = () => {
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
    makeDefault: false,
  })

  const [cardType, setCardType] = useState<"mastercard" | "visa" | "unknown">("unknown")

  // Format card number with spaces
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const limit = 16
    const formatted = cleaned
      .substring(0, limit)
      .replace(/(.{4})/g, "$1 ")
      .trim()

    // Detect card type based on first digit
    if (cleaned.startsWith("4")) {
      setCardType("visa")
    } else if (cleaned.startsWith("5")) {
      setCardType("mastercard")
    } else {
      setCardType("unknown")
    }

    return formatted
  }

  // Format expiry date with slash
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/[^0-9]/gi, "")
    const limit = 4
    if (cleaned.length > 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, limit)}`
    }
    return cleaned
  }

  const handleInputChange = (field: keyof CardFormData, value: string) => {
    let formattedValue = value

    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value)
    } else if (field === "expiryDate") {
      formattedValue = formatExpiryDate(value)
    } else if (field === "cvv") {
      formattedValue = value.replace(/[^0-9]/gi, "").substring(0, 3)
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }))
  }

  const handleSaveCard = () => {
    // Simple validation
    if (
      formData.cardNumber.replace(/\s+/g, "").length < 16 ||
      !formData.cardholderName ||
      formData.expiryDate.length < 5 ||
      formData.cvv.length < 3
    ) {
      Alert.alert("Incomplete Information", "Please fill out all card details correctly.")
      return
    }

    // In a real app, you would validate the card and send to a payment processor
    Alert.alert("Card Added", "Your card has been successfully added to your account.", [
      {
        text: "OK",
        onPress: () => router.push("/settings/payment"),
      },
    ])
  }

  const getCardGradient = () => {
    switch (cardType) {
      case "mastercard":
        return ["#1F2937", "#374151"] as const
      case "visa":
        return ["#1E40AF", "#3B82F6"] as const
      default:
        return ["#374151", "#4B5563"] as const
    }
  }

  const renderCardTypeIcon = () => {
    if (cardType === "visa") {
      return <Text className="text-white text-sm font-bold italic">VISA</Text>
    } else if (cardType === "mastercard") {
      return (
        <View className="flex-row">
          <View className="w-4 h-4 rounded-full bg-red-500 mr-1" />
          <View className="w-4 h-4 rounded-full bg-yellow-500 -ml-2" />
        </View>
      )
    }
    return <Ionicons name="card-outline" size={20} color="#9CA3AF" />
  }

  const renderInputField = (
    label: string,
    field: keyof CardFormData,
    placeholder: string,
    keyboardType: "default" | "numeric" = "default",
    icon?: React.ReactNode,
  ) => (
    <View className="mb-5">
      <Text className="text-gray-400 mb-2 font-medium">{label}</Text>
      <View className="bg-zinc-800 rounded-xl px-4 py-4 flex-row items-center">
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className="flex-1 text-white text-base"
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          value={formData[field] as string}
          onChangeText={(text) => handleInputChange(field, text)}
          keyboardType={keyboardType}
          autoCapitalize={field === "cardholderName" ? "characters" : "none"}
        />
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView className="flex-1 bg-black" style={{ backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* Header */}
      <View style={{ paddingTop: 44, backgroundColor: "#000000" }} className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.push("/settings/payment")}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Add New Card</Text>
          <View className="w-6" />
        </View>
        <Text className="text-gray-400 text-center">Add a payment method to your account</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView 
          className="flex-1 px-4" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ backgroundColor: '#000000' }}
        >
          {/* Card Preview */}
          <View className="mb-6">
            <Text className="text-white text-lg font-bold mb-4">Card Preview</Text>
            <View className="overflow-hidden rounded-2xl">
              <LinearGradient colors={getCardGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-6">
                <View className="flex-row justify-between items-center mb-8">
                  {renderCardTypeIcon()}
                  <Ionicons name="wifi" size={24} color="white" style={{ transform: [{ rotate: "90deg" }] }} />
                </View>

                <View className="mb-6">
                  <Text className="text-white text-xl font-mono tracking-wider">
                    {formData.cardNumber || "•••• •••• •••• ••••"}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-gray-300 text-xs mb-1">CARDHOLDER NAME</Text>
                    <Text className="text-white font-semibold">{formData.cardholderName || "YOUR NAME HERE"}</Text>
                  </View>
                  <View>
                    <Text className="text-gray-300 text-xs mb-1">EXPIRES</Text>
                    <Text className="text-white font-semibold">{formData.expiryDate || "MM/YY"}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Card Form */}
          <View className="mb-6">
            <Text className="text-white text-lg font-bold mb-4">Card Details</Text>

            {renderInputField(
              "Card Number",
              "cardNumber",
              "1234 5678 9012 3456",
              "numeric",
              <Ionicons name="card-outline" size={20} color="#FACC15" />,
            )}

            {renderInputField(
              "Cardholder Name",
              "cardholderName",
              "NAME AS APPEARS ON CARD",
              "default",
              <Ionicons name="person-outline" size={20} color="#FACC15" />,
            )}

            <View className="flex-row space-x-3">
              <View className="flex-1">
                {renderInputField(
                  "Expiry Date",
                  "expiryDate",
                  "MM/YY",
                  "numeric",
                  <Ionicons name="calendar-outline" size={20} color="#FACC15" />,
                )}
              </View>
              <View className="flex-1">
                {renderInputField(
                  "CVV",
                  "cvv",
                  "123",
                  "numeric",
                  <Ionicons name="shield-checkmark-outline" size={20} color="#FACC15" />,
                )}
              </View>
            </View>
          </View>

          {/* Default Payment Switch */}
          <View className="bg-zinc-800 rounded-2xl p-4 mb-6">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-white font-medium">Make default payment method</Text>
                <Text className="text-gray-400 text-sm mt-1">Use this card for all future payments</Text>
              </View>
              <Switch
                trackColor={{ false: "#4B5563", true: "#FACC15" }}
                thumbColor={formData.makeDefault ? "#F97316" : "#9CA3AF"}
                ios_backgroundColor="#4B5563"
                onValueChange={(value) => setFormData((prev) => ({ ...prev, makeDefault: value }))}
                value={formData.makeDefault}
              />
            </View>
          </View>

          {/* Security Notice */}
          <View className="bg-zinc-800 rounded-2xl p-4 mb-6">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-green-900/30 items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold mb-2">Secure & Encrypted</Text>
                <Text className="text-gray-300 text-sm leading-5">
                  Your card information is encrypted using bank-level security. We never store your full card details
                  and never share them with third parties.
                </Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity onPress={handleSaveCard} className="overflow-hidden rounded-2xl mb-8">
            <LinearGradient
              colors={["#FACC15", "#F97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 flex-row items-center justify-center"
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Save Card</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  )
}

export default AddCardScreen
