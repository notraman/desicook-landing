/**
 * Algorithm-based image detection (NO AI)
 * Uses color analysis, shape detection, and texture analysis to identify ingredients
 */

export interface DetectedIngredient {
  item: string;
  confidence: number;
  method: 'color' | 'shape' | 'texture' | 'pattern';
}

interface ColorAnalysis {
  dominantColors: Array<{ r: number; g: number; b: number; percentage: number }>;
  averageColor: { r: number; g: number; b: number };
  colorVariance: number;
}

interface ShapeAnalysis {
  roundness: number;
  aspectRatio: number;
  edgeCount: number;
  compactness: number;
}

interface TextureAnalysis {
  smoothness: number;
  contrast: number;
  uniformity: number;
}

/**
 * Detect ingredients from image using algorithm-based approach
 */
export async function detectIngredientsFromImage(imageFile: File): Promise<DetectedIngredient[]> {
  const image = await loadImage(imageFile);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Perform analyses
  const colorAnalysis = analyzeColors(pixels, canvas.width, canvas.height);
  const shapeAnalysis = analyzeShapes(imageData);
  const textureAnalysis = analyzeTexture(pixels, canvas.width, canvas.height);

  // Detect ingredients based on analysis
  const detectedIngredients: DetectedIngredient[] = [];

  // Color-based detection
  const colorBased = detectByColor(colorAnalysis);
  detectedIngredients.push(...colorBased);

  // Shape-based detection
  const shapeBased = detectByShape(shapeAnalysis);
  detectedIngredients.push(...shapeBased);

  // Texture-based detection
  const textureBased = detectByTexture(textureAnalysis);
  detectedIngredients.push(...textureBased);

  // Remove duplicates and sort by confidence
  const uniqueIngredients = removeDuplicates(detectedIngredients);
  
  return uniqueIngredients
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 15); // Top 15 ingredients
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze color distribution in image
 */
function analyzeColors(pixels: Uint8ClampedArray, width: number, height: number): ColorAnalysis {
  const colorMap = new Map<string, number>();
  let totalR = 0, totalG = 0, totalB = 0;
  const pixelCount = width * height;

  // Sample pixels (every 10th pixel for performance)
  for (let i = 0; i < pixels.length; i += 40) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    // Skip near-white and near-black pixels (likely background)
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 225) continue;

    totalR += r;
    totalG += g;
    totalB += b;

    // Quantize colors (reduce to 16 levels per channel)
    const qr = Math.floor(r / 16) * 16;
    const qg = Math.floor(g / 16) * 16;
    const qb = Math.floor(b / 16) * 16;
    const key = `${qr},${qg},${qb}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  // Get dominant colors
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number);
      return {
        r,
        g,
        b,
        percentage: count / (pixelCount / 10),
      };
    });

  // Calculate average color
  const avgR = Math.round(totalR / (pixelCount / 10));
  const avgG = Math.round(totalG / (pixelCount / 10));
  const avgB = Math.round(totalB / (pixelCount / 10));

  // Calculate color variance
  let variance = 0;
  for (let i = 0; i < pixels.length; i += 40) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 225) continue;
    
    const avgBrightness = (avgR + avgG + avgB) / 3;
    variance += Math.pow(brightness - avgBrightness, 2);
  }
  variance = variance / (pixelCount / 10);

  return {
    dominantColors: sortedColors,
    averageColor: { r: avgR, g: avgG, b: avgB },
    colorVariance: variance,
  };
}

/**
 * Analyze shapes in image using edge detection
 */
function analyzeShapes(imageData: ImageData): ShapeAnalysis {
  const { width, height, data } = imageData;
  const edges = detectEdges(data, width, height);
  
  // Calculate roundness (ratio of area to perimeter squared)
  const edgeCount = edges.length;
  const area = width * height;
  const perimeter = edgeCount * 2; // Approximate
  const roundness = (4 * Math.PI * area) / (perimeter * perimeter) || 0;

  // Aspect ratio
  const aspectRatio = width / height;

  // Compactness (how much of the image is filled)
  const filledPixels = edges.length;
  const compactness = filledPixels / area;

  return {
    roundness: Math.min(1, roundness),
    aspectRatio,
    edgeCount,
    compactness,
  };
}

/**
 * Simple edge detection using Sobel operator
 */
function detectEdges(data: Uint8ClampedArray, width: number, height: number): Array<{ x: number; y: number }> {
  const edges: Array<{ x: number; y: number }> = [];
  const grayscale = new Uint8Array(width * height);

  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    grayscale[i / 4] = gray;
  }

  // Sobel edge detection (simplified)
  const threshold = 50;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx = grayscale[idx + 1] - grayscale[idx - 1];
      const gy = grayscale[(y + 1) * width + x] - grayscale[(y - 1) * width + x];
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      if (magnitude > threshold) {
        edges.push({ x, y });
      }
    }
  }

  return edges;
}

/**
 * Analyze texture in image
 */
function analyzeTexture(pixels: Uint8ClampedArray, width: number, height: number): TextureAnalysis {
  let totalContrast = 0;
  let totalUniformity = 0;
  const sampleSize = 1000;
  const samples: number[] = [];

  // Sample random pixels
  for (let i = 0; i < sampleSize; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const idx = (y * width + x) * 4;
    const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
    samples.push(brightness);
  }

  // Calculate contrast (standard deviation)
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
  const contrast = Math.sqrt(variance);

  // Calculate uniformity (inverse of variance)
  const uniformity = 1 / (1 + variance / 100);

  // Calculate smoothness (low contrast = smooth)
  const smoothness = 1 / (1 + contrast / 50);

  return {
    smoothness,
    contrast,
    uniformity,
  };
}

/**
 * Detect ingredients based on color analysis
 */
function detectByColor(analysis: ColorAnalysis): DetectedIngredient[] {
  const ingredients: DetectedIngredient[] = [];
  const { dominantColors, averageColor } = analysis;

  // Check each dominant color against known ingredient colors
  for (const color of dominantColors) {
    const { r, g, b } = color;
    
    // Red colors (tomatoes, peppers, apples, etc.)
    if (r > 150 && g < 100 && b < 100) {
      ingredients.push({ item: 'tomato', confidence: 0.7, method: 'color' });
      ingredients.push({ item: 'red pepper', confidence: 0.6, method: 'color' });
    }
    
    // Orange colors (carrots, oranges, etc.)
    if (r > 180 && g > 100 && g < 180 && b < 80) {
      ingredients.push({ item: 'carrot', confidence: 0.7, method: 'color' });
      ingredients.push({ item: 'orange', confidence: 0.6, method: 'color' });
    }
    
    // Yellow colors (bananas, corn, lemons, etc.)
    if (r > 200 && g > 180 && b < 100) {
      ingredients.push({ item: 'banana', confidence: 0.6, method: 'color' });
      ingredients.push({ item: 'corn', confidence: 0.5, method: 'color' });
    }
    
    // Green colors (vegetables, herbs, etc.)
    if (g > 120 && r < g && b < g) {
      ingredients.push({ item: 'lettuce', confidence: 0.7, method: 'color' });
      ingredients.push({ item: 'spinach', confidence: 0.6, method: 'color' });
      ingredients.push({ item: 'cucumber', confidence: 0.6, method: 'color' });
      ingredients.push({ item: 'green pepper', confidence: 0.6, method: 'color' });
    }
    
    // Brown colors (meat, bread, potatoes, etc.)
    if (r > 100 && r < 180 && g > 80 && g < 150 && b < 100) {
      ingredients.push({ item: 'potato', confidence: 0.6, method: 'color' });
      ingredients.push({ item: 'bread', confidence: 0.5, method: 'color' });
    }
    
    // White/cream colors (onions, garlic, rice, etc.)
    if (r > 200 && g > 200 && b > 200) {
      ingredients.push({ item: 'onion', confidence: 0.6, method: 'color' });
      ingredients.push({ item: 'garlic', confidence: 0.5, method: 'color' });
      ingredients.push({ item: 'rice', confidence: 0.5, method: 'color' });
    }
    
    // Purple colors (eggplant, purple cabbage, etc.)
    if (r > 100 && r < 180 && g < 100 && b > 100) {
      ingredients.push({ item: 'eggplant', confidence: 0.6, method: 'color' });
      ingredients.push({ item: 'purple cabbage', confidence: 0.5, method: 'color' });
    }
  }

  return ingredients;
}

/**
 * Detect ingredients based on shape analysis
 */
function detectByShape(analysis: ShapeAnalysis): DetectedIngredient[] {
  const ingredients: DetectedIngredient[] = [];
  const { roundness, aspectRatio, compactness } = analysis;

  // Round objects (tomatoes, onions, apples, etc.)
  if (roundness > 0.7) {
    ingredients.push({ item: 'tomato', confidence: 0.6, method: 'shape' });
    ingredients.push({ item: 'onion', confidence: 0.6, method: 'shape' });
    ingredients.push({ item: 'apple', confidence: 0.5, method: 'shape' });
  }

  // Elongated objects (carrots, cucumbers, bananas, etc.)
  if (aspectRatio > 1.5 || aspectRatio < 0.67) {
    ingredients.push({ item: 'carrot', confidence: 0.6, method: 'shape' });
    ingredients.push({ item: 'cucumber', confidence: 0.6, method: 'shape' });
    ingredients.push({ item: 'banana', confidence: 0.5, method: 'shape' });
  }

  // Compact objects (potatoes, etc.)
  if (compactness > 0.5) {
    ingredients.push({ item: 'potato', confidence: 0.5, method: 'shape' });
  }

  return ingredients;
}

/**
 * Detect ingredients based on texture analysis
 */
function detectByTexture(analysis: TextureAnalysis): DetectedIngredient[] {
  const ingredients: DetectedIngredient[] = [];
  const { smoothness, contrast } = analysis;

  // Smooth textures (bananas, eggs, etc.)
  if (smoothness > 0.7) {
    ingredients.push({ item: 'banana', confidence: 0.5, method: 'texture' });
    ingredients.push({ item: 'egg', confidence: 0.4, method: 'texture' });
  }

  // Rough textures (potatoes, bread, etc.)
  if (contrast > 30) {
    ingredients.push({ item: 'potato', confidence: 0.5, method: 'texture' });
    ingredients.push({ item: 'bread', confidence: 0.4, method: 'texture' });
  }

  return ingredients;
}

/**
 * Remove duplicate ingredients and merge confidences
 */
function removeDuplicates(ingredients: DetectedIngredient[]): DetectedIngredient[] {
  const map = new Map<string, DetectedIngredient>();

  for (const ing of ingredients) {
    const key = ing.item.toLowerCase().trim();
    const existing = map.get(key);
    
    if (existing) {
      // Merge: take highest confidence, combine methods
      existing.confidence = Math.max(existing.confidence, ing.confidence);
      // If different methods, increase confidence slightly
      if (existing.method !== ing.method) {
        existing.confidence = Math.min(1, existing.confidence + 0.1);
      }
    } else {
      map.set(key, { ...ing });
    }
  }

  return Array.from(map.values());
}

