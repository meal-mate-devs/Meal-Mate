import * as FileSystem from "expo-file-system";
import { apiConfig } from "../config/config";
import { DetectionError, IngredientDetectionOptions, IngredientDetectionResponse } from "../types/ingredientDetection";

class IngredientDetectionService {
  private readonly apiUrl: string = `${apiConfig.ingredientDetectionApiUrl}${apiConfig.ingredientDetectionEndpoint}`;

  /**
   * Detects ingredients from an image
   * @param imageUri - The URI of the image to detect ingredients from
   * @param options - Optional configuration for the detection
   * @returns A promise that resolves to the detected ingredients
   */
  async detectIngredientsFromImage(
    imageUri: string,
    options?: IngredientDetectionOptions
  ): Promise<IngredientDetectionResponse> {
    try {
      // Check if the file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw this.createError("File not found", "The specified image file does not exist", 404);
      }

      // Create form data for the API request
      const formData = new FormData();
      formData.append("file", {
        uri: fileInfo.uri,
        name: "image.jpg",
        type: "image/jpeg",
      } as any);

      // Include any additional options
      if (options?.includeConfidence) {
        formData.append("include_confidence", "true");
      }

      // Make the API request
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        body: formData,
      });

      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.log("API error response:", errorText);
        throw this.createError(
          "API Error",
          `Failed to detect ingredients: ${errorText || response.statusText}`,
          response.status
        );
      }

      // Parse and return the response
      const rawResult = await response.json();

      let processedResult: IngredientDetectionResponse;

      // Check if the response has the expected structure
      if (Array.isArray(rawResult.detectedIngredients)) {
        processedResult = rawResult;
      } else if (Array.isArray(rawResult)) {
        processedResult = {
          detectedIngredients: rawResult.map((item: any) => {
            // Preserve confidence if available
            if (item && typeof item === 'object' && 'name' in item) {
              if ('confidence' in item) {
                return {
                  name: item.name,
                  confidence: item.confidence
                };
              }
              return item.name;
            }
            return String(item);
          }),
        };
      } else if (rawResult.ingredients) {
        const ingredients = Array.isArray(rawResult.ingredients)
          ? rawResult.ingredients.map((item: any) => {
            if (item && typeof item === 'object' && 'name' in item) {
              if ('confidence' in item) {
                return {
                  name: item.name,
                  confidence: item.confidence
                };
              }
              return item.name;
            }
            return String(item);
          })
          : [String(rawResult.ingredients)];

        processedResult = {
          detectedIngredients: ingredients,
          ...(rawResult.confidence && { confidence: rawResult.confidence }),
        };
      } else {
        console.log("Unrecognized response format:", rawResult);
        throw this.createError(
          "Invalid Response",
          "The API response format was not recognized",
          400
        );
      }

      return processedResult;
    } catch (error) {
      if (this.isDetectionError(error)) {
        console.log("Detection error:", error);
        throw error;
      }

      console.log("Error detecting ingredients:", error);
      throw this.createError(
        "Detection Failed",
        error instanceof Error ? error.message : "An unknown error occurred",
        500
      );
    }
  }

  /**
   * Creates a standardized error object
   */
  private createError(error: string, message: string, status: number): DetectionError {
    return { error, message, status };
  }

  /**
   * Type guard for detection errors
   */
  private isDetectionError(error: unknown): error is DetectionError {
    return (
      typeof error === "object" &&
      error !== null &&
      "error" in error &&
      "message" in error &&
      "status" in error
    );
  }
}

export const ingredientDetectionService = new IngredientDetectionService();