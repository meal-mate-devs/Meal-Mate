"use client"

import { useAuthContext } from "@/context/authContext"
import { subscriptionService } from "@/lib/services/subscriptionService"
import type { PlanType, SubscriptionPlan } from "@/lib/types/subscription"
import { Ionicons } from "@expo/vector-icons"
import { useStripe } from "@stripe/stripe-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

const SubscriptionScreen: React.FC = () => {
  const router = useRouter()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const { profile, refreshProfile } = useAuthContext()

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly')
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])

  // Get subscription info from profile (comes from authContext)
  const isPro = profile?.isPro || false
  const subscriptionStatus = profile?.subscriptionStatus
  const subscriptionPlan = profile?.subscriptionPlan
  const subscriptionEndDate = profile?.subscriptionCurrentPeriodEnd

  // Premium features that users get with subscription
  const premiumFeatures = [
    { id: "1", name: "Read Aloud Recipes", icon: "volume-high" as const },
    { id: "2", name: "Ad-Free Experience", icon: "close-circle" as const },
    { id: "3", name: "Recipe Export (PDF/Image)", icon: "download" as const },
    { id: "4", name: "Unlimited Recipe Generation", icon: "infinite" as const },
    { id: "5", name: "Custom Weekly Meal Plans", icon: "calendar" as const },
    { id: "6", name: "Custom Monthly Meal Plans", icon: "calendar-outline" as const },
    { id: "7", name: "Advanced Nutrition Tracking", icon: "nutrition" as const },
    { id: "8", name: "Priority Customer Support", icon: "headset" as const },
  ]

  // Load available plans
  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoadingPlans(true)
      const plansResponse = await subscriptionService.getPlans()
      setAvailablePlans(plansResponse.plans)
    } catch (error) {
      console.error('Failed to load plans:', error)
      Alert.alert('Error', 'Failed to load subscription plans')
    } finally {
      setLoadingPlans(false)
    }
  }

  const handleSubscribe = async (planType: PlanType) => {
    if (loading) return

    try {
      setLoading(true)

      // Create subscription and get client secret
      const subscriptionData = await subscriptionService.createSubscription(planType)

      // Initialize payment sheet with subscription payment intent
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "MealMate",
        paymentIntentClientSecret: subscriptionData.clientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL: "mealmate://stripe-redirect",
      })

      if (initError) {
        Alert.alert("Error", initError.message)
        setLoading(false)
        return
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        console.log('Payment sheet error:', presentError)
        Alert.alert("Payment Canceled", presentError.message)
      } else {
        Alert.alert(
          "Success! 🎉",
          "Welcome to MealMate Premium! You now have access to all premium features.",
          [
            {
              text: "Great!",
              onPress: async () => {
                await refreshProfile()
                // Refresh the page to show updated subscription status
                await loadPlans()
              },
            },
          ]
        )
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      Alert.alert("Error", error?.message || "Failed to process subscription")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!profile?.subscriptionId) {
      Alert.alert("Error", "No active subscription found")
      return
    }

    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your premium subscription? You'll lose access to all premium features at the end of your billing period.",
      [
        {
          text: "Keep Subscription",
          style: "cancel",
        },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true)
              await subscriptionService.cancelSubscription(profile.subscriptionId!)
              
              Alert.alert(
                "Subscription Canceled",
                "Your subscription has been canceled. You'll continue to have access to premium features until the end of your billing period.",
                [
                  {
                    text: "OK",
                    onPress: async () => {
                      await refreshProfile()
                      await loadPlans()
                    },
                  },
                ]
              )
            } catch (error: any) {
              console.error('Cancel subscription error:', error)
              Alert.alert("Error", error?.message || "Failed to cancel subscription")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const getPlanInfo = (planType: PlanType) => {
    const plan = availablePlans.find(p => p.id === planType)
    if (plan) {
      return {
        name: plan.name,
        price: `$${plan.amount.toFixed(2)}`,
        interval: plan.interval,
      }
    }
    return {
      name: planType === 'monthly' ? 'Monthly Plan' : 'Yearly Plan',
      price: planType === 'monthly' ? '$9.99' : '$99.99',
      interval: planType === 'monthly' ? 'month' : 'year',
    }
  }

  const monthlyPlan = availablePlans.find(p => p.id === 'monthly')
  const yearlyPlan = availablePlans.find(p => p.id === 'yearly')

  if (loadingPlans) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FACC15" />
        <Text className="text-white mt-4">Loading plans...</Text>
      </View>
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
            <Text className="text-white text-xl font-bold">
              {isPro ? "My Subscription" : "Premium Plans"}
            </Text>
            <View className="w-6" />
          </View>
          <Text className="text-gray-400 text-center">
            {isPro ? "Manage your premium membership" : "Unlock all premium features"}
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ backgroundColor: '#000000', paddingBottom: 20 }}
        >
          {/* Current Subscription Status (for Pro users) */}
          {isPro && subscriptionStatus && (
            <View className="mb-6">
              <View className="overflow-hidden rounded-2xl">
                <LinearGradient
                  colors={["#8B5CF6", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-6"
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-white text-2xl font-bold">
                        {subscriptionPlan === 'yearly' ? 'Yearly' : 'Monthly'} Premium
                      </Text>
                      <Text className="text-white/80 text-sm mt-1">
                        Status: {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                      </Text>
                    </View>
                    <View className="bg-white/20 rounded-full px-3 py-1">
                      <Text className="text-white font-semibold text-sm uppercase">Active</Text>
                    </View>
                  </View>
                  {subscriptionEndDate && (
                    <View className="bg-white/10 rounded-xl p-4 mb-4">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-white/80">Renews On</Text>
                        <Text className="text-white font-semibold">
                          {new Date(
                            typeof subscriptionEndDate === 'number' 
                              ? subscriptionEndDate * 1000 
                              : subscriptionEndDate
                          ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                  )}
                  {/* Cancel Subscription Button */}
                  <TouchableOpacity
                    onPress={handleCancelSubscription}
                    className="bg-white/10 rounded-xl p-4 border border-white/20"
                    disabled={loading}
                  >
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="close-circle-outline" size={20} color="white" />
                      <Text className="text-white font-semibold ml-2">
                        {loading ? "Processing..." : "Cancel Subscription"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Hero Section (for non-Pro users) */}
          {!isPro && (
            <View className="mb-6">
              <View className="overflow-hidden rounded-3xl">
                <LinearGradient
                  colors={["#FACC15", "#F97316"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-6 items-center"
                >
                  <Ionicons name="sparkles" size={48} color="white" />
                  <Text className="text-white text-2xl font-bold mt-3 text-center">
                    Upgrade to Premium
                  </Text>
                  <Text className="text-white/90 text-center mt-2">
                    Get access to exclusive features and enhance your cooking experience
                  </Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Plan Selection (only for non-Pro users) */}
          {!isPro && (
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-4">Choose Your Plan</Text>

              {/* Yearly Plan */}
              {yearlyPlan && (
                <TouchableOpacity
                  onPress={() => setSelectedPlan('yearly')}
                  className="mb-4"
                  disabled={loading}
                >
                  <View className={`rounded-2xl overflow-hidden ${selectedPlan === 'yearly' ? 'border-2 border-yellow-500' : 'border border-zinc-700'}`}>
                    <View className="bg-yellow-500 py-1">
                      <Text className="text-black text-xs font-bold text-center uppercase">
                        Most Popular - Best Value
                      </Text>
                    </View>
                    <View className="bg-zinc-900 p-5">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-white text-xl font-bold">{yearlyPlan.name}</Text>
                            {selectedPlan === 'yearly' && (
                              <View className="ml-2 bg-yellow-500 rounded-full p-1">
                                <Ionicons name="checkmark" size={16} color="black" />
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-400 text-sm mt-1">$8.33/month</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-white text-3xl font-bold">${yearlyPlan.amount.toFixed(2)}</Text>
                          <Text className="text-gray-400 text-sm">per year</Text>
                        </View>
                      </View>
                      <View className="bg-green-500/20 rounded-lg px-3 py-2 mt-2">
                        <Text className="text-green-400 font-semibold text-center">
                          💰 Save $19.89 compared to monthly
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Monthly Plan */}
              {monthlyPlan && (
                <TouchableOpacity
                  onPress={() => setSelectedPlan('monthly')}
                  disabled={loading}
                >
                  <View className={`rounded-2xl overflow-hidden ${selectedPlan === 'monthly' ? 'border-2 border-yellow-500' : 'border border-zinc-700'}`}>
                    <View className="bg-zinc-900 p-5">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-white text-xl font-bold">{monthlyPlan.name}</Text>
                            {selectedPlan === 'monthly' && (
                              <View className="ml-2 bg-yellow-500 rounded-full p-1">
                                <Ionicons name="checkmark" size={16} color="black" />
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-400 text-sm mt-1">Billed monthly</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-white text-3xl font-bold">${monthlyPlan.amount.toFixed(2)}</Text>
                          <Text className="text-gray-400 text-sm">per month</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Premium Features */}
          <View className="mb-6">
            <Text className="text-white text-lg font-bold mb-4">Premium Features Included</Text>
            <View className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
              {premiumFeatures.map((feature, index) => (
                <View key={feature.id}>
                  <View className="flex-row items-center p-4">
                    <View className="w-10 h-10 rounded-full bg-yellow-500/20 items-center justify-center mr-4">
                      <Ionicons name={feature.icon} size={20} color="#FACC15" />
                    </View>
                    <Text className="text-white font-medium flex-1">{feature.name}</Text>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                  {index < premiumFeatures.length - 1 && (
                    <View className="h-px bg-zinc-800 ml-14" />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Subscribe Button (only for non-Pro users) */}
          {!isPro && (
            <TouchableOpacity
              onPress={() => handleSubscribe(selectedPlan)}
              className="mb-6 overflow-hidden rounded-2xl"
              disabled={loading}
            >
              <LinearGradient
                colors={["#FACC15", "#F97316"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="p-5 items-center"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Text className="text-black font-bold text-xl">
                      Subscribe to {getPlanInfo(selectedPlan).name}
                    </Text>
                    <Text className="text-black/80 text-sm mt-1">
                      {getPlanInfo(selectedPlan).price}/{getPlanInfo(selectedPlan).interval}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Benefits Comparison */}
          <View className="bg-zinc-900 rounded-2xl p-5 mb-6 border border-zinc-800">
            <Text className="text-white font-bold text-lg mb-4 text-center">
              Why Go Premium?
            </Text>
            <View className="flex gap-4">
              <View className="flex-row items-center">
                <Ionicons name="trending-up" size={20} color="#10B981" />
                <Text className="text-gray-300 ml-3 flex-1">
                  Generate unlimited recipes tailored to your preferences
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={20} color="#10B981" />
                <Text className="text-gray-300 ml-3 flex-1">
                  Custom meal plans to stay organized and healthy
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="remove-circle" size={20} color="#10B981" />
                <Text className="text-gray-300 ml-3 flex-1">
                  Enjoy an ad-free, distraction-free cooking experience
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="volume-high" size={20} color="#10B981" />
                <Text className="text-gray-300 ml-3 flex-1">
                  Hands-free cooking with read-aloud instructions
                </Text>
              </View>
            </View>
          </View>

          {/* Terms */}
          <Text className="text-gray-500 text-xs text-center px-4 mb-4">
            Cancel anytime. No commitments. Payment will be charged to your account. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
          </Text>

          {/* Support Link */}
          <TouchableOpacity
            onPress={() => router.push("/settings/help")}
            className="items-center mb-6"
          >
            <Text className="text-yellow-500 text-sm">
              Need help? Contact Support
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

export default SubscriptionScreen