import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Dialog from '../../atoms/Dialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthContext();

  const isPro = profile?.isPro && profile?.subscriptionStatus === 'active';

  // Parse recipe from params with useMemo to prevent re-parsing on every render
  const recipe = useMemo(() => {
    try {
      const recipeParam = params.recipe;

      if (typeof recipeParam === 'string' && recipeParam.trim()) {
        const parsed = JSON.parse(recipeParam);

        // Validate that we have the required recipe structure
        if (parsed && typeof parsed === 'object' && typeof parsed.title === 'string' && parsed.title.trim()) {
          // Ensure instructions is an array
          if (!Array.isArray(parsed.instructions)) {
            parsed.instructions = [];
          }
          // Ensure ingredients is an array
          if (!Array.isArray(parsed.ingredients)) {
            parsed.ingredients = [];
          }
          return parsed;
        }
      }
    } catch (error) {
      console.warn('❌ Failed to parse recipe data:', error);
    }
    return null;
  }, [params.recipe])

  const [currentStep, setCurrentStep] = useState(0);
  const [overallTime, setOverallTime] = useState(0);
  const [stepTime, setStepTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeakingInstruction, setIsSpeakingInstruction] = useState(false);
  const [isSpeakingIngredients, setIsSpeakingIngredients] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeDialogType, setUpgradeDialogType] = useState<'instruction' | 'ingredients'>('instruction');

  const overallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start overall timer only if not paused
    if (!isPaused) {
      overallTimerRef.current = setInterval(() => {
        setOverallTime((prev) => prev + 1);
      }, 1000);
    }

    // Start step timer only if not paused
    if (!isPaused) {
      stepTimerRef.current = setInterval(() => {
        setStepTime((prev) => prev + 1);
      }, 1000);
    }

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      if (overallTimerRef.current) clearInterval(overallTimerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [isPaused]);

  useEffect(() => {
    // Reset step timer when step changes
    setStepTime(0);
  }, [currentStep]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextStep = () => {
    const maxSteps = Array.isArray(recipe?.instructions) ? recipe.instructions.length : 0;
    if (currentStep < maxSteps - 1 && maxSteps > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Stop all timers
    if (overallTimerRef.current) clearInterval(overallTimerRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);

    setIsCompleted(true);
    setShowCompletionDialog(true);
  };

  const handleCloseCompletionDialog = () => {
    setShowCompletionDialog(false);
    router.back();
  };

  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  const handleSpeakInstruction = async () => {
    if (!isPro) {
      setUpgradeDialogType('instruction');
      setShowUpgradeDialog(true);
      return;
    }

    try {
      if (isSpeakingInstruction) {
        // Stop speaking
        await Speech.stop();
        setIsSpeakingInstruction(false);
      } else {
        // Stop any ongoing speech first
        await Speech.stop();
        setIsSpeakingIngredients(false);

        // Start speaking instruction
        setIsSpeakingInstruction(true);

        const textToSpeak = instructionText;

        await Speech.speak(textToSpeak, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
          onDone: () => setIsSpeakingInstruction(false),
          onStopped: () => setIsSpeakingInstruction(false),
          onError: () => setIsSpeakingInstruction(false),
        });
      }
    } catch (error) {
      console.error('Error with speech:', error);
      setIsSpeakingInstruction(false);
    }
  };

  const handleSpeakIngredients = async () => {
    if (!isPro) {
      setUpgradeDialogType('ingredients');
      setShowUpgradeDialog(true);
      return;
    }

    try {
      if (isSpeakingIngredients) {
        // Stop speaking
        await Speech.stop();
        setIsSpeakingIngredients(false);
      } else {
        // Stop any ongoing speech first
        await Speech.stop();
        setIsSpeakingInstruction(false);

        // Start speaking ingredients
        setIsSpeakingIngredients(true);

        // Build ingredients text
        const ingredientsArray = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
        let ingredientsText = 'Ingredients needed: ';

        if (ingredientsArray.length === 0) {
          ingredientsText += 'No ingredients listed.';
        } else {
          ingredientsText += ingredientsArray.map((ingredient: any, index: number) => {
            const ingredientText = ensureString(ingredient, '');
            return `${index + 1}. ${ingredientText}`;
          }).join('. ');
        }

        await Speech.speak(ingredientsText, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
          onDone: () => setIsSpeakingIngredients(false),
          onStopped: () => setIsSpeakingIngredients(false),
          onError: () => setIsSpeakingIngredients(false),
        });
      }
    } catch (error) {
      console.error('Error with speech:', error);
      setIsSpeakingIngredients(false);
    }
  };

  // Cleanup speech on unmount or step change
  useEffect(() => {
    return () => {
      Speech.stop();
      setIsSpeakingInstruction(false);
      setIsSpeakingIngredients(false);
    };
  }, [currentStep]);

  function ensureString(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) {
      return fallback;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? value : fallback;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toString();
    }
    if (Array.isArray(value)) {
      const parts = value
        .map((item) => ensureString(item, ''))
        .filter((part) => part.length > 0);
      if (parts.length > 0) {
        return parts.join(' ');
      }
      return fallback;
    }
    if (typeof value === 'object') {
      const possibleKeys = ['text', 'instruction', 'description', 'value', 'message', 'content'];
      for (const key of possibleKeys) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const innerValue = ensureString((value as Record<string, unknown>)[key], '');
          if (innerValue.length > 0) {
            return innerValue;
          }
        }
      }
    }
    return fallback;
  }

  const titleText = ensureString(recipe?.title, 'Cooking Mode');
  const completionTitleText = ensureString(recipe?.title, 'this recipe');

  const instructionText = useMemo(() => {
    const instruction = recipe?.instructions?.[currentStep];
    if (typeof instruction === 'string') {
      return ensureString(instruction, 'No instruction available');
    }
    if (instruction && typeof instruction === 'object') {
      const candidate =
        (instruction as Record<string, unknown>).instruction ??
        (instruction as Record<string, unknown>).text ??
        (instruction as Record<string, unknown>).description;
      const resolved = ensureString(candidate, '');
      if (resolved.length > 0) {
        return resolved;
      }
    }
    return 'No instruction available';
  }, [recipe, currentStep]);

  const instructionTipText = useMemo(() => {
    const tips = recipe?.instructions?.[currentStep]?.tips;
    if (tips === null || tips === undefined) {
      return '';
    }
    if (typeof tips === 'string' || typeof tips === 'number') {
      return ensureString(tips, '');
    }
    if (Array.isArray(tips)) {
      const joined = tips
        .map((tip) => ensureString(tip, ''))
        .filter((tip) => tip.length > 0)
        .join(' ')
        .trim();
      return joined;
    }
    if (typeof tips === 'object') {
      const resolved = ensureString(tips, '');
      if (resolved.length > 0) {
        return resolved;
      }
    }
    return '';
  }, [recipe, currentStep]);

  const legacyTipText = useMemo(() => {
    const tipsCollection = recipe?.tips;
    if (!Array.isArray(tipsCollection)) {
      return '';
    }
    const legacyTip = tipsCollection[currentStep];
    return ensureString(legacyTip, '');
  }, [recipe, currentStep]);

  const hasInstructionTip = instructionTipText.length > 0;
  const hasLegacyTip = !hasInstructionTip && legacyTipText.length > 0;

  if (!recipe) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg">No recipe data available</Text>
      </View>
    );
  }

  const totalSteps = Array.isArray(recipe?.instructions) ? recipe.instructions.length : 0;
  const isLastStep = totalSteps > 0 ? currentStep === totalSteps - 1 : true;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#121212']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 10, borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}
        className="px-4 pb-4 border-b"
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-white text-lg font-bold flex-1 text-center mx-4 mt-2" numberOfLines={2}>
            {titleText}
          </Text>

          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-400 text-sm">
              {`Step ${Math.max(1, currentStep + 1)} of ${Math.max(1, totalSteps)}`}
            </Text>
            <Text className="text-gray-400 text-sm">{`${Math.round(Math.max(0, Math.min(100, progress)))}%`}</Text>
          </View>
          <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <Animated.View
              className="h-full rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, progress))}%`,
              }}
            >
              <LinearGradient
                colors={['#FACC15', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-full w-full"
              />
            </Animated.View>
          </View>
        </View>

        {/* Timers */}
        <View className="flex-row justify-between items-center">
          <View
            className="flex-1 mr-3 rounded-xl p-3"
            style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="time-outline" size={16} color="#FACC15" />
              <Text className="text-gray-400 text-xs ml-1">Overall Time</Text>
              {isPaused && (
                <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <Text className="text-red-400 text-xs font-bold">PAUSED</Text>
                </View>
              )}
            </View>
            <Text className="text-white text-xl font-bold">{`${formatTime(Math.max(0, overallTime))}`}</Text>
          </View>

          <View
            className="flex-1 ml-3 rounded-xl p-3"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="timer-outline" size={16} color="#3B82F6" />
              <Text className="text-gray-400 text-xs ml-1">Step Time</Text>
              {isPaused && (
                <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <Text className="text-red-400 text-xs font-bold">PAUSED</Text>
                </View>
              )}
            </View>
            <Text className="text-white text-xl font-bold">{`${formatTime(Math.max(0, stepTime))}`}</Text>
          </View>
        </View>
      </View>

      {/* Step Content */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="py-6"
        >
          {/* Step Number Badge */}
          <View className="items-center mb-6">
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 2, borderColor: 'rgba(250, 204, 21, 0.5)' }}
            >
              <Text className="text-4xl font-bold" style={{ color: '#FACC15' }}>
                {`${Math.max(1, currentStep + 1)}`}
              </Text>
            </View>
          </View>

          {/* Step Details */}
          <View
            className="rounded-2xl p-6 mb-6"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <View className="flex-row items-center mb-4 justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}
                >
                  <Ionicons name="restaurant-outline" size={20} color="#FACC15" />
                </View>
                <Text className="text-lg font-bold" style={{ color: '#FACC15' }}>
                  INSTRUCTION
                </Text>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={handleSpeakInstruction}
                  className="h-10 px-3 rounded-full items-center justify-center mr-2"
                  style={{
                    backgroundColor: isSpeakingInstruction ? 'rgba(239, 68, 68, 0.15)' : isPro ? 'rgba(59, 130, 246, 0.15)' : 'rgba(107, 114, 128, 0.1)',
                    borderWidth: 2,
                    borderColor: isSpeakingInstruction ? 'rgba(239, 68, 68, 0.4)' : isPro ? 'rgba(59, 130, 246, 0.4)' : 'rgba(107, 114, 128, 0.3)',
                    opacity: isPro ? 1 : 0.7,
                  }}
                  activeOpacity={0.8}
                >
                  <View className="relative">
                    <Ionicons
                      name={isSpeakingInstruction ? "stop" : "volume-high"}
                      size={18}
                      color={isSpeakingInstruction ? "#EF4444" : "#3B82F6"}
                    />
                    {!isPro && (
                      <View className="absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full px-1" style={{ minWidth: 20, height: 12 }}>
                        <Text className="text-black text-xs font-bold" style={{ fontSize: 8, lineHeight: 12 }}>PRO</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePauseResume}
                  className="h-10 px-4 rounded-full items-center justify-center flex-row"
                  style={{
                    backgroundColor: isPaused ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    borderWidth: 2,
                    borderColor: isPaused ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isPaused ? "play" : "pause"}
                    size={16}
                    color={isPaused ? "#22C55E" : "#EF4444"}
                  />
                  <Text className="text-sm font-bold ml-2" style={{ color: isPaused ? "#22C55E" : "#EF4444" }}>
                    {isPaused ? "RESUME" : "PAUSE"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text className="text-white text-base leading-7">{instructionText}</Text>

            {/* Duration if available */}
            {(() => {
              const duration = recipe?.instructions?.[currentStep]?.duration;
              const hasDuration = duration !== null && duration !== undefined && duration !== '' && duration !== 0;

              if (!hasDuration) return null;

              let durationText = '';
              if (typeof duration === 'number' && duration > 0) {
                durationText = `${duration} minutes`;
              } else if (typeof duration === 'string' && duration.trim().length > 0) {
                durationText = duration;
              } else {
                return null;
              }

              return (
                <View className="flex-row items-center mt-4 rounded-xl px-4 py-2.5 self-start" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                  <Ionicons name="timer-outline" size={16} color="#FACC15" />
                  <Text className="text-sm ml-2 font-semibold" style={{ color: '#FACC15' }}>
                    {durationText}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Tips Section (if available) */}
          {hasInstructionTip && (
            <View
              className="rounded-2xl p-6 mb-6"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="bulb-outline" size={18} color="#3B82F6" />
                <Text className="text-sm font-bold ml-2" style={{ color: '#3B82F6' }}>
                  TIP
                </Text>
              </View>
              <Text className="text-gray-300 text-sm leading-6">{instructionTipText}</Text>
            </View>
          )}

          {/* Legacy tips support */}
          {hasLegacyTip && (
            <View
              className="rounded-2xl p-6 mb-6"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="bulb-outline" size={18} color="#3B82F6" />
                <Text className="text-sm font-bold ml-2" style={{ color: '#3B82F6' }}>
                  TIP
                </Text>
              </View>
              <Text className="text-gray-300 text-sm leading-6">{legacyTipText}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-4 pb-6" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="flex-row justify-between mb-3">
          <TouchableOpacity
            onPress={handlePreviousStep}
            disabled={currentStep === 0 || isPaused}
            className="flex-1 mr-2 rounded-xl py-4 flex-row items-center justify-center"
            style={{
              backgroundColor: (currentStep === 0 || isPaused) ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: (currentStep === 0 || isPaused) ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              opacity: (currentStep === 0 || isPaused) ? 0.5 : 1,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold ml-2">Previous</Text>
          </TouchableOpacity>

          {isLastStep ? (
            <TouchableOpacity
              onPress={handleComplete}
              disabled={isPaused}
              className="flex-1 ml-2 rounded-xl py-4 flex-row items-center justify-center"
              style={{
                opacity: isPaused ? 0.5 : 1,
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={isPaused ? ['#6B7280', '#4B5563'] : ['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 12,
                }}
              />
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold ml-2">Complete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNextStep}
              disabled={isPaused}
              className="flex-1 ml-2 rounded-xl py-4 flex-row items-center justify-center"
              style={{
                opacity: isPaused ? 0.5 : 1,
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={isPaused ? ['#6B7280', '#4B5563'] : ['#FACC15', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 12,
                }}
              />
              <Text className="text-white font-bold mr-2">Next Step</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Completion Dialog */}
      <Dialog
        visible={showCompletionDialog}
        type="success"
        title="Recipe Completed! 🎉"
        message={
          <Text style={{ textAlign: 'center', color: 'white', fontSize: 15, lineHeight: 24 }}>
            <Text>Congratulations! You've successfully completed:{'\n\n'}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{completionTitleText}</Text>
            <Text>{'\n\n'}Total cooking time: </Text>
            <Text style={{ fontWeight: '600' }}>{formatTime(overallTime)} {'\n'}</Text>
          </Text>
        }
        confirmText="Done"
        onConfirm={handleCloseCompletionDialog}
        onClose={handleCloseCompletionDialog}
      />

      {/* Upgrade to Pro Dialog */}
      <Dialog
        visible={showUpgradeDialog}
        type="warning"
        title="🎙️ Premium Feature"
        message={`Text-to-speech for ${upgradeDialogType === 'instruction' ? 'cooking instructions' : 'ingredients'} is a premium feature. Upgrade to Pro to listen to your recipes hands-free!`}
        confirmText="Upgrade to Pro"
        cancelText="Cancel"
        showCancelButton={true}
        onConfirm={() => {
          setShowUpgradeDialog(false);
          router.push('/settings/subscription');
        }}
        onCancel={() => setShowUpgradeDialog(false)}
        onClose={() => setShowUpgradeDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
