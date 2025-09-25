import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Alert, Dimensions, Text, TouchableOpacity, View } from "react-native";
import { useIngredientScanner } from "../../hooks/useIngredientScanner";
import CustomDialog from "../atoms/CustomDialog";

interface IngredientScannerDialogProps {
  visible: boolean;
  onClose: () => void;
  onIngredientsDetected: (ingredients: string[]) => void;
  allowMultiple?: boolean;
}

const { width } = Dimensions.get("window");

export default function IngredientScannerDialog({
  visible,
  onClose,
  onIngredientsDetected,
  allowMultiple = true,
}: IngredientScannerDialogProps): React.ReactElement {
  const {
    detectedIngredients,
    detectedIngredientsWithConfidence,
    isScanning,
    scanProgress,
    scanWithCamera,
    scanFromGallery,
    addCustomIngredient,
    removeIngredient,
    resetIngredients,
  } = useIngredientScanner({
    onIngredientsDetected,
    allowMultiple,
    alertOnDuplicates: true,
    includeConfidence: true,
  });

  // Reset ingredients when dialog is closed
  useEffect(() => {
    if (!visible) {
      resetIngredients();
    }
  }, [visible]);

  const handleAddCustomIngredient = (): void => {
    Alert.prompt("Add Ingredient", "Enter ingredient name:", (text) => {
      if (text && text.trim()) {
        addCustomIngredient(text.trim());
      }
    });
  };

  const handleStartScan = (method: "camera" | "gallery"): void => {
    if (method === "camera") {
      scanWithCamera();
    } else {
      scanFromGallery();
    }
  };

  const handleConfirmIngredients = (): void => {
    onIngredientsDetected(detectedIngredients);
    onClose();
  };

  if (!visible) return <></>;

  return (
    <CustomDialog
      visible={visible}
      onClose={onClose}
      title="Scan Ingredients"
      height={detectedIngredients.length > 0 ? 600 : 500}
    >
      <View className="flex-1">
        <View className="mb-6">
          <Text className="text-white text-center text-lg">
            {detectedIngredients.length > 0
              ? `${detectedIngredients.length} ingredient${detectedIngredients.length !== 1 ? "s" : ""} detected`
              : "Capture or select an image of your ingredients"}
          </Text>
          <Text className="text-gray-400 text-center text-sm mt-1">
            {detectedIngredients.length > 0
              ? "You can add more ingredients or manually enter them"
              : "Our AI will identify the ingredients for you"}
          </Text>
        </View>

        {detectedIngredients.length > 0 ? (
          <View className="flex-1">
            <View className="flex-row flex-wrap justify-center mb-4">
              {detectedIngredientsWithConfidence.map((ingredient, index) => (
                <View key={index} className={`${ingredient.confidence ? 'bg-yellow-400' : 'bg-gray-500'} rounded-full px-3 py-2 m-1 flex-row items-center`}>
                  <Text className="text-black font-bold text-sm">{ingredient.name}</Text>
                  {ingredient.confidence !== undefined && (
                    <Text className="text-black text-xs ml-1">
                      {` (${(ingredient.confidence * 100).toFixed(1)}%)`}
                    </Text>
                  )}
                  <TouchableOpacity onPress={() => removeIngredient(ingredient.name)} className="ml-2">
                    <Ionicons name="close" size={16} color="#000000" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View className="mt-auto space-y-3">
              <View className="flex-row justify-between">
                <TouchableOpacity
                  className="flex-1 bg-zinc-700 rounded-xl py-3 mr-2"
                  onPress={() => handleStartScan("camera")}
                  disabled={isScanning}
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold ml-2">Take Photo</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-zinc-700 rounded-xl py-3 ml-2"
                  onPress={() => handleStartScan("gallery")}
                  disabled={isScanning}
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="images" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold ml-2">Gallery</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="bg-zinc-700 rounded-xl py-3"
                onPress={handleAddCustomIngredient}
                disabled={isScanning}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="create" size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold ml-2">Add Manually</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity className="rounded-xl overflow-hidden" onPress={handleConfirmIngredients} disabled={isScanning}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3"
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold ml-2">Confirm Ingredients</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-zinc-800 rounded-xl py-3"
                onPress={resetIngredients}
                disabled={isScanning || detectedIngredients.length === 0}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold ml-2">Reset</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center space-y-6">
            {isScanning ? (
              <View className="items-center">
                <View className="w-24 h-24 rounded-full bg-yellow-400 items-center justify-center mb-4">
                  <Ionicons name="scan" size={48} color="#000000" />
                </View>
                <Text className="text-white text-lg font-bold">Scanning...</Text>
                <View className="w-48 h-2 bg-zinc-700 rounded-full mt-4">
                  <View
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </View>
                <Text className="text-zinc-400 text-sm mt-2">{Math.round(scanProgress)}%</Text>
              </View>
            ) : (
              <>
                <View className="space-y-4 w-full">
                  <TouchableOpacity
                    className="flex-row items-center bg-zinc-800 rounded-xl p-4"
                    onPress={() => handleStartScan("camera")}
                  >
                    <View className="w-12 h-12 bg-yellow-400 rounded-full items-center justify-center mr-4">
                      <Ionicons name="camera" size={24} color="#000000" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg">Take Photo</Text>
                      <Text className="text-zinc-400 text-sm">Use camera to capture ingredients</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center bg-zinc-800 rounded-xl p-4"
                    onPress={() => handleStartScan("gallery")}
                  >
                    <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
                      <Ionicons name="images" size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg">Choose from Gallery</Text>
                      <Text className="text-zinc-400 text-sm">Select existing photo from your device</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center bg-zinc-800 rounded-xl p-4"
                    onPress={handleAddCustomIngredient}
                  >
                    <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mr-4">
                      <Ionicons name="create" size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg">Type Manually</Text>
                      <Text className="text-zinc-400 text-sm">Enter ingredient name manually</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </CustomDialog>
  );
}