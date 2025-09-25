# Ingredient Scanner Service Documentation

## Overview

The Ingredient Scanner Service provides a comprehensive solution for detecting ingredients from images using a FastAPI backend. This service includes:

1. A reusable API service for communicating with the FastAPI backend
2. A React hook for managing the ingredient scanning state
3. A custom dialog component for capturing and displaying ingredients
4. A demo component showcasing the implementation

## Architecture

```
lib/
  services/
    ingredientDetectionService.ts  # Core API service
  types/
    ingredientDetection.ts        # TypeScript interfaces
hooks/
  useIngredientScanner.ts        # Custom React hook
components/
  atoms/
    CustomDialog.tsx             # Base dialog component
  molecules/
    IngredientScannerDialog.tsx  # Scanner UI component
  organisms/
    IngredientScannerDemo.tsx    # Example implementation
```

## Core Service: ingredientDetectionService

This service handles the API communication with the FastAPI backend:

```typescript
// Main method to detect ingredients from an image
async detectIngredientsFromImage(
  imageUri: string,
  options?: IngredientDetectionOptions
): Promise<IngredientDetectionResponse>
```

### Features:

- Robust error handling
- File existence validation
- Response format adaptation
- Optional confidence scores

## React Hook: useIngredientScanner

A custom hook that provides a complete state management solution:

```typescript
const {
  detectedIngredients,    // Array of detected ingredients
  isScanning,             // Whether scanning is in progress
  scanProgress,           // Scan progress (0-100%)
  scanWithCamera,         // Function to scan with camera
  scanFromGallery,        // Function to scan from gallery
  processImage,           // Process an image URI directly
  addCustomIngredient,    // Add a custom ingredient manually
  removeIngredient,       // Remove an ingredient
  resetIngredients,       // Reset the ingredients list
} = useIngredientScanner({
  onIngredientsDetected,  // Callback when ingredients are detected
  allowMultiple,          // Allow multiple ingredients (default: true)
  alertOnDuplicates,      // Show alert on duplicates (default: true)
});
```

## UI Components

### CustomDialog

A reusable dialog component with animations and styling:

```typescript
<CustomDialog
  visible={boolean}       // Whether the dialog is visible
  onClose={() => void}    // Called when the dialog is closed
  title="Dialog Title"    // Title of the dialog
  height={number}         // Optional height
>
  {/* Dialog content */}
</CustomDialog>
```

### IngredientScannerDialog

A complete UI for scanning ingredients:

```typescript
<IngredientScannerDialog
  visible={boolean}                        // Whether the dialog is visible
  onClose={() => void}                     // Called when the dialog is closed
  onIngredientsDetected={(ingredients) => {}}  // Called when ingredients are detected
  allowMultiple={boolean}                  // Allow multiple ingredients (default: true)
/>
```

## Usage Example

```typescript
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import IngredientScannerDialog from '../components/molecules/IngredientScannerDialog';

export default function MyScreen() {
  const [showScanner, setShowScanner] = useState(false);
  const [ingredients, setIngredients] = useState([]);

  const handleIngredientsDetected = (detectedIngredients) => {
    setIngredients(detectedIngredients);
    // Do something with the ingredients
    console.log('Detected ingredients:', detectedIngredients);
  };

  return (
    <View>
      <Button 
        title="Scan Ingredients" 
        onPress={() => setShowScanner(true)} 
      />
      
      <IngredientScannerDialog
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onIngredientsDetected={handleIngredientsDetected}
      />
    </View>
  );
}
```

## API Configuration

The FastAPI endpoint is configured in `ingredientDetectionService.ts`:

```typescript
private readonly apiUrl: string = "http://192.168.100.65:8000/detect";
```

Modify this URL to match your FastAPI server's address.

## Expected API Response Format

The API should return a response in one of these formats:

1. Preferred format:
```json
{
  "detectedIngredients": ["tomato", "onion", "garlic"],
  "confidence": 0.95
}
```

2. Alternative format:
```json
["tomato", "onion", "garlic"]
```

3. Legacy format:
```json
{
  "ingredients": ["tomato", "onion", "garlic"],
  "confidence": 0.95
}
```

The service includes logic to handle all these response formats.