"use client"

import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import React, { useState } from "react"
import { Image, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

interface Notification {
  id: string
  type: "pantry" | "community" | "chef" | "payment" | "subscription"
  title: string
  message: string
  timestamp: string
  isRead: boolean
  priority: "low" | "medium" | "high"
  data?: any
}

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    // Pantry Notifications
    {
      id: "1",
      type: "pantry",
      title: "Items Expiring Soon",
      message: "Milk (500ml) expires in 2 days",
      timestamp: "2 hours ago",
      isRead: false,
      priority: "medium",
      data: { item: "Milk", amount: "500ml", expiryDate: "2024-01-15", daysLeft: 2 },
    },
    {
      id: "2",
      type: "pantry",
      title: "Item Expired",
      message: "Bread (1 loaf) expired yesterday",
      timestamp: "1 day ago",
      isRead: false,
      priority: "high",
      data: { item: "Bread", amount: "1 loaf", expiryDate: "2024-01-12", daysLeft: -1 },
    },
    {
      id: "3",
      type: "pantry",
      title: "Low Stock Alert",
      message: "Eggs (6 remaining) need to be refilled",
      timestamp: "3 hours ago",
      isRead: true,
      priority: "medium",
      data: { item: "Eggs", amount: "6 remaining", stockLevel: "low" },
    },
    // Community Notifications
    {
      id: "4",
      type: "community",
      title: "New Like on Your Post",
      message: "Sarah liked your Chocolate Cake recipe",
      timestamp: "30 minutes ago",
      isRead: false,
      priority: "low",
      data: { user: "Sarah", postTitle: "Chocolate Cake", action: "like" },
    },
    {
      id: "5",
      type: "community",
      title: "New Comment",
      message: "Mike commented on your Pasta Carbonara post",
      timestamp: "1 hour ago",
      isRead: false,
      priority: "medium",
      data: { user: "Mike", postTitle: "Pasta Carbonara", action: "comment", comment: "Looks delicious!" },
    },
    {
      id: "6",
      type: "community",
      title: "Reply to Your Comment",
      message: "Chef Anna replied to your comment on Italian Risotto",
      timestamp: "4 hours ago",
      isRead: true,
      priority: "medium",
      data: { user: "Chef Anna", postTitle: "Italian Risotto", action: "reply" },
    },
    // Chef Notifications
    {
      id: "7",
      type: "chef",
      title: "New Recipe from Chef Mario",
      message: "Chef Mario shared a new recipe: Authentic Pizza Margherita",
      timestamp: "6 hours ago",
      isRead: false,
      priority: "medium",
      data: {
        chef: "Chef Mario",
        recipeTitle: "Authentic Pizza Margherita",
        chefImage: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=100&h=100&fit=crop&crop=face",
      },
    },
    {
      id: "8",
      type: "chef",
      title: "Chef Live Session",
      message: "Chef Sofia is going live in 30 minutes for a cooking masterclass",
      timestamp: "45 minutes ago",
      isRead: false,
      priority: "high",
      data: { chef: "Chef Sofia", event: "Live Cooking Masterclass", startTime: "7:00 PM" },
    },
    // Payment Notifications
    {
      id: "9",
      type: "payment",
      title: "Card Expiring Soon",
      message: "Your Mastercard ending in 8675 expires in 15 days",
      timestamp: "1 day ago",
      isRead: true,
      priority: "high",
      data: { cardType: "Mastercard", last4: "8675", expiryDate: "03/25", daysLeft: 15 },
    },
    // Subscription Notifications
    {
      id: "10",
      type: "subscription",
      title: "Premium Membership Ending",
      message: "Your Premium membership expires in 7 days",
      timestamp: "2 days ago",
      isRead: false,
      priority: "high",
      data: { plan: "Premium", expiryDate: "2024-01-20", daysLeft: 7 },
    },
  ])

  const [filter, setFilter] = useState<string>("all")

  const getNotificationIcon = (type: string, priority: string) => {
    const iconColor = priority === "high" ? "#EF4444" : priority === "medium" ? "#F97316" : "#10B981"

    switch (type) {
      case "pantry":
        return <MaterialIcons name="kitchen" size={20} color={iconColor} />
      case "community":
        return <Ionicons name="people" size={20} color={iconColor} />
      case "chef":
        return <Ionicons name="restaurant" size={20} color={iconColor} />
      case "payment":
        return <Ionicons name="card" size={20} color={iconColor} />
      case "subscription":
        return <Ionicons name="diamond" size={20} color={iconColor} />
      default:
        return <Ionicons name="notifications" size={20} color={iconColor} />
    }
  }

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case "pantry":
        return "Pantry"
      case "community":
        return "Community"
      case "chef":
        return "Chef"
      case "payment":
        return "Payment"
      case "subscription":
        return "Premium"
      default:
        return "General"
    }
  }

  const getCategoryColor = (type: string) => {
    switch (type) {
      case "pantry":
        return "#10B981"
      case "community":
        return "#3B82F6"
      case "chef":
        return "#F97316"
      case "payment":
        return "#EF4444"
      case "subscription":
        return "#8B5CF6"
      default:
        return "#6B7280"
    }
  }

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "high":
        return <View className="w-3 h-3 bg-red-500 rounded-full" />
      case "medium":
        return <View className="w-3 h-3 bg-orange-500 rounded-full" />
      case "low":
        return <View className="w-3 h-3 bg-green-500 rounded-full" />
      default:
        return null
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, isRead: true })))
  }

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((notif) => notif.type === filter)

  const unreadCount = notifications.filter((notif) => !notif.isRead).length

  const filters = [
    { key: "all", label: "All", count: notifications.length },
    { key: "pantry", label: "Pantry", count: notifications.filter((n) => n.type === "pantry").length },
    { key: "community", label: "Community", count: notifications.filter((n) => n.type === "community").length },
    { key: "chef", label: "Chef", count: notifications.filter((n) => n.type === "chef").length },
    { key: "payment", label: "Payment", count: notifications.filter((n) => n.type === "payment").length },
    { key: "subscription", label: "Premium", count: notifications.filter((n) => n.type === "subscription").length },
  ]

  const renderNotification = (notification: Notification) => {
    return (
      <TouchableOpacity
        key={notification.id}
        onPress={() => markAsRead(notification.id)}
        className={`bg-zinc-800 rounded-2xl p-4 mb-3 ${!notification.isRead ? "border border-orange-500/30" : ""}`}
      >
        <View className="flex-row items-start">
          {/* Icon and Priority */}
          <View className="mr-3 items-center">
            <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mb-2">
              {getNotificationIcon(notification.type, notification.priority)}
            </View>
            {getPriorityIndicator(notification.priority)}
          </View>

          {/* Content */}
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View
                  className="px-2 py-1 rounded-full mr-2"
                  style={{ backgroundColor: `${getCategoryColor(notification.type)}20` }}
                >
                  <Text className="text-xs font-semibold" style={{ color: getCategoryColor(notification.type) }}>
                    {getCategoryLabel(notification.type)}
                  </Text>
                </View>
                {!notification.isRead && <View className="w-2 h-2 bg-orange-500 rounded-full" />}
              </View>
              <Text className="text-gray-400 text-xs">{notification.timestamp}</Text>
            </View>

            {/* Title and Message */}
            <Text className="text-white font-semibold mb-1">{notification.title}</Text>
            <Text className="text-gray-300 text-sm leading-5">{notification.message}</Text>

            {/* Additional Data */}
            {notification.data && (
              <View className="mt-3 p-3 bg-zinc-700 rounded-xl">
                {notification.type === "pantry" && (
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-medium">{notification.data.item}</Text>
                      <Text className="text-gray-400 text-sm">Amount: {notification.data.amount}</Text>
                    </View>
                    {notification.data.expiryDate && (
                      <View className="items-end">
                        <Text className="text-gray-400 text-xs">Expires</Text>
                        <Text
                          className={`font-semibold ${
                            notification.data.daysLeft < 0
                              ? "text-red-400"
                              : notification.data.daysLeft <= 2
                                ? "text-orange-400"
                                : "text-green-400"
                          }`}
                        >
                          {notification.data.expiryDate}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {notification.type === "community" && (
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-gray-600 rounded-full mr-3" />
                    <View>
                      <Text className="text-white font-medium">{notification.data.user}</Text>
                      <Text className="text-gray-400 text-sm">{notification.data.postTitle}</Text>
                    </View>
                  </View>
                )}

                {notification.type === "chef" && (
                  <View className="flex-row items-center">
                    {notification.data.chefImage ? (
                      <Image source={{ uri: notification.data.chefImage }} className="w-8 h-8 rounded-full mr-3" />
                    ) : (
                      <View className="w-8 h-8 bg-orange-500 rounded-full mr-3 items-center justify-center">
                        <Ionicons name="person" size={16} color="white" />
                      </View>
                    )}
                    <View>
                      <Text className="text-white font-medium">{notification.data.chef}</Text>
                      <Text className="text-gray-400 text-sm">
                        {notification.data.recipeTitle || notification.data.event}
                      </Text>
                    </View>
                  </View>
                )}

                {notification.type === "payment" && (
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-medium">{notification.data.cardType}</Text>
                      <Text className="text-gray-400 text-sm">•••• •••• •••• {notification.data.last4}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-gray-400 text-xs">Expires</Text>
                      <Text className="text-red-400 font-semibold">{notification.data.expiryDate}</Text>
                    </View>
                  </View>
                )}

                {notification.type === "subscription" && (
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-medium">{notification.data.plan} Plan</Text>
                      <Text className="text-gray-400 text-sm">Access to premium features</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-gray-400 text-xs">Expires in</Text>
                      <Text className="text-purple-400 font-semibold">{notification.data.daysLeft} days</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.push('/home')}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Notifications</Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text className="text-orange-500 font-semibold">Mark All Read</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-400 text-center">
          {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="px-4 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {filters.map((filterItem) => (
              <TouchableOpacity
                key={filterItem.key}
                onPress={() => setFilter(filterItem.key)}
                className={`py-2 px-3 mr-2 rounded-full flex-row items-center min-w-[80px] justify-center ${
                  filter === filterItem.key ? "overflow-hidden" : "bg-zinc-800"
                }`}
                style={{ height: 36 }}
              >
                {filter === filterItem.key ? (
                  <LinearGradient
                    colors={["#FACC15", "#F97316"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="absolute inset-0"
                  />
                ) : null}
                <Text className={`${filter === filterItem.key ? "text-white" : "text-gray-400"} font-medium text-sm mr-1`}>
                  {filterItem.label}
                </Text>
                <View className={`px-1.5 py-0.5 rounded-full ${filter === filterItem.key ? "bg-white/20" : "bg-zinc-700"}`}>
                  <Text className={`text-xs font-bold ${filter === filterItem.key ? "text-white" : "text-gray-300"}`}>
                    {filterItem.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filteredNotifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="notifications-off-outline" size={64} color="#4B5563" />
            <Text className="text-gray-400 text-lg mt-4 text-center">No notifications</Text>
            <Text className="text-gray-500 text-center mt-2">
              {filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}
            </Text>
          </View>
        ) : (
          <View className="pb-8">{filteredNotifications.map(renderNotification)}</View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default NotificationsScreen
