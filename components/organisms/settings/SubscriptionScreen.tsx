"use client"

import { useAuthContext } from "@/context/authContext"
import { useLanguage } from "@/context/LanguageContext"
import { subscriptionService } from "@/lib/services/subscriptionService"
import type { PlanType, SubscriptionPlan } from "@/lib/types/subscription"
import { Ionicons } from "@expo/vector-icons"
import { useStripe } from "@stripe/stripe-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"
import Dialog from "../../atoms/Dialog"

const SubscriptionScreen: React.FC = () => {
  const router = useRouter()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const { profile, refreshProfile } = useAuthContext()
  const { t } = useLanguage()

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly')
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showCancelConfirmDialog, setShowCancelConfirmDialog] = useState(false)
  const [showCancelSuccessDialog, setShowCancelSuccessDialog] = useState(false)

  // Get subscription info from profile (comes from authContext)
  const isPro = profile?.isPro || false
  const subscriptionStatus = profile?.subscriptionStatus
  const subscriptionPlan = profile?.subscriptionPlan
  const subscriptionEndDate = profile?.subscriptionCurrentPeriodEnd

  // Premium features that users get with subscription
  const premiumFeatures = [
    { id: "1", name: t('subscription.readAloudRecipes'), icon: "volume-high" as const },
    { id: "2", name: t('subscription.adFreeExperience'), icon: "close-circle" as const },
    { id: "3", name: t('subscription.recipeExport'), icon: "download" as const },
    { id: "4", name: t('subscription.unlimitedRecipeGeneration'), icon: "infinite" as const },
    { id: "5", name: t('subscription.customWeeklyMealPlans'), icon: "calendar" as const },
    { id: "6", name: t('subscription.customMonthlyMealPlans'), icon: "calendar-outline" as const },
    { id: "7", name: t('subscription.advancedNutritionTracking'), icon: "nutrition" as const },
    { id: "8", name: t('subscription.priorityCustomerSupport'), icon: "headset" as const },
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
      console.log('Failed to load plans:', error)
      setErrorMessage(t('subscription.failedToLoadPlans'))
      setShowErrorDialog(true)
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
        setErrorMessage(initError.message)
        setShowErrorDialog(true)
        setLoading(false)
        return
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        console.log('Payment sheet error:', presentError)
        setErrorMessage(presentError.message)
        setShowErrorDialog(true)
      } else {
        // Payment successful - refresh user profile to get updated Pro status
        await refreshProfile()
        setShowSuccessDialog(true)
      }
    } catch (error: any) {
      console.log('Subscription error:', error)
      setErrorMessage(error?.message || t('subscription.failedToProcessSubscription'))
      setShowErrorDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!profile?.subscriptionId) {
      setErrorMessage(t('subscription.noActiveSubscriptionFound'))
      setShowErrorDialog(true)
      return
    }

    setShowCancelConfirmDialog(true)
  }

  const confirmCancelSubscription = async () => {
    setShowCancelConfirmDialog(false)
    try {
      setLoading(true)
      await subscriptionService.cancelSubscription(profile!.subscriptionId!)
      // Refresh profile to update Pro status
      await refreshProfile()
      setShowCancelSuccessDialog(true)
    } catch (error: any) {
      console.log('Cancel subscription error:', error)
      setErrorMessage(error?.message || t('subscription.failedToCancelSubscription'))
      setShowErrorDialog(true)
    } finally {
      setLoading(false)
    }
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
      name: planType === 'monthly' ? t('subscription.monthlyPlan') : t('subscription.yearlyPlan'),
      price: planType === 'monthly' ? '$9.99' : '$99.99',
      interval: planType === 'monthly' ? 'month' : 'year',
    }
  }

  const monthlyPlan = availablePlans.find(p => p.id === 'monthly')
  const yearlyPlan = availablePlans.find(p => p.id === 'yearly')

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

        {/* Header Skeleton */}
        <View style={{ paddingTop: 44, backgroundColor: "#000000" }} className="px-4 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="w-6 h-6 bg-zinc-800 rounded-full opacity-50" />
            <View className="w-32 h-6 bg-zinc-800 rounded opacity-50" />
            <View className="w-6" />
          </View>
          <View className="w-48 h-4 bg-zinc-800 rounded mx-auto mt-2 opacity-50" />
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Hero Skeleton */}
          <View className="mb-6">
            <View className="rounded-3xl bg-zinc-800 p-6 items-center opacity-50">
              <View className="w-12 h-12 bg-zinc-700 rounded-full mb-3" />
              <View className="w-48 h-6 bg-zinc-700 rounded mb-2" />
              <View className="w-64 h-4 bg-zinc-700 rounded" />
            </View>
          </View>

          {/* Plan Selection Skeleton */}
          <View className="mb-6">
            <View className="w-32 h-5 bg-zinc-800 rounded mb-4 opacity-50" />

            {/* Yearly Plan Skeleton */}
            <View className="mb-4">
              <View className="rounded-2xl overflow-hidden border border-zinc-700">
                <View className="bg-zinc-800 py-2 opacity-50">
                  <View className="w-48 h-3 bg-zinc-700 rounded mx-auto" />
                </View>
                <View className="bg-zinc-900 p-5">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <View className="w-32 h-6 bg-zinc-800 rounded mb-2 opacity-50" />
                      <View className="w-24 h-4 bg-zinc-800 rounded opacity-50" />
                    </View>
                    <View className="items-end">
                      <View className="w-20 h-8 bg-zinc-800 rounded mb-1 opacity-50" />
                      <View className="w-16 h-4 bg-zinc-800 rounded opacity-50" />
                    </View>
                  </View>
                  <View className="bg-zinc-800 rounded-lg px-3 py-3 mt-2 opacity-50">
                    <View className="w-48 h-4 bg-zinc-700 rounded mx-auto" />
                  </View>
                </View>
              </View>
            </View>

            {/* Monthly Plan Skeleton */}
            <View className="rounded-2xl overflow-hidden border border-zinc-700">
              <View className="bg-zinc-900 p-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="w-32 h-6 bg-zinc-800 rounded mb-2 opacity-50" />
                    <View className="w-24 h-4 bg-zinc-800 rounded opacity-50" />
                  </View>
                  <View className="items-end">
                    <View className="w-20 h-8 bg-zinc-800 rounded mb-1 opacity-50" />
                    <View className="w-16 h-4 bg-zinc-800 rounded opacity-50" />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Premium Features Skeleton */}
          <View className="mb-6">
            <View className="w-48 h-5 bg-zinc-800 rounded mb-4 opacity-50" />
            <View className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item, index) => (
                <View key={item}>
                  <View className="flex-row items-center p-4">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 mr-4 opacity-50" />
                    <View className="flex-1">
                      <View className="w-40 h-4 bg-zinc-800 rounded opacity-50" />
                    </View>
                    <View className="w-6 h-6 rounded-full bg-zinc-800 opacity-50" />
                  </View>
                  {index < 7 && <View className="h-px bg-zinc-800 ml-14" />}
                </View>
              ))}
            </View>
          </View>

          {/* Subscribe Button Skeleton */}
          <View className="mb-6 rounded-2xl bg-zinc-800 p-5 items-center opacity-50">
            <View className="w-48 h-6 bg-zinc-700 rounded mb-1" />
            <View className="w-24 h-4 bg-zinc-700 rounded" />
          </View>

          {/* Benefits Skeleton */}
          <View className="bg-zinc-900 rounded-2xl p-5 mb-6 border border-zinc-800">
            <View className="w-32 h-5 bg-zinc-800 rounded mb-4 mx-auto opacity-50" />
            <View className="flex gap-4">
              {[1, 2, 3, 4].map((item) => (
                <View key={item} className="flex-row items-center">
                  <View className="w-5 h-5 rounded-full bg-zinc-800 opacity-50" />
                  <View className="ml-3 flex-1">
                    <View className="w-full h-4 bg-zinc-800 rounded opacity-50" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )

  if (loadingPlans) {
    return <SkeletonLoader />
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
              {isPro ? t('subscription.mySubscription') : t('subscription.premiumPlans')}
            </Text>
            <View className="w-6" />
          </View>
          <Text className="text-gray-400 text-center">
            {isPro ? t('subscription.manageYourPremiumMembership') : t('subscription.unlockAllPremiumFeatures')}
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
                        {subscriptionPlan === 'yearly' ? t('subscription.yearlyPremium') : t('subscription.monthlyPremium')}
                      </Text>
                      <Text className="text-white/80 text-sm mt-1">
                        {t('subscription.status')}: {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                      </Text>
                    </View>
                    <View className="bg-white/20 rounded-full px-3 py-1">
                      <Text className="text-white font-semibold text-sm uppercase">{t('subscription.active')}</Text>
                    </View>
                  </View>
                  {subscriptionEndDate && (
                    <View className="bg-white/10 rounded-xl p-4 mb-4">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-white/80">{t('subscription.renewsOn')}</Text>
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
                        {loading ? t('subscription.processing') : t('subscription.cancelSubscription')}
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
                    {t('subscription.upgradeToPremium')}
                  </Text>
                  <Text className="text-white/90 text-center mt-2">
                    {t('subscription.getAccessToExclusiveFeatures')}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Plan Selection (only for non-Pro users) */}
          {!isPro && (
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-4">{t('subscription.chooseYourPlan')}</Text>

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
                        {t('subscription.mostPopularBestValue')}
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
                          <Text className="text-gray-400 text-sm mt-1">$8.33/{t('subscription.perMonth')}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-white text-3xl font-bold">${yearlyPlan.amount.toFixed(2)}</Text>
                          <Text className="text-gray-400 text-sm">{t('subscription.perYear')}</Text>
                        </View>
                      </View>
                      <View className="bg-green-500/20 rounded-lg px-3 py-2 mt-2">
                        <Text className="text-green-400 font-semibold text-center">
                          {t('subscription.saveComparedToMonthly')}
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
                          <Text className="text-gray-400 text-sm mt-1">{t('subscription.billedMonthly')}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-white text-3xl font-bold">${monthlyPlan.amount.toFixed(2)}</Text>
                          <Text className="text-gray-400 text-sm">{t('subscription.perMonth')}</Text>
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
            <Text className="text-white text-lg font-bold mb-4">{t('subscription.premiumFeaturesIncluded')}</Text>
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
                      {t('subscription.subscribeTo')} {getPlanInfo(selectedPlan).name}
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
              {t('subscription.whyGoPremium')}
            </Text>
            <View className="flex gap-4">
              <View className="flex-row items-center">
                <Ionicons name="trending-up" size={20} color="#10B981" />
                <Text className="text-gray-300 ml-3 flex-1">
                  {t('subscription.generateUnlimitedRecipes')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={20} color="#10B981" />
                <Text className="text-gray-300 ml-3 flex-1">
                  {t('subscription.customMealPlans')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="remove-circle" size={20} color="#10B981" />
                <Text className="text-gray-300 ml-3 flex-1">
                  {t('subscription.adFreeExperience')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="volume-high" size={20} color="#10B981" />
                <Text className="text-gray-300 ml-3 flex-1">
                  {t('subscription.handsFreeReadAloud')}
                </Text>
              </View>
            </View>
          </View>

          {/* Terms */}
          <Text className="text-gray-500 text-xs text-center px-4 mb-4">
            {t('subscription.termsText')}
          </Text>

          {/* Support Link */}
          <TouchableOpacity
            onPress={() => router.push("/settings/help")}
            className="items-center mb-6"
          >
            <Text className="text-yellow-500 text-sm">
              {t('subscription.needHelp')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Error Dialog */}
        <Dialog
          visible={showErrorDialog}
          type="error"
          title={t('subscription.error')}
          message={errorMessage}
          confirmText={t('common.ok')}
          onConfirm={() => setShowErrorDialog(false)}
          onClose={() => setShowErrorDialog(false)}
        />

        {/* Success Dialog */}
        <Dialog
          visible={showSuccessDialog}
          type="success"
          title={t('subscription.successTitle')}
          message={t('subscription.welcomeToPremium')}
          confirmText={t('subscription.great')}
          onConfirm={async () => {
            setShowSuccessDialog(false)
            await refreshProfile()
            await loadPlans()
          }}
          onClose={async () => {
            setShowSuccessDialog(false)
            await refreshProfile()
            await loadPlans()
          }}
        />

        {/* Cancel Confirmation Dialog */}
        <Dialog
          visible={showCancelConfirmDialog}
          type="warning"
          title={t('subscription.cancelSubscriptionTitle')}
          message={t('subscription.cancelSubscriptionMessage')}
          confirmText={t('subscription.cancelSubscriptionButton')}
          cancelText={t('subscription.keepSubscription')}
          showCancelButton={true}
          onConfirm={confirmCancelSubscription}
          onCancel={() => setShowCancelConfirmDialog(false)}
          onClose={() => setShowCancelConfirmDialog(false)}
        />

        {/* Cancel Success Dialog */}
        <Dialog
          visible={showCancelSuccessDialog}
          type="info"
          title={t('subscription.subscriptionCanceled')}
          message={t('subscription.subscriptionCanceledMessage')}
          confirmText={t('common.ok')}
          onConfirm={async () => {
            setShowCancelSuccessDialog(false)
            await refreshProfile()
            await loadPlans()
          }}
          onClose={async () => {
            setShowCancelSuccessDialog(false)
            await refreshProfile()
            await loadPlans()
          }}
        />
      </SafeAreaView>
    </View>
  )
}

export default SubscriptionScreen