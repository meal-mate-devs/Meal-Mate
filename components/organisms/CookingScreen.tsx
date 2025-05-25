"use client"

import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import React, { useEffect, useState } from "react"
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native"

// Mock recipe data
const recipeData: { [key: string]: any } = {
  "1": {
    id: "1",
    title: "Creamy Mushroom Risotto",
    author: "Chef Maria",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=500&h=300&fit=crop",
    totalTime: 35,
    servings: 4,
    difficulty: "Medium",
    ingredients: [
      "1 cup Arborio rice",
      "4 cups vegetable broth",
      "1 lb mixed mushrooms",
      "1/2 cup white wine",
      "1/2 cup parmesan cheese",
      "2 tbsp butter",
      "1 onion, diced",
      "Fresh thyme",
    ],
    instructions: [
      "Heat the vegetable broth in a saucepan and keep warm.",
      "In a large pan, sauté mushrooms until golden. Set aside.",
      "In the same pan, cook onion until translucent.",
      "Add rice and stir for 2 minutes until lightly toasted.",
      "Add wine and stir until absorbed.",
      "Add warm broth one ladle at a time, stirring constantly.",
      "Stir in mushrooms, butter, and parmesan. Season and serve.",
    ],
  },
  "2": {
    id: "2",
    title: "Chocolate Lava Cake",
    author: "Baker John",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&h=300&fit=crop",
    totalTime: 25,
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "4 oz dark chocolate",
      "4 tbsp butter",
      "2 large eggs",
      "2 tbsp sugar",
      "2 tbsp flour",
      "Pinch of salt",
      "Butter for ramekins",
      "Vanilla ice cream",
    ],
    instructions: [
      "Preheat oven to 425°F (220°C).",
      "Butter two ramekins and dust with cocoa powder.",
      "Melt chocolate and butter in microwave or double boiler.",
      "Whisk eggs and sugar until thick and pale.",
      "Fold in melted chocolate mixture.",
      "Gently fold in flour and salt.",
      "Divide between ramekins and bake for 12-14 minutes.",
      "Let cool for 1 minute, then invert onto plates. Serve with ice cream.",
    ],
  },
  "3": {
    id: "3",
    title: "Mediterranean Quinoa Bowl",
    author: "Chef Sofia",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=300&fit=crop",
    totalTime: 20,
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "1 cup quinoa",
      "1 cucumber, diced",
      "1 cup cherry tomatoes",
      "1/2 red onion, sliced",
      "1/2 cup kalamata olives",
      "4 oz feta cheese",
      "1/4 cup olive oil",
      "2 tbsp lemon juice",
      "Fresh herbs (parsley, mint)",
    ],
    instructions: [
      "Cook quinoa according to package instructions and let cool.",
      "Dice cucumber and halve cherry tomatoes.",
      "Thinly slice red onion and crumble feta cheese.",
      "In a large bowl, combine quinoa with vegetables.",
      "Whisk olive oil, lemon juice, salt, and pepper for dressing.",
      "Pour dressing over quinoa mixture and toss.",
      "Top with feta cheese and fresh herbs.",
      "Serve chilled or at room temperature.",
    ],
  },
  "4": {
    id: "4",
    title: "Spicy Korean Bibimbap",
    author: "Chef Kim",
    image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=500&h=300&fit=crop",
    totalTime: 45,
    servings: 3,
    difficulty: "Medium",
    ingredients: [
      "2 cups cooked rice",
      "1 lb beef bulgogi",
      "1 carrot, julienned",
      "1 zucchini, julienned",
      "4 shiitake mushrooms",
      "2 cups spinach",
      "4 eggs",
      "Gochujang sauce",
      "Sesame oil",
    ],
    instructions: [
      "Prepare rice and keep warm.",
      "Marinate beef in bulgogi sauce for 30 minutes.",
      "Blanch spinach and season with sesame oil.",
      "Sauté each vegetable separately and season.",
      "Cook beef until caramelized.",
      "Fry eggs sunny-side up.",
      "Arrange rice in bowls, top with vegetables and beef.",
      "Top with fried egg and serve with gochujang.",
    ],
  },
}

const CookingScreen: React.FC = () => {
  const { id } = useLocalSearchParams() // Get the recipe ID from the route params

  // Fetch the recipe based on the ID
  const getRecipe = () => {
    if (id && recipeData[id as string]) {
      return recipeData[id as string]
    }
    // Fallback: Select a random recipe if no ID is provided
    const recipeIds = Object.keys(recipeData)
    const randomId = recipeIds[Math.floor(Math.random() * recipeIds.length)]
    return recipeData[randomId]
  }

  const recipe = getRecipe()
  const [currentStep, setCurrentStep] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0) // Single timer counting up
  const [showIngredients, setShowIngredients] = useState(false)
  const [isCookingComplete, setIsCookingComplete] = useState(false)

  // Single timer effect
  useEffect(() => {
    let interval: number | null = null

    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeElapsed((time) => time + 1)
      }, 1000) as unknown as number
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimeElapsed(0)
  }

  const nextStep = () => {
    if (currentStep < recipe.instructions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsCookingComplete(true)
      setIsTimerRunning(false)
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const exitCooking = () => {
    Alert.alert("Exit Cooking Mode", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Exit",
        style: "destructive",
        onPress: () => router.push('/recipe/favorites'),
      },
    ])
  }

  if (isCookingComplete) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-green-500 rounded-full p-6 mb-6">
            <Ionicons name="checkmark" size={48} color="white" />
          </View>
          <Text className="text-white text-3xl font-bold text-center mb-4">Cooking Complete!</Text>
          <Text className="text-gray-300 text-lg text-center mb-2">You've successfully made</Text>
          <Text className="text-orange-500 text-xl font-bold text-center mb-4">{recipe.title}</Text>
          <Text className="text-gray-400 text-center mb-8">Total cooking time: {formatTime(timeElapsed)}</Text>

          <Image source={{ uri: recipe.image }} className="w-64 h-40 rounded-2xl mb-8" resizeMode="cover" />

          <TouchableOpacity onPress={() => router.back()} className="overflow-hidden rounded-full w-full">
            <LinearGradient
              colors={["#FACC15", "#F97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-4 flex-row items-center justify-center"
            >
              <Feather name="home" size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Back to Recipes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const progress = ((currentStep + 1) / recipe.instructions.length) * 100

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={exitCooking}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Cooking Mode</Text>
          <TouchableOpacity onPress={() => setShowIngredients(!showIngredients)}>
            <MaterialIcons name="list-alt" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Text className="text-gray-300 text-center mb-2">{recipe.title}</Text>

        {/* Progress Bar */}
        <View className="bg-zinc-800 h-2 rounded-full mb-2">
          <View
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-gray-400 text-center text-sm">
          Step {currentStep + 1} of {recipe.instructions.length}
        </Text>
      </View>

      {showIngredients ? (
        /* Ingredients Panel */
        <ScrollView className="flex-1 px-4 py-6">
          <Text className="text-white text-xl font-bold mb-4">Ingredients Needed</Text>
          {recipe.ingredients.map((ingredient: string, index: number) => (
            <View key={index} className="flex-row items-center mb-3 bg-zinc-800 p-3 rounded-xl">
              <View className="w-3 h-3 bg-orange-500 rounded-full mr-3" />
              <Text className="text-gray-300 flex-1">{ingredient}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => setShowIngredients(false)} className="bg-zinc-700 py-3 rounded-full mt-4">
            <Text className="text-white text-center font-semibold">Back to Cooking</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Cooking Interface */
        <ScrollView className="flex-1 px-4 py-6">
          {/* Single Timer Display */}
          <View className="bg-zinc-800 rounded-3xl p-6 mb-6 items-center">
            <Text className="text-gray-400 text-sm mb-2">Cooking Time</Text>
            <Text className="text-white text-4xl font-bold mb-4">{formatTime(timeElapsed)}</Text>

            <View className="flex-row space-x-3">
              <TouchableOpacity onPress={toggleTimer} className="overflow-hidden rounded-full">
                <LinearGradient
                  colors={isTimerRunning ? ["#EF4444", "#DC2626"] : ["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3 px-6 flex-row items-center"
                >
                  <Feather name={isTimerRunning ? "pause" : "play"} size={16} color="white" />
                  <Text className="text-white font-semibold ml-2">{isTimerRunning ? "Pause" : "Start"}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={resetTimer}
                className="bg-zinc-700 py-3 px-6 rounded-full flex-row items-center"
              >
                <Feather name="rotate-ccw" size={16} color="white" />
                <Text className="text-white font-semibold ml-2">Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Step */}
          <View className="bg-zinc-800 rounded-3xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-orange-500 rounded-full w-8 h-8 items-center justify-center mr-3">
                <Text className="text-white font-bold">{currentStep + 1}</Text>
              </View>
              <Text className="text-white text-lg font-bold">Step {currentStep + 1}</Text>
            </View>

            <Text className="text-gray-300 text-lg leading-7">{recipe.instructions[currentStep]}</Text>
          </View>

          {/* Recipe Info */}
          <View className="bg-zinc-800 rounded-2xl p-4 mb-6">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 ml-1">Est. {recipe.totalTime} min</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 ml-1">{recipe.servings} servings</Text>
              </View>
              <View className="flex-row items-center">
                <MaterialIcons name="signal-cellular-alt" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 ml-1">{recipe.difficulty}</Text>
              </View>
            </View>
          </View>

          {/* Navigation */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={previousStep}
              disabled={currentStep === 0}
              className={`flex-1 py-4 rounded-full flex-row items-center justify-center ${
                currentStep === 0 ? "bg-zinc-700 opacity-50" : "bg-zinc-700"
              }`}
            >
              <Feather name="chevron-left" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={nextStep} className="flex-1 overflow-hidden rounded-full">
              <LinearGradient
                colors={["#FACC15", "#F97316"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 flex-row items-center justify-center"
              >
                <Text className="text-white font-semibold mr-2">
                  {currentStep === recipe.instructions.length - 1 ? "Complete" : "Next Step"}
                </Text>
                <Feather
                  name={currentStep === recipe.instructions.length - 1 ? "check" : "chevron-right"}
                  size={20}
                  color="white"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default CookingScreen
