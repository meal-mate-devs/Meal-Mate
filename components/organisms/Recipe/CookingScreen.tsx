import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

  // Parse recipe from params
  const recipe = params.recipe ? JSON.parse(params.recipe as string) : null;

  const [currentStep, setCurrentStep] = useState(0);
  const [overallTime, setOverallTime] = useState(0);
  const [stepTime, setStepTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  const overallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start overall timer
    overallTimerRef.current = setInterval(() => {
      setOverallTime((prev) => prev + 1);
    }, 1000);

    // Start step timer
    stepTimerRef.current = setInterval(() => {
      setStepTime((prev) => prev + 1);
    }, 1000);

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
  }, []);

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
    if (currentStep < (recipe?.instructions?.length || 0) - 1) {
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

  if (!recipe) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg">No recipe data available</Text>
      </View>
    );
  }

  const totalSteps = recipe?.instructions?.length || 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

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

          <Text className="text-white text-lg font-bold flex-1 text-center mx-4" numberOfLines={1}>
            {recipe.title || 'Cooking Mode'}
          </Text>

          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-400 text-sm">
              Step {currentStep + 1} of {totalSteps}
            </Text>
            <Text className="text-gray-400 text-sm">{Math.round(progress)}%</Text>
          </View>
          <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <Animated.View
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
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
        <View className="flex-row justify-between">
          <View
            className="flex-1 mr-2 rounded-xl p-3"
            style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="time-outline" size={16} color="#FACC15" />
              <Text className="text-gray-400 text-xs ml-1">Overall Time</Text>
            </View>
            <Text className="text-white text-xl font-bold">{formatTime(overallTime)}</Text>
          </View>

          <View
            className="flex-1 ml-2 rounded-xl p-3"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="timer-outline" size={16} color="#3B82F6" />
              <Text className="text-gray-400 text-xs ml-1">Step Time</Text>
            </View>
            <Text className="text-white text-xl font-bold">{formatTime(stepTime)}</Text>
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
                {currentStep + 1}
              </Text>
            </View>
          </View>

          {/* Step Details */}
          <View
            className="rounded-2xl p-6 mb-6"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <View className="flex-row items-center mb-4">
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

            <Text className="text-white text-base leading-7">
              {typeof recipe.instructions[currentStep] === 'string'
                ? recipe.instructions[currentStep]
                : recipe.instructions[currentStep]?.instruction || 
                  recipe.instructions[currentStep]?.text ||
                  'No instruction available'}
            </Text>

            {/* Duration if available */}
            {recipe.instructions[currentStep]?.duration && (
              <View className="flex-row items-center mt-4 rounded-xl px-4 py-2.5 self-start" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                <Ionicons name="timer-outline" size={16} color="#FACC15" />
                <Text className="text-sm ml-2 font-semibold" style={{ color: '#FACC15' }}>
                  {recipe.instructions[currentStep].duration} minutes
                </Text>
              </View>
            )}
          </View>

          {/* Tips Section (if available) */}
          {recipe.instructions[currentStep]?.tips && (
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
              <Text className="text-gray-300 text-sm leading-6">{recipe.instructions[currentStep].tips}</Text>
            </View>
          )}

          {/* Legacy tips support */}
          {recipe.tips && recipe.tips[currentStep] && !recipe.instructions[currentStep]?.tips && (
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
              <Text className="text-gray-300 text-sm leading-6">{recipe.tips[currentStep]}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-4 pb-6" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="flex-row justify-between mb-3">
          <TouchableOpacity
            onPress={handlePreviousStep}
            disabled={currentStep === 0}
            className="flex-1 mr-2 rounded-xl py-4 flex-row items-center justify-center"
            style={{
              backgroundColor: currentStep === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: currentStep === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              opacity: currentStep === 0 ? 0.5 : 1,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold ml-2">Previous</Text>
          </TouchableOpacity>

          {isLastStep ? (
            <TouchableOpacity
              onPress={handleComplete}
              className="flex-1 ml-2 rounded-xl py-4 flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
                className="rounded-xl"
              />
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold ml-2">Complete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNextStep}
              className="flex-1 ml-2 rounded-xl py-4 flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FACC15', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
                className="rounded-xl"
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
        message={`Congratulations! You've successfully completed:\n\n"${recipe.title}"\n\nTotal cooking time: ${formatTime(overallTime)}`}
        confirmText="Done"
        onConfirm={handleCloseCompletionDialog}
        onClose={handleCloseCompletionDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
