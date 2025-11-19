"use client"

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { useProfileStore } from '../../../hooks/useProfileStore';
import DeleteAccountModal from "../../molecules/DeleteAccountModal";

const SettingsScreen: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Get real user profile data
  const { profileData, subscribe } = useProfileStore();
  const [userData, setUserData] = useState(profileData);

  // Subscribe to profile updates
  useEffect(() => {
    const unsubscribe = subscribe((updatedData) => {
      setUserData(updatedData);
    });
    
    // Initialize with current data
    setUserData(profileData);
    
    return unsubscribe;
  }, [subscribe, profileData]);

  const accountItems = [
    {
      id: "profile",
      title: userData.name || "User",
      subtitle: userData.email || "user@example.com",
      link: "/settings/profile",
      showBadge: false,
      icon: "person-circle-outline",
    },
    {
      id: "subscription",
      title: "Pro Subscription",
      subtitle: "valid until 03/24",
      link: "/settings/subscription",
      showBadge: true,
      badgeColor: "#10B981",
      icon: "diamond-outline",
    },
    {
      id: "privacy",
      icon: "shield-checkmark-outline",
      title: "Privacy & Security",
      subtitle: "Password, data protection, permissions",
      link: "/settings/privacy",
      showBadge: false,
    },
  ]

  const appSettingsItems = [
    {
      id: "general",
      icon: "settings-outline",
      title: "General",
      subtitle: "Language, region, accessibility",
      link: "/settings/general",
    },
    {
      id: "notifications",
      icon: "notifications-outline",
      title: "Notifications",
      subtitle: "Push notifications, email alerts",
      link: "/settings/notifications",
    },
    {
      id: "payment",
      icon: "card-outline",
      title: "Payment & Billing",
      subtitle: "Payment methods, invoices",
      link: "/settings/payment",
    },
    {
      id: "help",
      icon: "help-circle-outline",
      title: "Help & Support",
      subtitle: "FAQ, contact support",
      link: "/settings/help",
    },
  ]

  const renderSettingItem = (item: any, isLast = false) => (
    <View key={item.id}>
      <TouchableOpacity
        className="flex-row items-center justify-between py-4 px-4"
        onPress={() => router.push(item.link)}
      >
        <View className="flex-row items-center flex-1">
          {item.icon && (
            <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
              <Ionicons name={item.icon as any} size={20} color="#FACC15" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">{item.title}</Text>
            {item.subtitle && <Text className="text-gray-400 text-sm mt-1">{item.subtitle}</Text>}
          </View>
        </View>
        <View className="flex-row items-center">
          {item.showBadge && (
            <View className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: item.badgeColor || "#10B981" }} />
          )}
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
      {!isLast && <View className="h-px bg-zinc-700 ml-14" />}
    </View>
  )

  const renderSettingsSection = (title: string | null, items: any[]) => (
    <View className="mb-6">
      {title && <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">{title}</Text>}
      <View className="bg-zinc-800 rounded-2xl overflow-hidden">
        {items.map((item, index) => renderSettingItem(item, index === items.length - 1))}
      </View>
    </View>
  )
  
  return (
    <LinearGradient
      colors={["#09090b", "#18181b"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.5 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Header with proper spacing */}
      <View style={{ paddingTop: 44 }} className="px-4 pb-6">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => {
            // If accessed from sidebar, go back with smooth transition
            if (params.from === 'sidebar') {
              router.push('/home')
            } else {
              router.back()
            }
          }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Settings</Text>
          <View className="w-6" />
        </View>
        <Text className="text-gray-400 text-center">Manage your account and preferences</Text>
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View className="mb-6">
          <View className="flex-row">
            <TouchableOpacity className="flex-1 overflow-hidden rounded-2xl mr-2">
              <LinearGradient
                colors={["#FACC15", "#F97316"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="p-4 flex-row items-center justify-center"
              >
                <Ionicons name="star" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Upgrade to Pro</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity className="bg-zinc-800 p-4 rounded-2xl flex-row items-center">
              <Ionicons name="share-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Share App</Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderSettingsSection("Account", accountItems)}
        {renderSettingsSection("App Settings", appSettingsItems)}

        {/* Danger Zone */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">Danger Zone</Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            

            <TouchableOpacity
              className="flex-row items-center justify-between py-4 px-4"
              onPress={() => setShowDeleteModal(true)}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-red-900/30 items-center justify-center mr-4">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-red-400 font-semibold text-base">Delete Account</Text>
                  <Text className="text-gray-500 text-sm mt-1">Permanently delete your account</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View className="bg-zinc-800 rounded-2xl p-4 mb-8">
          <View className="items-center">
            <View className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl items-center justify-center mb-3">
              <Ionicons name="restaurant" size={32} color="white" />
            </View>
            <Text className="text-white font-bold text-lg">Meal Mate</Text>
            <Text className="text-gray-400 text-sm">Version 1.0.0</Text>
            <Text className="text-gray-500 text-xs mt-2 text-center">Made with ❤️ for food lovers everywhere</Text>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
    </LinearGradient>
  )
}

export default SettingsScreen
