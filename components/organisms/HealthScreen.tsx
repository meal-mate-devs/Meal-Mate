"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useState } from "react"
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

const HealthScreen = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("Week")
  const tabs = ["Day", "Week", "Month"]

  // User profile data
  const userProfile = {
    goal: "Getting Muscular",
    targetCalories: 2800,
    targetProtein: 140, // grams
    targetCarbs: 350, // grams
    targetFats: 93, // grams
    currentWeight: 75, // kg
    targetWeight: 80, // kg
    height: 175, // cm
    age: 25,
    activityLevel: "Moderate",
  }

  // Today's nutrition data
  const todayNutrition = {
    calories: 2340,
    protein: 118,
    carbs: 285,
    fats: 78,
    water: 6, // glasses
    fiber: 28, // grams
    sugar: 45, // grams
  }

  // Weekly calorie data
  const weekData = [
    { day: "Sun", calories: 2150, target: 2800 },
    { day: "Mon", calories: 2680, target: 2800 },
    { day: "Tue", calories: 2460, target: 2800 },
    { day: "Wed", calories: 2340, target: 2800 },
    { day: "Thu", calories: 2590, target: 2800 },
    { day: "Fri", calories: 2720, target: 2800 },
    { day: "Sat", calories: 2840, target: 2800 },
  ]

  // Health goals for muscle building
  const healthGoals = [
    {
      id: "1",
      name: "Protein Intake Goal",
      icon: "💪",
      current: todayNutrition.protein,
      target: userProfile.targetProtein,
      unit: "g",
      progress: Math.round((todayNutrition.protein / userProfile.targetProtein) * 100),
      completed: todayNutrition.protein >= userProfile.targetProtein,
      color: "#10B981",
    },
    {
      id: "2",
      name: "Daily Calorie Target",
      icon: "🔥",
      current: todayNutrition.calories,
      target: userProfile.targetCalories,
      unit: "kcal",
      progress: Math.round((todayNutrition.calories / userProfile.targetCalories) * 100),
      completed: todayNutrition.calories >= userProfile.targetCalories * 0.9,
      color: "#F97316",
    },
    {
      id: "3",
      name: "Water Intake",
      icon: "💧",
      current: todayNutrition.water,
      target: 8,
      unit: "glasses",
      progress: Math.round((todayNutrition.water / 8) * 100),
      completed: todayNutrition.water >= 8,
      color: "#3B82F6",
    },
    {
      id: "4",
      name: "Limit Processed Foods",
      icon: "🚫",
      current: 2,
      target: 3,
      unit: "servings",
      progress: 67,
      completed: false,
      color: "#EF4444",
    },
  ]

  // Health recommendations for muscle building
  const recommendations = [
    {
      id: "1",
      title: "Increase Protein Intake",
      description: "You need 22g more protein to reach your daily goal",
      action: "View High-Protein Recipes",
      priority: "high",
      icon: "nutrition-outline",
    },
    {
      id: "2",
      title: "Post-Workout Nutrition",
      description: "Consume protein within 30 minutes after workout",
      action: "Set Reminder",
      priority: "medium",
      icon: "time-outline",
    },
    {
      id: "3",
      title: "Hydration Check",
      description: "Drink 2 more glasses of water today",
      action: "Track Water",
      priority: "medium",
      icon: "water-outline",
    },
  ]

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "#10B981"
    if (progress >= 75) return "#F97316"
    if (progress >= 50) return "#FACC15"
    return "#EF4444"
  }

  const renderMacroCard = (name: string, current: number, target: number, unit: string, color: string) => (
    <View className="bg-zinc-800 rounded-2xl p-4 flex-1 mx-1">
      <Text className="text-gray-400 text-sm mb-2">{name}</Text>
      <Text className="text-white text-2xl font-bold mb-1">
        {current}
        <Text className="text-gray-400 text-sm">/{target}</Text>
      </Text>
      <Text className="text-gray-400 text-xs mb-3">{unit}</Text>
      <View className="bg-zinc-700 h-2 rounded-full">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${Math.min((current / target) * 100, 100)}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.push("/home")} className="p-2 rounded-full">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Health Stats</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#FACC15" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-400 text-center">Track your nutrition and progress</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Goal Overview */}
        <View className="mb-6">
          <View className="overflow-hidden rounded-2xl">
            <LinearGradient colors={["#FACC15", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white text-lg font-bold mb-1">Current Goal</Text>
                  <Text className="text-white/90 text-2xl font-bold">{userProfile.goal}</Text>
                  <Text className="text-white/80 text-sm mt-1">
                    {userProfile.currentWeight}kg → {userProfile.targetWeight}kg
                  </Text>
                </View>
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                  <Text className="text-4xl">💪</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Today's Overview */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-4">Today's Nutrition</Text>
          <View className="bg-zinc-800 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-semibold">Calories</Text>
              <Text className="text-gray-400 text-sm">
                {Math.round((todayNutrition.calories / userProfile.targetCalories) * 100)}% of goal
              </Text>
            </View>
            <View className="flex-row items-end mb-3">
              <Text className="text-white text-3xl font-bold">{todayNutrition.calories}</Text>
              <Text className="text-gray-400 text-lg ml-1">/ {userProfile.targetCalories} kcal</Text>
            </View>
            <View className="bg-zinc-700 h-3 rounded-full">
              <View
                className="h-3 rounded-full"
                style={{
                  width: `${Math.min((todayNutrition.calories / userProfile.targetCalories) * 100, 100)}%`,
                  backgroundColor: getProgressColor((todayNutrition.calories / userProfile.targetCalories) * 100),
                }}
              />
            </View>
          </View>

          {/* Macronutrients */}
          <View className="flex-row">
            {renderMacroCard("Protein", todayNutrition.protein, userProfile.targetProtein, "g", "#10B981")}
            {renderMacroCard("Carbs", todayNutrition.carbs, userProfile.targetCarbs, "g", "#3B82F6")}
            {renderMacroCard("Fats", todayNutrition.fats, userProfile.targetFats, "g", "#F97316")}
          </View>
        </View>

        {/* Weekly Progress Chart */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">Weekly Progress</Text>
            <View className="flex-row">
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`py-2 px-4 mr-2 rounded-full ${activeTab === tab ? "overflow-hidden" : "bg-zinc-800"}`}
                >
                  {activeTab === tab ? (
                    <LinearGradient
                      colors={["#FACC15", "#F97316"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="absolute inset-0"
                    />
                  ) : null}
                  <Text className={`${activeTab === tab ? "text-white" : "text-gray-400"} font-medium text-sm`}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="bg-zinc-800 rounded-2xl p-4">
            <View className="h-48 flex-row items-end justify-between">
              {weekData.map((item, index) => {
                const percentage = (item.calories / item.target) * 100
                const height = Math.max((percentage / 100) * 120, 20)
                return (
                  <View key={index} className="items-center flex-1">
                    <View className="mb-2 items-center">
                      <Text className="text-white text-xs font-semibold">{item.calories}</Text>
                    </View>
                    <View
                      className="w-6 rounded-t-lg mb-2"
                      style={{
                        height: height,
                        backgroundColor: percentage >= 90 ? "#10B981" : percentage >= 75 ? "#F97316" : "#EF4444",
                      }}
                    />
                    <Text className={`text-xs ${item.day === "Wed" ? "text-orange-500" : "text-gray-400"}`}>
                      {item.day}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* Health Goals */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-4">Daily Goals</Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            {healthGoals.map((goal, index) => (
              <View key={goal.id}>
                <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-full bg-zinc-700 items-center justify-center mr-4">
                      <Text className="text-2xl">{goal.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{goal.name}</Text>
                      <Text className="text-gray-400 text-sm">
                        {goal.current} / {goal.target} {goal.unit}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    {goal.completed ? (
                      <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center">
                        <Ionicons name="checkmark" size={20} color="white" />
                      </View>
                    ) : (
                      <View className="items-center">
                        <View className="w-10 h-10 rounded-full items-center justify-center relative">
                          <View className="absolute w-10 h-10 rounded-full border-2 border-zinc-600" />
                          <View
                            className="absolute w-10 h-10 rounded-full border-2"
                            style={{
                              borderColor: goal.color,
                              borderTopColor: goal.progress >= 25 ? goal.color : "transparent",
                              borderRightColor: goal.progress >= 50 ? goal.color : "transparent",
                              borderBottomColor: goal.progress >= 75 ? goal.color : "transparent",
                              borderLeftColor: goal.progress >= 100 ? goal.color : "transparent",
                              transform: [{ rotate: "-90deg" }],
                            }}
                          />
                          <Text className="text-white text-xs font-bold">{goal.progress}%</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
                {index < healthGoals.length - 1 && <View className="h-px bg-zinc-700 ml-16" />}
              </View>
            ))}
          </View>
        </View>

        {/* Diet Planning Module Card */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => router.push("/diet-plan" as any)}
            activeOpacity={0.8}
          >
            <View className="overflow-hidden rounded-3xl">
              <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-5"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                        <Text className="text-white text-xs font-bold">NEW</Text>
                      </View>
                      <Text className="text-white/90 text-sm">Personalized Plans</Text>
                    </View>
                    <Text className="text-white text-2xl font-bold mb-2">Diet Planning</Text>
                    <Text className="text-white/80 text-sm mb-3">
                      Get personalized meal plans, health condition recommendations, and detailed nutritional breakdowns
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-white font-semibold mr-2">Explore Now</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </View>
                  </View>
                  <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center ml-3">
                    <Text className="text-5xl">🍽️</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>

        {/* Health Recommendations */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-4">Recommendations</Text>
          <View>
            {recommendations.map((rec) => (
              <View key={rec.id} className="bg-zinc-800 rounded-2xl p-4 mb-3">
                <View className="flex-row items-start">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${rec.priority === "high" ? "bg-red-900/30" : "bg-orange-900/30"
                      }`}
                  >
                    <Ionicons
                      name={rec.icon as any}
                      size={20}
                      color={rec.priority === "high" ? "#EF4444" : "#F97316"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold mb-1">{rec.title}</Text>
                    <Text className="text-gray-300 text-sm mb-3">{rec.description}</Text>
                    <TouchableOpacity className="overflow-hidden rounded-full self-start">
                      <LinearGradient
                        colors={["#FACC15", "#F97316"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="py-2 px-4"
                      >
                        <Text className="text-white font-semibold text-sm">{rec.action}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default HealthScreen
