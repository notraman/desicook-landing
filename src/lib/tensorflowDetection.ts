/**
 * Client-side image recognition using TensorFlow.js
 * Runs ML models in the browser - no API calls needed
 * Uses dynamic imports to reduce initial bundle size
 */

export interface DetectedIngredient {
  item: string;
  confidence: number;
}

// Food-related labels from ImageNet (MobileNet uses ImageNet classes)
const FOOD_INGREDIENT_MAPPING: Record<string, string[]> = {
  // Vegetables
  'broccoli': ['broccoli'],
  'cauliflower': ['cauliflower'],
  'carrot': ['carrot'],
  'cucumber': ['cucumber'],
  'bell pepper': ['bell pepper', 'pepper'],
  'tomato': ['tomato'],
  'onion': ['onion'],
  'potato': ['potato'],
  'lettuce': ['lettuce'],
  'spinach': ['spinach'],
  'cabbage': ['cabbage'],
  'celery': ['celery'],
  'corn': ['corn'],
  'peas': ['peas'],
  'mushroom': ['mushroom'],
  
  // Fruits
  'apple': ['apple'],
  'banana': ['banana'],
  'orange': ['orange'],
  'lemon': ['lemon'],
  'lime': ['lime'],
  'strawberry': ['strawberry'],
  'grape': ['grape'],
  'mango': ['mango'],
  
  // Meats
  'chicken': ['chicken', 'chicken breast', 'chicken thigh'],
  'beef': ['beef'],
  'pork': ['pork'],
  'fish': ['fish', 'salmon', 'tuna'],
  'shrimp': ['shrimp'],
  
  // Grains & Legumes
  'rice': ['rice'],
  'bread': ['bread'],
  'pasta': ['pasta', 'noodles'],
  'lentil': ['lentil'],
  'chickpea': ['chickpea'],
  'bean': ['bean', 'black bean', 'kidney bean'],
  
  // Dairy
  'milk': ['milk'],
  'cheese': ['cheese'],
  'yogurt': ['yogurt'],
  'butter': ['butter'],
  'egg': ['egg', 'eggs'],
  
  // Spices & Herbs
  'garlic': ['garlic'],
  'ginger': ['ginger'],
  'herb': ['herb', 'basil', 'cilantro', 'parsley'],
  'spice': ['spice', 'cumin', 'turmeric', 'paprika'],
};

// Normalize ingredient names
function normalizeIngredientName(label: string): string {
  return label.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

// Map ImageNet labels to ingredient names
function mapLabelToIngredient(label: string): string | null {
  const normalized = normalizeIngredientName(label);
  
  // Direct matches
  for (const [key, ingredients] of Object.entries(FOOD_INGREDIENT_MAPPING)) {
    if (normalized.includes(key) || ingredients.some(ing => normalized.includes(ing))) {
      return ingredients[0]; // Return primary ingredient name
    }
  }
  
  // Check if label contains food-related keywords
  const foodKeywords = ['food', 'dish', 'meal', 'recipe', 'cooking', 'kitchen'];
  if (foodKeywords.some(keyword => normalized.includes(keyword))) {
    return null; // Skip generic food terms
  }
  
  // If it's a food-related label, return it as-is (normalized)
  return normalized;
}

let model: any = null; // MobileNet model
let modelLoading = false;

/**
 * Load MobileNet model (cached after first load)
 * Uses dynamic import to reduce initial bundle size
 */
async function loadModel(): Promise<any> {
  if (model) {
    return model;
  }

  if (modelLoading) {
    // Wait for ongoing load
    while (modelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (model) return model;
  }

  modelLoading = true;
  try {
    console.log('Loading TensorFlow.js and MobileNet model...');
    
    // Dynamic imports - only load when needed
    const [tf, mobilenet] = await Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/mobilenet')
    ]);
    
    // Load MobileNet model
    model = await mobilenet.default.load({
      version: 2,
      alpha: 1.0,
    });
    
    console.log('✅ MobileNet model loaded successfully');
    modelLoading = false;
    return model;
  } catch (error) {
    modelLoading = false;
    console.error('Failed to load MobileNet model:', error);
    throw new Error('Failed to load image recognition model. Please check your internet connection for the first load.');
  }
}

/**
 * Detect ingredients from image using TensorFlow.js
 * @param imageFile - Image file to analyze
 * @returns Array of detected ingredients with confidence scores
 */
export async function detectIngredientsWithTensorFlow(
  imageFile: File
): Promise<DetectedIngredient[]> {
  try {
    // Load model if not already loaded
    const loadedModel = await loadModel();

    // Create image element from file
    const image = await fileToImage(imageFile);
    
    // Get predictions from MobileNet
    const predictions = await loadedModel.classify(image, 10); // Top 10 predictions

    // Convert predictions to ingredient format
    const ingredients: DetectedIngredient[] = [];
    const seenIngredients = new Set<string>();

    for (const prediction of predictions) {
      const ingredient = mapLabelToIngredient(prediction.className);
      
      if (ingredient && !seenIngredients.has(ingredient)) {
        seenIngredients.add(ingredient);
        ingredients.push({
          item: ingredient,
          confidence: prediction.probability,
        });
      }
    }

    // Filter by confidence threshold (0.3 for TensorFlow.js - lower than API models)
    const filtered = ingredients.filter(ing => ing.confidence >= 0.3);
    
    return filtered.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error('TensorFlow.js detection error:', error);
    throw new Error(
      error instanceof Error 
        ? `Image detection failed: ${error.message}`
        : 'Failed to detect ingredients using TensorFlow.js'
    );
  }
}

/**
 * Convert File to HTMLImageElement for TensorFlow.js
 */
function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));

    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read image file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Check if TensorFlow.js is available and model can be loaded
 */
export async function isTensorFlowAvailable(): Promise<boolean> {
  try {
    await loadModel();
    return true;
  } catch {
    return false;
  }
}

