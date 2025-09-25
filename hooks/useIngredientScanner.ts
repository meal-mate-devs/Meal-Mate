import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native";
import { ingredientDetectionService } from "../lib/services/ingredientDetectionService";

// Define ingredient type that can include confidence
export interface IngredientItem {
  name: string;
  confidence?: number;
}

interface UseIngredientScannerOptions {
  /**
   * Callback for when ingredients are detected
   */
  onIngredientsDetected?: (ingredients: string[]) => void;
  
  /**
   * Whether to allow multiple ingredients detection
   */
  allowMultiple?: boolean;
  
  /**
   * Whether to show an alert when duplicate ingredients are detected
   */
  alertOnDuplicates?: boolean;
  
  /**
   * Whether to include confidence values
   */
  includeConfidence?: boolean;
}

interface UseIngredientScannerResult {
  /**
   * Detected ingredients
   */
  detectedIngredients: string[];
  
  /**
   * Detected ingredients with confidence values
   */
  detectedIngredientsWithConfidence: IngredientItem[];
  
  /**
   * Whether ingredients are currently being scanned
   */
  isScanning: boolean;
  
  /**
   * Progress of the scanning (0-100)
   */
  scanProgress: number;
  
  /**
   * Set detected ingredients
   */
  setDetectedIngredients: React.Dispatch<React.SetStateAction<string[]>>;
  
  /**
   * Set detected ingredients with confidence
   */
  setDetectedIngredientsWithConfidence: React.Dispatch<React.SetStateAction<IngredientItem[]>>;
  
  /**
   * Launch the camera to scan an ingredient
   */
  scanWithCamera: () => Promise<void>;
  
  /**
   * Launch the image picker to scan an ingredient
   */
  scanFromGallery: () => Promise<void>;
  
  /**
   * Process an image from a URI
   */
  processImage: (imageUri: string) => Promise<void>;
  
  /**
   * Add a custom ingredient
   */
  addCustomIngredient: (ingredient: string) => void;
  
  /**
   * Remove an ingredient
   */
  removeIngredient: (ingredient: string) => void;
  
  /**
   * Reset detected ingredients
   */
  resetIngredients: () => void;
}

/**
 * Hook to handle ingredient scanning functionality
 */
export function useIngredientScanner(options: UseIngredientScannerOptions = {}): UseIngredientScannerResult {
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [detectedIngredientsWithConfidence, setDetectedIngredientsWithConfidence] = useState<IngredientItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  /**
   * Check if camera permissions are granted
   */
  const checkCameraPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Please enable camera access to scan ingredients",
        [{ text: "OK" }]
      );
      return false;
    }
    
    return true;
  };

  /**
   * Check if media library permissions are granted
   */
  const checkMediaLibraryPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert(
        "Gallery Permission Required",
        "Please enable gallery access to select images",
        [{ text: "OK" }]
      );
      return false;
    }
    
    return true;
  };

  /**
   * Launch the camera to scan an ingredient
   */
  const scanWithCamera = async (): Promise<void> => {
    if (!(await checkCameraPermissions())) {
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture.");
    }
  };

  /**
   * Launch the image picker to scan an ingredient
   */
  const scanFromGallery = async (): Promise<void> => {
    if (!(await checkMediaLibraryPermissions())) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error selecting image from gallery:", error);
      Alert.alert("Error", "Failed to select image from gallery.");
    }
  };

  /**
   * Process an image from a URI
   */
  const processImage = async (imageUri: string): Promise<void> => {
    try {
      setIsScanning(true);
      setScanProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 5, 90));
      }, 100);
      
      console.log("Sending image to detection service...");
      const result = await ingredientDetectionService.detectIngredientsFromImage(imageUri, {
        includeConfidence: true,
      });
      
      // Additional debug logging for result format
      console.log("Raw detection result structure:", 
                  Array.isArray(result.detectedIngredients) 
                  ? `Array of ${result.detectedIngredients.length} items` 
                  : typeof result.detectedIngredients);
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      console.log("Detection result:", JSON.stringify(result));
      
      if (result.detectedIngredients && result.detectedIngredients.length > 0) {
        // Process ingredients with confidence values
        const ingredientsWithConfidence: IngredientItem[] = result.detectedIngredients.map(item => {
          console.log("Processing item:", JSON.stringify(item), "type:", typeof item);
          
          if (typeof item === 'string') {
            console.log(`String item: "${item}"`);
            return { name: item };
          } else if (item && typeof item === 'object') {
            const objItem = item as any;
            if ('name' in objItem) {
              if ('confidence' in objItem) {
                console.log(`Object with confidence: ${objItem.name}, confidence: ${objItem.confidence}`);
                return { name: objItem.name, confidence: objItem.confidence };
              } else {
                console.log(`Object without confidence: ${objItem.name}`);
                return { name: objItem.name };
              }
            }
          }
          console.log(`Unknown item type: ${String(item)}`);
          return { name: String(item) };
        }).filter(item => item.name !== null && item.name !== undefined);
        
        // Extract just the names for backward compatibility
        const validIngredients = ingredientsWithConfidence.map(item => item.name);
        
        console.log("Valid ingredients with confidence:", ingredientsWithConfidence);
        
        // Update both state variables
        setDetectedIngredientsWithConfidence(prev => {
          if (!options.allowMultiple) {
            return ingredientsWithConfidence;
          }
          
          // Filter out duplicates
          const newIngredients = ingredientsWithConfidence.filter(
            (item) => !prev.some(existing => existing.name === item.name)
          );
          
          return [...prev, ...newIngredients];
        });
        
        setDetectedIngredients(prev => {
          // If we don't allow multiple, replace the existing ingredients
          if (!options.allowMultiple) {
            options.onIngredientsDetected?.(validIngredients);
            return validIngredients;
          }
          
          // Filter out duplicates
          const newIngredients = validIngredients.filter(
            (ingredient: string) => !prev.includes(ingredient)
          );
          
          // If we found duplicates, show an alert
          const duplicates = validIngredients.filter(
            (ingredient: string) => prev.includes(ingredient)
          );
          
          if (options.alertOnDuplicates && duplicates.length > 0) {
            Alert.alert(
              "Duplicate Ingredients", 
              `${duplicates.join(", ")} ${duplicates.length === 1 ? "is" : "are"} already in your list.`
            );
          }
          
          const updatedIngredients = [...prev, ...newIngredients];
          if (options.onIngredientsDetected) {
            console.log("Calling onIngredientsDetected with:", updatedIngredients);
            options.onIngredientsDetected(updatedIngredients);
          }
          return updatedIngredients;
        });
      } else {
        Alert.alert("No Ingredients Detected", "Try taking a clearer picture or manually add ingredients.");
      }
    } catch (error) {
      console.error("Error scanning image:", error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Failed to scan image.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  /**
   * Add a custom ingredient
   */
  const addCustomIngredient = (ingredient: string): void => {
    if (!ingredient || !ingredient.trim()) {
      return;
    }
    
    const trimmedIngredient = ingredient.trim();
    
    // Update both state variables
    setDetectedIngredientsWithConfidence(prev => {
      if (prev.some(item => item.name === trimmedIngredient)) {
        if (options.alertOnDuplicates) {
          Alert.alert("Duplicate Ingredient", `${trimmedIngredient} is already in your list.`);
        }
        return prev;
      }
      
      const newIngredient = { name: trimmedIngredient, confidence: undefined };
      const updatedIngredients = options.allowMultiple ? [...prev, newIngredient] : [newIngredient];
      return updatedIngredients;
    });
    
    setDetectedIngredients(prev => {
      if (prev.includes(trimmedIngredient)) {
        if (options.alertOnDuplicates) {
          Alert.alert("Duplicate Ingredient", `${trimmedIngredient} is already in your list.`);
        }
        return prev;
      }
      
      const updatedIngredients = options.allowMultiple ? [...prev, trimmedIngredient] : [trimmedIngredient];
      options.onIngredientsDetected?.(updatedIngredients);
      return updatedIngredients;
    });
  };

  /**
   * Remove an ingredient
   */
  const removeIngredient = (ingredient: string): void => {
    // Update both state variables
    setDetectedIngredientsWithConfidence(prev => 
      prev.filter(item => item.name !== ingredient)
    );
    
    setDetectedIngredients(prev => {
      const updated = prev.filter(item => item !== ingredient);
      options.onIngredientsDetected?.(updated);
      return updated;
    });
  };

  /**
   * Reset detected ingredients
   */
  const resetIngredients = (): void => {
    setDetectedIngredientsWithConfidence([]);
    setDetectedIngredients([]);
    options.onIngredientsDetected?.([]);
  };

  return {
    detectedIngredients,
    detectedIngredientsWithConfidence,
    isScanning,
    scanProgress,
    setDetectedIngredients,
    setDetectedIngredientsWithConfidence,
    scanWithCamera,
    scanFromGallery,
    processImage,
    addCustomIngredient,
    removeIngredient,
    resetIngredients,
  };
}