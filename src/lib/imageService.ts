/**
 * Image recognition service
 * Uses algorithm-based detection (no AI) for ingredient detection
 */

export interface DetectedIngredient {
  item: string;
  confidence: number;
}

// Re-export from imageDetection
export { detectIngredientsFromImage } from './imageDetection';
