"use client"

import { useLanguage } from "@/context/LanguageContext"
import { useNotifications } from "@/hooks/useNotifications"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

interface Notification {
  _id: string
  type: "pantry" | "grocery" | "community" | "chef" | "payment" | "subscription" | "health" | "system"
  title: string
  message: string
  createdAt: string
  isRead: boolean
  priority: "low" | "medium" | "high" | "urgent"
  data?: any
}

const NotificationsScreen: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { t } = useLanguage()
  const {
    notifications: realNotifications,
    unreadCount: realUnreadCount,
    loading,
    fetchNotifications,
    markAsRead: markAsReadAPI,
    deleteNotifications: deleteNotificationAPI,
    sendTestNotification,
    runComprehensiveChecks,
  } = useNotifications()

  const [filter, setFilter] = useState<string>("all")
  const [refreshing, setRefreshing] = useState(false)

  // Fetch notifications on mount
  useEffect(() => {
    console.log('🔄 Fetching notifications...')
    fetchNotifications()
  }, [])

  // Handle pull to refresh
  const onRefresh = async () => {
    console.log('🔄 Pull to refresh...')
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  // Transform backend notifications to match UI format
  const notifications: Notification[] = realNotifications.map(notif => ({
    _id: notif._id,
    type: notif.type as any,
    title: notif.title,
    message: notif.message,
    createdAt: notif.createdAt,
    isRead: notif.isRead,
    priority: notif.priority as any,
    data: notif.data
  }))

  const unreadCount = realUnreadCount

  const getNotificationIcon = (type: string, priority: string) => {
    const iconColor = priority === "urgent" || priority === "high" ? "#EF4444" : priority === "medium" ? "#F97316" : "#10B981"

    switch (type) {
      case "pantry":
        return <MaterialIcons name="kitchen" size={20} color={iconColor} />
      case "grocery":
        return <Ionicons name="cart" size={20} color={iconColor} />
      case "community":
        return <Ionicons name="people" size={20} color={iconColor} />
      case "chef":
        return <Ionicons name="restaurant" size={20} color={iconColor} />
      case "payment":
        return <Ionicons name="card" size={20} color={iconColor} />
      case "subscription":
        return <Ionicons name="diamond" size={20} color={iconColor} />
      case "health":
        return <Ionicons name="fitness" size={20} color={iconColor} />
      default:
        return <Ionicons name="notifications" size={20} color={iconColor} />
    }
  }

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case "pantry":
        return t("notifications.categories.recipe")
      case "grocery":
        return t("notifications.categories.recipe")
      case "community":
        return t("notifications.categories.social")
      case "chef":
        return t("notifications.categories.recipe")
      case "payment":
        return t("notifications.categories.system")
      case "subscription":
        return t("notifications.categories.promotion")
      case "health":
        return t("notifications.categories.update")
      default:
        return t("notifications.categories.system")
    }
  }

  const getCategoryColor = (type: string) => {
    switch (type) {
      case "pantry":
        return "#10B981"
      case "grocery":
        return "#3B82F6"
      case "community":
        return "#8B5CF6"
      case "chef":
        return "#F97316"
      case "payment":
        return "#EF4444"
      case "subscription":
        return "#8B5CF6"
      case "health":
        return "#06B6D4"
      default:
        return "#6B7280"
    }
  }

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "urgent":
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

  const markAsRead = async (id: string) => {
    await markAsReadAPI([id])
    await fetchNotifications()
  }

  const deleteNotification = async (id: string) => {
    await deleteNotificationAPI([id])
    await fetchNotifications()
  }

  const markAllAsRead = async () => {
    await markAsReadAPI([], true)
    await fetchNotifications()
  }

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t("notifications.timeFormatting.justNow")
    if (diffMins < 60) return t("notifications.timeFormatting.minutesAgo", { count: diffMins })
    if (diffHours < 24) return t("notifications.timeFormatting.hoursAgo", { count: diffHours })
    if (diffDays < 7) return t("notifications.timeFormatting.daysAgo", { count: diffDays })
    return date.toLocaleDateString()
  }

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((notif) => notif.type === filter)

  const filters = [
    { key: "all", label: t("notifications.filters.all"), count: notifications.length },
    { key: "pantry", label: t("notifications.categories.recipe"), count: notifications.filter((n) => n.type === "pantry").length },
    { key: "grocery", label: t("notifications.categories.recipe"), count: notifications.filter((n) => n.type === "grocery").length },
    { key: "community", label: t("notifications.categories.social"), count: notifications.filter((n) => n.type === "community").length },
    { key: "chef", label: t("notifications.categories.recipe"), count: notifications.filter((n) => n.type === "chef").length },
    { key: "health", label: t("notifications.categories.update"), count: notifications.filter((n) => n.type === "health").length },
  ]

  const renderNotification = (notification: Notification) => {
    return (
      <TouchableOpacity
        key={notification._id}
        onPress={() => markAsRead(notification._id)}
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
              <View className="items-end">
                <Text className="text-gray-400 text-xs mb-2">{formatTimestamp(notification.createdAt)}</Text>
                <TouchableOpacity
                  onPress={() => notification.isRead ? deleteNotification(notification._id) : markAsRead(notification._id)}
                  className={`px-3 py-1.5 rounded-lg flex-row items-center ${notification.isRead ? "bg-red-500/20 border border-red-500/30" : "bg-green-500/20 border border-green-500/30"
                    }`}
                >
                  <Ionicons
                    name={notification.isRead ? "trash-outline" : "checkmark-circle-outline"}
                    size={14}
                    color={notification.isRead ? "#ef4444" : "#10b981"}
                  />
                  <Text
                    className={`text-xs font-medium ml-1 ${notification.isRead ? "text-red-400" : "text-green-400"
                      }`}
                  >
                    {notification.isRead ? t("notifications.actions.delete") : t("notifications.actions.markAsRead")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Title and Message */}
            <Text className="text-white font-semibold mb-1">{notification.title}</Text>
            <Text className="text-gray-300 text-sm leading-5">{notification.message}</Text>

            {/* Additional Data */}
            {notification.data && (
              <View className="mt-3 p-3 bg-zinc-700 rounded-xl">
                {(notification.type === "pantry" || notification.type === "grocery") && notification.data.itemName && (
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-medium">{notification.data.itemName}</Text>
                      {notification.data.daysLeft !== undefined && (
                        <Text className="text-gray-400 text-sm">
                          {notification.data.daysLeft === 0 ? t("notifications.timeFormatting.today") :
                            notification.data.daysLeft === 1 ? t("notifications.timeFormatting.tomorrow") :
                              notification.data.daysLeft > 0 ? t("notifications.timeFormatting.daysAgo", { count: notification.data.daysLeft }) :
                                t("notifications.timeFormatting.expired")}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                {notification.type === "chef" && notification.data.chefName && (
                  <View>
                    <Text className="text-white font-medium">{notification.data.chefName}</Text>
                    {notification.data.recipeTitle && (
                      <Text className="text-gray-400 text-sm">{notification.data.recipeTitle}</Text>
                    )}
                    {notification.data.courseTitle && (
                      <Text className="text-gray-400 text-sm">{notification.data.courseTitle}</Text>
                    )}
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
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

        {/* Header */}
        <View style={{ paddingTop: 44, backgroundColor: "#000000" }} className="px-4 pb-4 mt-2">
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold justify-center">{t("notifications.screenTitle")}</Text>
            <TouchableOpacity onPress={markAllAsRead}>
              <Text className="text-orange-500 font-semibold">{t("notifications.actions.markAllRead")}</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-gray-400 text-center">
            {unreadCount > 0 ? t("notifications.dataDisplay.unreadCount", { count: unreadCount }) : t("notifications.dataDisplay.noNotificationsDesc")}
          </Text>
        </View>

        {/* Test Notification Button */}
        <View className="px-4 pb-2">
          <TouchableOpacity
            onPress={async () => {
              await sendTestNotification()
              await fetchNotifications()
            }}
            className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-3 flex-row items-center justify-center"
          >
            <MaterialIcons name="notification-add" size={20} color="#f97316" />
            <Text className="text-orange-400 font-semibold ml-2">Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Comprehensive Check Button */}
        <View className="px-4 pb-4">
          <TouchableOpacity
            onPress={async () => {
              const result = await runComprehensiveChecks()
              if (result.success) {
                console.log('✅ Comprehensive checks completed:', result)
                await fetchNotifications()
              } else {
                console.log('❌ Comprehensive checks failed:', result.error)
              }
            }}
            className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 flex-row items-center justify-center"
          >
            <MaterialIcons name="refresh" size={20} color="#3b82f6" />
            <Text className="text-blue-400 font-semibold ml-2">Run Status Checks</Text>
          </TouchableOpacity>
          <Text className="text-gray-500 text-xs text-center mt-1">
            Check pantry expiry, grocery deadlines, and status changes
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
                  className={`py-2 px-3 mr-2 rounded-full flex-row items-center min-w-[80px] justify-center ${filter === filterItem.key ? "overflow-hidden" : "bg-zinc-800"
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
        {loading && notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-gray-400 mt-4">{t("notifications.dataDisplay.loadingNotifications")}</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ backgroundColor: '#000000' }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#F97316"
              />
            }
          >
            {filteredNotifications.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons name="notifications-off-outline" size={64} color="#4B5563" />
                <Text className="text-gray-400 text-lg mt-4 text-center">{t("notifications.dataDisplay.noNotifications")}</Text>
                <Text className="text-gray-500 text-center mt-2">
                  {filter === "all" ? t("notifications.dataDisplay.noNotificationsDesc") : t("notifications.dataDisplay.noNotificationsDesc")}
                </Text>
              </View>
            ) : (
              <View className="pb-8">{filteredNotifications.map(renderNotification)}</View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  )
}

export default NotificationsScreen
