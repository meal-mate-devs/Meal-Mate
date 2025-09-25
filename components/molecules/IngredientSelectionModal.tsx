import { IngredientItem } from "@/hooks/useIngredientScanner";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface IngredientSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  ingredients: IngredientItem[];
  onSelectIngredient: (ingredient: string) => void;
  isLoading?: boolean;
}

const { width } = Dimensions.get("window");

const IngredientSelectionModal: React.FC<IngredientSelectionModalProps> = ({
  visible,
  onClose,
  ingredients,
  onSelectIngredient,
  isLoading = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>("");
  const [spinAnimation] = useState(new Animated.Value(0));

  // Animate the spinner when loading
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnimation.setValue(0);
    }
  }, [isLoading]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset editing state when modal opens
      setIsEditing(false);
      setSelectedIngredient("");
      setEditedName("");
      
      // Debug log when modal becomes visible
      console.log("IngredientSelectionModal visible, ingredients:", 
        ingredients ? ingredients.length : 0,
        "isLoading:", isLoading);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, ingredients, isLoading]);

  const handleSelectIngredient = (ingredient: string) => {
    setSelectedIngredient(ingredient);
    setEditedName(ingredient);
    setIsEditing(true);
  };

  const handleConfirmSelection = () => {
    // Use the edited name if available, otherwise use selected ingredient
    const finalName = editedName.trim() || selectedIngredient;
    if (finalName) {
      onSelectIngredient(finalName);
      onClose();
    }
  };

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["#1F2937", "#111827"]}
            style={styles.dialogContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Detection Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["#FACC15", "#F97316"]}
                style={styles.iconBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <Animated.View style={{
                    transform: [{
                      rotate: spinAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"]
                      })
                    }]
                  }}>
                    <Ionicons name="scan-outline" size={32} color="white" />
                  </Animated.View>
                ) : (
                  <Ionicons name="search-outline" size={32} color="white" />
                )}
              </LinearGradient>
            </View>

            <Text style={styles.title}>
              {isEditing ? "Edit Ingredient" : "Detected Ingredients"}
            </Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FACC15" />
                <Text style={styles.loadingText}>Detecting ingredients...</Text>
              </View>
            ) : isEditing ? (
              // Edit mode
              <View style={styles.editContainer}>
                <Text style={styles.editLabel}>Refine the ingredient name:</Text>
                
                <View style={styles.editInputContainer}>
                  <View style={styles.ingredientIconContainer}>
                    <Ionicons name="create-outline" size={20} color="#FACC15" />
                  </View>
                  <TextInput
                    style={styles.editInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    autoFocus
                    selectTextOnFocus
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                
                <View style={styles.editButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.editBackButton} 
                    onPress={() => setIsEditing(false)}
                  >
                    <Ionicons name="arrow-back" size={16} color="#9CA3AF" />
                    <Text style={styles.editBackText}>Back</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={handleConfirmSelection}
                    disabled={!editedName.trim()}
                  >
                    <Text style={styles.confirmText}>Confirm</Text>
                    <Ionicons name="checkmark" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.message}>
                  {ingredients.length > 0
                    ? "Choose an ingredient or skip to enter manually"
                    : "Select an option below"}
                </Text>

                <ScrollView style={styles.ingredientList} contentContainerStyle={styles.ingredientListContent}>
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#FACC15" />
                      <Text style={styles.loadingText}>Detecting ingredients...</Text>
                    </View>
                  ) : ingredients.length > 0 ? (
                    ingredients.map((item, index) => (
                      <View
                        key={index}
                        style={styles.ingredientItem}
                      >
                        <View style={styles.ingredientIconContainer}>
                          <Ionicons name="nutrition-outline" size={20} color="#FACC15" />
                        </View>
                        <View style={styles.ingredientTextContainer}>
                          <Text style={styles.ingredientName}>{item.name}</Text>
                          {item.confidence && (
                            <Text style={styles.confidenceText}>
                              {Math.round(item.confidence * 100)}% confidence
                            </Text>
                          )}
                        </View>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => {
                              setSelectedIngredient(item.name);
                              setEditedName(item.name);
                              setIsEditing(true);
                            }}
                          >
                            <Ionicons name="create-outline" size={20} color="#FACC15" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => onSelectIngredient(item.name)}
                          >
                            <Ionicons name="checkmark" size={20} color="#22C55E" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.noIngredients}>
                      <Text style={styles.noIngredientsText}>
                        No ingredients detected.
                      </Text>
                    </View>
                  )}
                </ScrollView>
                
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Enter Manually</Text>
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.85,
    maxWidth: 340,
  },
  dialogContainer: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  iconContainer: {
    width: 90,
    height: 90,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 45,
    overflow: "hidden",
  },
  iconBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  ingredientList: {
    width: "100%",
    maxHeight: 250,
    marginBottom: 16,
  },
  ingredientListContent: {
    paddingVertical: 8,
  },
  ingredientItem: {
    height: 70,
    width: "100%",
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ingredientIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  ingredientTextContainer: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 2,
    textTransform: "capitalize",
  },
  confidenceText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  cancelButton: {
    height: 50,
    width: "100%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cancelText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  spinnerGradient: {
    flex: 1,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  // Edit mode styles
  editContainer: {
    width: "100%",
    paddingVertical: 16,
  },
  editLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  editInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  editInput: {
    flex: 1,
    color: "white",
    fontSize: 16,
    paddingVertical: 8,
    height: 40,
  },
  editButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  editBackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  editBackText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FACC15",
  },
  confirmText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  // New styles for action buttons
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  // Styles for no ingredients found
  noIngredients: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  noIngredientsText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 22,
  },
});

export default IngredientSelectionModal;