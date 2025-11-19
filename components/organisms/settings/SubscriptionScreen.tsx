"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React from "react"
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

const SubscriptionScreen: React.FC = () => {
  const router = useRouter()

  const subscriptionData = {
    plan: "Pro",
    status: "active",
    validUntil: "March 23, 2025",
    duration: "3 months",
    devicesUsed: 2,
    maxDevices: 3,
    price: "$9.99",
    billingCycle: "monthly",
    nextBilling: "February 23, 2024",
  }

  const features = [
    { id: "1", name: "Unlimited Recipe Generation", included: true },
    { id: "2", name: "Advanced Nutrition Tracking", included: true },
    { id: "3", name: "Premium Chef Content", included: true },
    { id: "5", name: "Priority Customer Support", included: true },
    { id: "6", name: "Ad-Free Experience", included: true },
    { id: "7", name: "Export Recipes & Data", included: true },
  ]

  const handleUpgrade = () => {
    Alert.alert("Upgrade Subscription", "Choose your new plan:", [
      { text: "Cancel", style: "cancel" },
      { text: "Annual Plan ($99.99)", onPress: () => console.log("Annual selected") },
      { text: "Lifetime Plan ($199.99)", onPress: () => console.log("Lifetime selected") },
    ])
  }

  const handleCancel = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your Pro subscription? You'll lose access to premium features.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => console.log("Subscription cancelled"),
        },
      ],
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView className="flex-1 bg-black" style={{ backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* Header */}
      <View style={{ paddingTop: 44, backgroundColor: "#000000" }} className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Subscription</Text>
          <View className="w-6" />
        </View>
        <Text className="text-gray-400 text-center">Manage your premium membership</Text>
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ backgroundColor: '#000000' }}
      >
        {/* Current Subscription Card */}
        <View className="mb-6">
          <View className="overflow-hidden rounded-2xl">
            <LinearGradient colors={["#8B5CF6", "#A855F7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-white text-2xl font-bold">{subscriptionData.plan} Plan</Text>
                  <Text className="text-white/80 text-lg">{subscriptionData.price}/month</Text>
                </View>
                <View className="bg-white/20 rounded-full px-3 py-1">
                  <Text className="text-white font-semibold text-sm uppercase">{subscriptionData.status}</Text>
                </View>
              </View>

              <View className="bg-white/10 rounded-xl p-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-white/80">Valid Until</Text>
                  <Text className="text-white font-semibold">{subscriptionData.validUntil}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-white/80">Plan Duration</Text>
                  <Text className="text-white font-semibold">{subscriptionData.duration}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-white/80">Devices Used</Text>
                  <Text className="text-white font-semibold">
                    {subscriptionData.devicesUsed} of {subscriptionData.maxDevices}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-white/80">Next Billing</Text>
                  <Text className="text-white font-semibold">{subscriptionData.nextBilling}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Subscription Benefits */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-4">Your Premium Benefits</Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            {features.map((feature, index) => (
              <View key={feature.id}>
                <View className="flex-row items-center p-4">
                  <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center mr-4">
                    <Ionicons name="checkmark" size={20} color="white" />
                  </View>
                  <Text className="text-white font-medium flex-1">{feature.name}</Text>
                </View>
                {index < features.length - 1 && <View className="h-px bg-zinc-700 ml-14" />}
              </View>
            ))}
          </View>
        </View>

        {/* Usage Statistics */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-4">This Month's Usage</Text>
          <View className="flex-row space-x-3">
            <View className="flex-1 bg-zinc-800 rounded-2xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="restaurant-outline" size={20} color="#FACC15" />
                <Text className="text-gray-400 text-sm ml-2">Recipes Generated</Text>
              </View>
              <Text className="text-white text-2xl font-bold">127</Text>
              <Text className="text-green-400 text-sm">+23 from last month</Text>
            </View>

            <View className="flex-1 bg-zinc-800 rounded-2xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="analytics-outline" size={20} color="#FACC15" />
                <Text className="text-gray-400 text-sm ml-2">Nutrition Tracked</Text>
              </View>
              <Text className="text-white text-2xl font-bold">28</Text>
              <Text className="text-green-400 text-sm">days this month</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mb-6 space-y-3">
          <TouchableOpacity onPress={handleUpgrade} className="overflow-hidden rounded-2xl">
            <LinearGradient
              colors={["#FACC15", "#F97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 flex-row items-center justify-center"
            >
              <Ionicons name="arrow-up-circle-outline" size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Upgrade Plan</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity className="bg-zinc-800 p-4 rounded-2xl flex-row items-center justify-center">
            <Ionicons name="settings-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Manage Billing</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-zinc-800 p-4 rounded-2xl flex-row items-center justify-center">
            <Ionicons name="receipt-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">View Invoices</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View className="mb-8">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">Danger Zone</Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center py-4 px-4" onPress={handleCancel}>
              <View className="w-10 h-10 rounded-full bg-red-900/30 items-center justify-center mr-4">
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-red-400 font-medium">Cancel Subscription</Text>
                <Text className="text-gray-500 text-sm">End your premium membership</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <View className="bg-zinc-800 rounded-2xl p-4 mb-8">
          <View className="flex-row items-center mb-3">
            <Ionicons name="help-circle" size={24} color="#3B82F6" />
            <Text className="text-white font-bold text-lg ml-3">Need Help?</Text>
          </View>
          <Text className="text-gray-300 mb-4">
            Have questions about your subscription? Our support team is here to help you get the most out of your
            premium membership.
          </Text>
          <TouchableOpacity className="bg-blue-600 py-3 rounded-xl" onPress={() => router.push("/settings/help")}>
            <Text className="text-white font-semibold text-center">Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  )
}

export default SubscriptionScreen