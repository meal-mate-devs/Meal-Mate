export interface IngredientWithConfidence {
  name: string;
  confidence: number;
}

export interface IngredientDetectionResponse {
  detectedIngredients: (string | IngredientWithConfidence)[];
  confidence?: number;
}

export interface DetectionError {
  error: string;
  message: string;
  status: number;
}

export interface IngredientDetectionOptions {
  includeConfidence?: boolean;
}