"use client"
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import React, { useState } from "react"
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

// Mock favorite recipes data
const favoriteRecipes = [
  {
    id: "1",
    title: "Creamy Mushroom Risotto",
    author: "Chef Maria",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=500&h=300&fit=crop",
    rating: 4.8,
    prepTime: 35,
    servings: 4,
    difficulty: "Medium",
    category: "Dinner",
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
      "Continue until rice is creamy and tender (about 20 minutes).",
      "Stir in mushrooms, butter, and parmesan. Season and serve.",
    ],
  },
  {
    id: "2",
    title: "Chocolate Lava Cake",
    author: "Baker John",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&h=300&fit=crop",
    rating: 4.9,
    prepTime: 25,
    servings: 2,
    difficulty: "Easy",
    category: "Dessert",
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
  {
    id: "3",
    title: "Mediterranean Quinoa Bowl",
    author: "Chef Sofia",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=300&fit=crop",
    rating: 4.7,
    prepTime: 20,
    servings: 2,
    difficulty: "Easy",
    category: "Lunch",
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
  {
    id: "4",
    title: "Spicy Korean Bibimbap",
    author: "Chef Kim",
    image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=500&h=300&fit=crop",
    rating: 4.6,
    prepTime: 45,
    servings: 3,
    difficulty: "Medium",
    category: "Dinner",
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
]

const FavoritesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState(favoriteRecipes)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const filteredFavorites = favorites.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.author.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const removeFromFavorites = (recipeId: string) => {
    Alert.alert("Remove from Favorites", "Are you sure you want to remove this recipe from your favorites?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setFavorites(favorites.filter((recipe) => recipe.id !== recipeId))
        },
      },
    ])
  }

  const openRecipeDetails = (recipe: any) => {
    setSelectedRecipe(recipe)
    setIsModalVisible(true)
  }

  const startCooking = (recipe: any) => {
    Alert.alert("Start Cooking", `Ready to cook ${recipe.title}?`, [
        { text: "Cancel", style: "cancel" },
        {
            text: "Start Cooking",
            onPress: () => {
                // Navigate to CookingScreen with the recipe ID
                router.push(`/recipe/cooking?id=${recipe.id}`);
            },
        },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4 mt-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.push("/home")}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">My Favorites</Text>
          <View className="w-6" />
        </View>
        <Text className="text-gray-400 text-center mt-2">{favorites.length} saved recipes</Text>
      </View>

      {/* Search Bar */}
      <View className="bg-zinc-800 rounded-full flex-row items-center px-4 py-3 mb-4 mx-4">
        <Feather name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Search your favorites"
          className="ml-2 flex-1 text-white"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Favorites List */}
      <ScrollView className="flex-1 px-4">
        {filteredFavorites.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="heart-outline" size={64} color="#4B5563" />
            <Text className="text-gray-400 text-lg mt-4 text-center">
              {searchQuery ? "No recipes found" : "No favorite recipes yet"}
            </Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Start adding recipes to your favorites to see them here"}
            </Text>
          </View>
        ) : (
          filteredFavorites.map((recipe) => (
            <View key={recipe.id} className="bg-zinc-800 mb-4 rounded-3xl overflow-hidden">
              <TouchableOpacity onPress={() => openRecipeDetails(recipe)}>
                <Image source={{ uri: recipe.image }} className="w-full h-44" resizeMode="cover" />
                <View className="absolute top-3 right-3">
                  <TouchableOpacity
                    onPress={() => removeFromFavorites(recipe.id)}
                    className="bg-black/50 rounded-full p-2"
                  >
                    <Ionicons name="heart" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              <View className="p-4">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">{recipe.title}</Text>
                    <Text className="text-gray-400 font-medium">{recipe.author}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={16} color="#FACC15" />
                    <Text className="text-gray-300 ml-1">{recipe.rating}</Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 ml-1">{recipe.prepTime} min</Text>
                  </View>
                  <View className="flex-row items-center ml-4">
                    <Ionicons name="people-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 ml-1">{recipe.servings} servings</Text>
                  </View>
                  <View className="flex-row items-center ml-4">
                    <MaterialIcons name="signal-cellular-alt" size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 ml-1">{recipe.difficulty}</Text>
                  </View>
                </View>

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => startCooking(recipe)}
                    className="flex-1 overflow-hidden rounded-full"
                  >
                    <LinearGradient
                      colors={["#FACC15", "#F97316"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="py-3 px-4 flex-row items-center justify-center"
                    >
                      <Feather name="play" size={16} color="white" />
                      <Text className="text-white font-semibold ml-2">Start Cooking</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openRecipeDetails(recipe)}
                    className="bg-zinc-700 py-3 px-4 rounded-full flex-row items-center"
                  >
                    <Feather name="eye" size={16} color="white" />
                    <Text className="text-white font-semibold ml-2">View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Recipe Details Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <StatusBar barStyle="light-content" />

          {selectedRecipe && (
            <ScrollView className="flex-1">
              <View className="relative">
                <Image source={{ uri: selectedRecipe.image }} className="w-full h-64" resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  className="absolute top-12 left-4 bg-black/50 rounded-full p-2"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeFromFavorites(selectedRecipe.id)}
                  className="absolute top-12 right-4 bg-black/50 rounded-full p-2"
                >
                  <Ionicons name="heart" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View className="p-6">
                <Text className="text-white text-2xl font-bold mb-2">{selectedRecipe.title}</Text>
                <Text className="text-gray-400 text-lg mb-4">by {selectedRecipe.author}</Text>

                <View className="flex-row items-center mb-6">
                  <View className="flex-row items-center mr-6">
                    <Ionicons name="star" size={18} color="#FACC15" />
                    <Text className="text-white ml-1 font-semibold">{selectedRecipe.rating}</Text>
                  </View>
                  <View className="flex-row items-center mr-6">
                    <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                    <Text className="text-gray-300 ml-1">{selectedRecipe.prepTime} min</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="people-outline" size={18} color="#9CA3AF" />
                    <Text className="text-gray-300 ml-1">{selectedRecipe.servings} servings</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setIsModalVisible(false)
                    startCooking(selectedRecipe)
                  }}
                  className="overflow-hidden rounded-full mb-6"
                >
                  <LinearGradient
                    colors={["#FACC15", "#F97316"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-4 flex-row items-center justify-center"
                  >
                    <Feather name="play" size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">Start Cooking</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View className="mb-6">
                  <Text className="text-white text-xl font-bold mb-3">Ingredients</Text>
                  {selectedRecipe.ingredients.map((ingredient: string, index: number) => (
                    <View key={index} className="flex-row items-center mb-2">
                      <View className="w-2 h-2 bg-orange-500 rounded-full mr-3" />
                      <Text className="text-gray-300 flex-1">{ingredient}</Text>
                    </View>
                  ))}
                </View>

                <View>
                  <Text className="text-white text-xl font-bold mb-3">Instructions</Text>
                  {selectedRecipe.instructions.map((instruction: string, index: number) => (
                    <View key={index} className="flex-row mb-4">
                      <View className="bg-orange-500 rounded-full w-6 h-6 items-center justify-center mr-3 mt-1">
                        <Text className="text-white text-sm font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-gray-300 flex-1 leading-6">{instruction}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

export default FavoritesScreen
