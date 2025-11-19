import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ingredientDetectionService } from "../../lib/services/ingredientDetectionService";
import { IngredientWithConfidence } from "../../lib/types/ingredientDetection";
import Dialog from "../atoms/Dialog";

interface IngredientSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onIngredientsSelected: (ingredients: string[]) => void;
}

interface IngredientItem {
  name: string;
  confidence?: number;
}

const { width } = Dimensions.get("window");

export default function IngredientSearchModal({
  visible,
  onClose,
  onIngredientsSelected
}: IngredientSearchModalProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'info'>('error');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  // Helper function to show dialog
  const showCustomDialog = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setDialogType(type);
    setDialogTitle(title);
    setDialogMessage(message);
    setShowDialog(true);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedIngredients([]);
      setManualInput('');
      setShowManualInput(false);
    }
  }, [visible]);

  const addIngredient = (ingredient: string | IngredientWithConfidence) => {
    // Parse the ingredient into our common format
    const ingredientItem: IngredientItem = typeof ingredient === 'string'
      ? { name: ingredient, confidence: undefined }
      : { name: ingredient.name, confidence: ingredient.confidence };

    // Sanitize the name to ensure it's a safe string
    if (!ingredientItem.name || typeof ingredientItem.name !== 'string') {
      console.warn('Attempted to add ingredient with invalid name:', ingredient);
      return;
    }

    // Trim whitespace and ensure it's not empty
    ingredientItem.name = ingredientItem.name.trim();
    if (ingredientItem.name === '') {
      console.warn('Attempted to add ingredient with empty name after trimming');
      return;
    }

    // Don't add duplicates
    if (!selectedIngredients.some(item => item.name === ingredientItem.name)) {
      setSelectedIngredients(prev => [...prev, ingredientItem]);
    } else {
      showCustomDialog('warning', 'Already Added', `${ingredientItem.name || 'This ingredient'} is already in your list`);
    }
  };

  const handleAddManually = () => {
    setShowManualInput(prev => !prev);
    if (showManualInput) {
      // If we're closing manual input, clear the text
      setManualInput('');
    }
  };

  const handleManualInputSubmit = () => {
    if (manualInput.trim()) {
      addIngredient(manualInput.trim());
      setManualInput('');
      setShowManualInput(false);
    }
  };

  const handleManualInputCancel = () => {
    setManualInput('');
    setShowManualInput(false);
  };

  const removeIngredient = (ingredient: IngredientItem) => {
    setSelectedIngredients(prev => prev.filter(i => i.name !== ingredient.name));
  };

  const handleConfirm = () => {
    // Extract just the names for the callback
    const ingredientNames = selectedIngredients.map(item => item.name);
    onIngredientsSelected(ingredientNames);
    onClose();
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        showCustomDialog('warning', 'Permission Required', 'Camera permission is needed to take photos of ingredients.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error taking picture:", error);
      showCustomDialog('error', 'Error', 'Failed to take picture. Please try again.');
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        showCustomDialog('warning', 'Permission Required', 'Gallery permission is needed to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error selecting from gallery:", error);
      showCustomDialog('error', 'Error', 'Failed to select from gallery. Please try again.');
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      setIsScanning(true);
      setScanProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      const result = await ingredientDetectionService.detectIngredientsFromImage(imageUri, {
        includeConfidence: true,
      });

      // Log the API response for debugging
      console.log("API Response:", JSON.stringify(result));
      clearInterval(progressInterval);
      setScanProgress(100);

      if (result.detectedIngredients && result.detectedIngredients.length > 0) {
        // Process ingredients and their confidence values
        const processedIngredients: IngredientItem[] = result.detectedIngredients.map(item => {
          if (typeof item === 'string') {
            // If we only got a string without confidence, leave confidence undefined
            return { name: item };
          } else if ('name' in item && 'confidence' in item) {
            // Use the exact confidence value from the API
            return { name: item.name, confidence: item.confidence };
          }
          return { name: String(item) }; // No default confidence
        });

        // Filter out duplicates
        const newIngredients = processedIngredients.filter(newItem =>
          !selectedIngredients.some(existingItem => existingItem.name === newItem.name)
        );

        if (newIngredients.length > 0) {
          setSelectedIngredients(prev => [...prev, ...newIngredients]);
          showCustomDialog('success', 'Ingredients Detected', `Found ${newIngredients.length} new ingredient${newIngredients.length !== 1 ? 's' : ''} with confidence values.`);
        } else {
          showCustomDialog('info', 'No New Ingredients', 'No new ingredients were detected or they\'re already in your list.');
        }
      } else {
        showCustomDialog('warning', 'No Ingredients Detected', 'Try taking a clearer picture of your ingredients.');
      }
    } catch (error) {
      console.log("Error processing image:", error);
      
      // Check for timeout/network errors
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : "Failed to process image.";
      
      if (errorMessage.includes('timeout') || errorMessage.includes('connection') || errorMessage.includes('network') || errorMessage.includes('Request Timeout')) {
        showCustomDialog('error', 'Request Failed', 'Unable to analyze the image. Please check your connection and try again.');
      } else {
        showCustomDialog('error', 'Error', 'Failed to process image. Please try again.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Ingredients</Text>
            <Text style={styles.subtitle}>
              {isScanning ? "Scanning image..." : "Choose how to add ingredients"}
            </Text>
          </View>

          {/* Content */}
          {isScanning ? (
            <View style={styles.scanningContainer}>
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={["rgba(250, 204, 21, 0.2)", "rgba(250, 204, 21, 0.05)"]}
                  style={styles.iconGradient}
                />
                <Ionicons name="scan" size={32} color="#FACC15" />
              </View>
              <Text style={styles.scanningText}>Analyzing image...</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[styles.progressBar, { width: `${scanProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(scanProgress || 0)}%</Text>
            </View>
          ) : (
            <>
              {/* Selected ingredients */}
              {selectedIngredients.length > 0 && (
                <View style={styles.selectedContainer}>
                  <Text style={styles.sectionTitle}>
                    Ingredients ({selectedIngredients.length || 0})
                  </Text>
                  <ScrollView
                    style={styles.selectedList}
                    contentContainerStyle={styles.selectedListContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {selectedIngredients.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientItem}>
                        <View style={styles.ingredientTextContainer}>
                          <Text style={styles.ingredientName} numberOfLines={1} ellipsizeMode="tail">
                            {typeof ingredient.name === 'string' ? ingredient.name : 'Unknown Ingredient'}
                          </Text>
                        </View>

                        <View style={[
                          styles.confidenceContainer,
                          ingredient.confidence === undefined ? styles.manualConfidenceContainer : null
                        ]}>
                          <Text style={[
                            styles.confidenceText,
                            ingredient.confidence === undefined ? styles.manualConfidenceText : null
                          ]}>
                            {ingredient.confidence !== undefined && ingredient.confidence !== null
                              ? `${(ingredient.confidence * 100).toFixed(1)}%`
                              : 'Manual'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => removeIngredient(ingredient)}
                          style={styles.deleteButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#FF4D4F" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Manual Input Section */}
              {showManualInput && (
                <View style={styles.manualInputContainer}>
                  <Text style={styles.manualInputTitle}>Add Ingredient Manually</Text>
                  <View style={styles.manualInputField}>
                    <TextInput
                      style={styles.manualInputText}
                      placeholder="Enter ingredient name..."
                      placeholderTextColor="#666"
                      value={manualInput}
                      onChangeText={setManualInput}
                      autoCapitalize="words"
                      autoFocus={true}
                      onSubmitEditing={handleManualInputSubmit}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              )}

              {/* Options */}
              <View style={styles.optionsContainer}>
                <Text style={styles.sectionTitle}>
                  Add Ingredients
                </Text>
                <View style={styles.optionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.optionButton, showManualInput && styles.disabledButton]}
                    onPress={handleCamera}
                    disabled={showManualInput}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: "rgba(250, 204, 21, 0.2)" }]}>
                      <Ionicons name="camera" size={22} color="#FACC15" />
                    </View>
                    <Text style={[styles.optionText, showManualInput && styles.disabledText]}>Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, showManualInput && styles.disabledButton]}
                    onPress={handleGallery}
                    disabled={showManualInput}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}>
                      <Ionicons name="images" size={22} color="#3B82F6" />
                    </View>
                    <Text style={[styles.optionText, showManualInput && styles.disabledText]}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleAddManually}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: showManualInput ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.2)" }]}>
                      <Ionicons name="create" size={22} color="#10B981" />
                    </View>
                    <Text style={[styles.optionText, showManualInput && styles.activeTypeText]}>Type</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            {!isScanning && (
              <>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={showManualInput ? handleManualInputSubmit : handleConfirm}
                  disabled={showManualInput ? !manualInput.trim() : selectedIngredients.length === 0}
                >
                  <LinearGradient
                    colors={["#10B981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.confirmButtonGradient,
                    (showManualInput ? !manualInput.trim() : selectedIngredients.length === 0) && styles.disabledButton
                    ]}
                  >
                    <Text style={styles.confirmText}>
                      {showManualInput ? 'Add Ingredient' : 'Confirm'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={showManualInput ? handleManualInputCancel : onClose}
                >
                  <Text style={styles.cancelText}>
                    {showManualInput ? 'Cancel' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
    {/* Custom Dialog */}
    <Dialog
      visible={showDialog}
      type={dialogType}
      title={dialogTitle}
      message={dialogMessage}
      onClose={() => setShowDialog(false)}
      confirmText="OK"
    />
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: width * 0.9,
    maxWidth: 340,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  scanningContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  iconGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FACC15',
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  selectedContainer: {
    paddingTop: 16,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 14,
  },
  selectedList: {
    maxHeight: 240,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    padding: 8,
  },
  selectedListContent: {
    flexDirection: 'column',
    paddingBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FACC15',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ingredientTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  confidenceContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    minWidth: 60,
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 12,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FACC15',
  },
  manualConfidenceContainer: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  manualConfidenceText: {
    color: '#9CA3AF',
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 79, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 79, 0.25)',
  },
  optionsContainer: {
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  optionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  optionButton: {
    alignItems: 'center',
    width: '30%',
  },
  optionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    color: 'white',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  cancelText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  manualInputContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: -22,
  },
  manualInputTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 14,
  },
  manualInputField: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  manualInputText: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  activeTypeText: {
    fontWeight: 'bold',
    color: '#10B981',
  },
});