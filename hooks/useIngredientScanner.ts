import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native/Libraries/Alert/Alert";
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
  onIngredientsDetected?: (ingredients: string[], ingredientsWithConfidence?: IngredientItem[]) => void;

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

  /**
   * Callback for showing permission dialogs
   */
  onShowPermissionDialog?: (title: string, message: string) => void;
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
   * Whether a scan has been completed (to distinguish from initial state)
   */
  scanCompleted: boolean;

  /**
   * Dialog visibility state
   */
  showDialog: boolean;

  /**
   * Dialog configuration
   */
  dialogConfig: {
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
  };

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

  /**
   * Close the dialog
   */
  closeDialog: () => void;
}

/**
 * Hook to handle ingredient scanning functionality
 */
export function useIngredientScanner(options: UseIngredientScannerOptions = {}): UseIngredientScannerResult {
  const {
    onIngredientsDetected,
    allowMultiple = true,
    alertOnDuplicates = false,
    includeConfidence = false,
    onShowPermissionDialog,
  } = options;

  // State variables
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [detectedIngredientsWithConfidence, setDetectedIngredientsWithConfidence] = useState<IngredientItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info' | 'confirm',
    title: '',
    message: '',
  });

  /**
   * Show custom dialog
   */
  const showCustomDialog = (type: 'success' | 'error' | 'warning' | 'info' | 'confirm', title: string, message: string) => {
    setDialogConfig({ type, title, message });
    setShowDialog(true);
  };

  /**
   * Close dialog
   */
  const closeDialog = () => {
    setShowDialog(false);
  };

  /**
   * Check if camera permissions are granted
   */
  const checkCameraPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      if (onShowPermissionDialog) {
        onShowPermissionDialog("Camera Permission Required", "Please enable camera access to scan ingredients");
      }
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
      if (onShowPermissionDialog) {
        onShowPermissionDialog("Gallery Permission Required", "Please enable gallery access to select images");
      }
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
      console.log("Error taking picture:", error);
      showCustomDialog('error', 'Camera Error', 'Failed to take picture. Please try again.');
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
      console.log("Error selecting image from gallery:", error);
      showCustomDialog('error', 'Gallery Error', 'Failed to select image from gallery. Please try again.');
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
            if (options.onIngredientsDetected) {
              console.log("Calling onIngredientsDetected with:", validIngredients, "and confidence:", ingredientsWithConfidence);
              options.onIngredientsDetected(validIngredients, ingredientsWithConfidence);
            }
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

        setScanCompleted(true);
      } else {
        // For empty results, we need to set empty arrays and call the callback
        console.log("No ingredients detected in the scanned image");
        setDetectedIngredientsWithConfidence([]);
        setDetectedIngredients([]);
        setScanCompleted(true);
        if (options.onIngredientsDetected) {
          options.onIngredientsDetected([]);
        }
      }
    } catch (error) {
      console.log("Error scanning image:", error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : "Failed to scan image.";
      
      // Show alert for timeout/network errors and AbortError
      if (errorMessage.includes('timeout') || errorMessage.includes('connection') || errorMessage.includes('network') || errorMessage.includes('Request Timeout') || 
          (error instanceof Error && error.name === 'AbortError')) {
        showCustomDialog(
          'error',
          'Request Failed',
          errorMessage.includes('Request Timeout') || (error instanceof Error && error.name === 'AbortError') 
            ? 'Image analysis took too long. Please try again.'
            : 'Unable to analyze the image. Please check your connection and try again.'
        );
      } else {
        // For other errors, show a generic message
        showCustomDialog(
          'error',
          'Scanning Failed',
          'Could not detect ingredients from the image. Please try again.'
        );
      }
      
      console.log("Ingredient detection error:", errorMessage);
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
          showCustomDialog('warning', 'Duplicate Ingredient', `${trimmedIngredient} is already in your list.`);
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
          showCustomDialog('warning', 'Duplicate Ingredient', `${trimmedIngredient} is already in your list.`);
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
    setScanCompleted(false);
    options.onIngredientsDetected?.([]);
  };

  return {
    detectedIngredients,
    detectedIngredientsWithConfidence,
    isScanning,
    scanProgress,
    scanCompleted,
    showDialog,
    dialogConfig,
    setDetectedIngredients,
    setDetectedIngredientsWithConfidence,
    scanWithCamera,
    scanFromGallery,
    processImage,
    addCustomIngredient,
    removeIngredient,
    resetIngredients,
    closeDialog,
  };
}