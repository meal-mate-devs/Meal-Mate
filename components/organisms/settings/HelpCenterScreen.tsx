"use client"

import { Feather, Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import React, { useState } from "react"
import {
    Alert,
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

const HelpCenterScreen: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [supportMessage, setSupportMessage] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const faqs: FAQ[] = [
    {
      id: "1",
      question: "How do I generate recipes from ingredients?",
      answer:
        "Simply enter the ingredients you have available in the search bar on the home screen. Our AI will analyze your ingredients and suggest delicious recipes you can make. You can also specify dietary preferences and cooking time.",
      category: "Recipe Generation",
    },
    {
      id: "2",
      question: "How do I save recipes to my favorites?",
      answer:
        "Tap the heart icon on any recipe card to add it to your favorites. You can access all your saved recipes from the Favorites tab in the bottom navigation.",
      category: "Favorites",
    },
    {
      id: "3",
      question: "What is Cooking Mode and how do I use it?",
      answer:
        "Cooking Mode is a step-by-step cooking assistant that guides you through recipe preparation. Tap 'Start Cooking' on any recipe to begin. It includes a timer, ingredient list, and detailed instructions for each step.",
      category: "Cooking",
    },
    {
      id: "4",
      question: "Can I customize serving sizes for recipes?",
      answer:
        "Yes! When viewing a recipe, you can adjust the serving size and all ingredient quantities will automatically scale accordingly. This feature is available for all generated recipes.",
      category: "Recipe Generation",
    },
    {
      id: "5",
      question: "How accurate are the cooking times?",
      answer:
        "Our cooking times are estimates based on average preparation and cooking durations. Actual times may vary depending on your cooking experience, equipment, and ingredient preparation.",
      category: "Cooking",
    },
    {
      id: "6",
      question: "Can I use the app offline?",
      answer:
        "Your saved favorite recipes are available offline for viewing. However, generating new recipes requires an internet connection as it uses our AI recipe generation service.",
      category: "General",
    },
    {
      id: "7",
      question: "How do I delete recipes from my favorites?",
      answer:
        "In your Favorites screen, tap the heart icon on any recipe card to remove it from your favorites. You can also swipe left on a recipe for quick removal options.",
      category: "Favorites",
    },
    {
      id: "8",
      question: "What dietary restrictions are supported?",
      answer:
        "Our app supports various dietary preferences including vegetarian, vegan, gluten-free, dairy-free, keto, and more. Specify your preferences when generating recipes for personalized suggestions.",
      category: "Recipe Generation",
    },
  ]

  const categories = ["All", "Recipe Generation", "Cooking", "Favorites", "General"]
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredFAQs = selectedCategory === "All" ? faqs : faqs.filter((faq) => faq.category === selectedCategory)

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  const sendSupportEmail = async () => {
    if (!supportMessage.trim()) {
      Alert.alert("Message Required", "Please enter your message before sending.")
      return
    }

    if (!userEmail.trim()) {
      Alert.alert("Email Required", "Please enter your email address so we can respond to you.")
      return
    }

    setIsSubmitting(true)

    try {
      const subject = "MealMate Support Request"
      const body = `User Email: ${userEmail}\n\nMessage:\n${supportMessage}\n\n---\nSent from MealMate App`
      const emailUrl = `mailto:mealmate.fyp@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body,
      )}`

      const canOpen = await Linking.canOpenURL(emailUrl)
      if (canOpen) {
        await Linking.openURL(emailUrl)
        setSupportMessage("")
        setUserEmail("")
        Alert.alert("Email Opened", "Your default email app has been opened with your message.")
      } else {
        Alert.alert("Email Not Available", "Please make sure you have an email app configured on your device.")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open email app. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickActions = [
    {
      id: "contact",
      title: "Contact Support",
      subtitle: "Get direct help from our team",
      icon: "mail-outline",
      action: () => {
        // Scroll to contact form
      },
    },
    {
      id: "tutorial",
      title: "App Tutorial",
      subtitle: "Learn how to use MealMate",
      icon: "play-circle-outline",
      action: () => {
        Alert.alert("Tutorial", "Tutorial feature coming soon!")
      },
    },
    {
      id: "feedback",
      title: "Send Feedback",
      subtitle: "Help us improve the app",
      icon: "chatbubble-outline",
      action: () => {
        // Scroll to contact form
      },
    },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView className="flex-1 bg-black" style={{ backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* Header */}
      <View style={{ paddingTop: 44, backgroundColor: "#000000" }} className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.push("/settings")}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Help Center</Text>
          <View className="w-6" />
        </View>
        <Text className="text-gray-400 text-center">We're here to help you cook better</Text>
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ backgroundColor: '#000000' }}
      >
        {/* FAQ Categories */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                className={`py-2 px-4 mr-2 rounded-full ${
                  selectedCategory === category ? "overflow-hidden" : "bg-zinc-800"
                }`}
              >
                {selectedCategory === category ? (
                  <LinearGradient
                    colors={["#FACC15", "#F97316"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="absolute inset-0"
                  />
                ) : null}
                <Text className={`${selectedCategory === category ? "text-white" : "text-gray-400"} font-medium`}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FAQs */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">
            Frequently Asked Questions
          </Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            {filteredFAQs.map((faq, index) => (
              <View key={faq.id}>
                <TouchableOpacity className="p-4" onPress={() => toggleFAQ(faq.id)}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-medium flex-1 pr-4">{faq.question}</Text>
                    <Ionicons name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
                  </View>
                  {expandedFAQ === faq.id && (
                    <View className="mt-3 pt-3 border-t border-zinc-700">
                      <Text className="text-gray-300 leading-6">{faq.answer}</Text>
                      <View className="mt-2">
                        <Text className="text-orange-500 text-xs font-medium">{faq.category}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
                {index < filteredFAQs.length - 1 && <View className="h-px bg-zinc-700" />}
              </View>
            ))}
          </View>
        </View>

        {/* Contact Support Form */}
        <View className="mb-8">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">Contact Support</Text>
          <View className="bg-zinc-800 rounded-2xl p-4">
            <View className="flex-row items-center mb-4">
              <Ionicons name="mail" size={24} color="#FACC15" />
              <Text className="text-white font-bold text-lg ml-3">Send us a message</Text>
            </View>
            <Text className="text-gray-300 mb-4">
              Can't find what you're looking for? Send us a message and we'll get back to you as soon as possible.
            </Text>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Your Email Address</Text>
              <TextInput
                className="bg-zinc-700 text-white p-3 rounded-xl"
                placeholder="Enter your email address"
                placeholderTextColor="#9CA3AF"
                value={userEmail}
                onChangeText={setUserEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Message Input */}
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Your Message</Text>
              <TextInput
                className="bg-zinc-700 text-white p-3 rounded-xl min-h-[100px]"
                placeholder="Describe your issue or question..."
                placeholderTextColor="#9CA3AF"
                value={supportMessage}
                onChangeText={setSupportMessage}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity onPress={sendSupportEmail} disabled={isSubmitting} className="overflow-hidden rounded-xl">
              <LinearGradient
                colors={["#FACC15", "#F97316"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="p-4 flex-row items-center justify-center"
              >
                {isSubmitting ? (
                  <Text className="text-white font-bold">Sending...</Text>
                ) : (
                  <>
                    <Feather name="send" size={18} color="white" />
                    <Text className="text-white font-bold ml-2">Send Message</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View className="mt-4 p-3 bg-zinc-700 rounded-xl">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                <Text className="text-blue-400 font-semibold ml-2">Response Time</Text>
              </View>
              <Text className="text-gray-300 text-sm">
                We typically respond within 24 hours during business days. For urgent issues, please include "URGENT" in
                your message.
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Resources */}
        <View className="mb-8">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-2 uppercase tracking-wide">More Resources</Text>
          <View className="bg-zinc-800 rounded-2xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center py-4 px-4">
              <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                <Ionicons name="document-text-outline" size={20} color="#FACC15" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Privacy Policy</Text>
                <Text className="text-gray-400 text-sm">How we protect your data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="h-px bg-zinc-700 ml-14" />

            <TouchableOpacity className="flex-row items-center py-4 px-4">
              <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                <Ionicons name="shield-checkmark-outline" size={20} color="#FACC15" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Terms of Service</Text>
                <Text className="text-gray-400 text-sm">App usage guidelines</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="h-px bg-zinc-700 ml-14" />

            <TouchableOpacity className="flex-row items-center py-4 px-4">
              <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-4">
                <Ionicons name="star-outline" size={20} color="#FACC15" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Rate MealMate</Text>
                <Text className="text-gray-400 text-sm">Share your experience</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  )
}

export default HelpCenterScreen
