import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { detectIngredientsFromImage, type DetectedIngredient } from '@/lib/imageDetection';
import { generateRecipesFromIngredients, type RecipeSuggestion } from '@/lib/recipeService';
import { resizeImageFile } from '@/lib/resizeImage';

interface ImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onIngredientsDetected: (ingredients: string[]) => void;
}

interface ImagePreview {
  file: File;
  preview: string;
}

export const ImageUploader = ({
  isOpen,
  onClose,
  onIngredientsDetected,
}: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 4;

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  const handleFiles = async (files: File[]) => {
    // Filter to only images and limit to MAX_IMAGES
    const imageFiles = files.filter(file => file.type.startsWith('image/')).slice(0, MAX_IMAGES);
    
    if (imageFiles.length === 0) {
      setError('Please upload at least one image file');
      return;
    }

    if (files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. Only the first ${MAX_IMAGES} will be used.`);
    }

    setError(null);
    setDetectedIngredients([]);
    setRecipes([]);
    setServerMessage(null);

    // Create previews for all images
    const previews: ImagePreview[] = [];
    for (const file of imageFiles) {
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
      previews.push({ file, preview });
    }
    setImagePreviews(previews);

    // Detect ingredients from images using algorithm
    setIsDetecting(true);
    setServerMessage('Analyzing images using computer vision algorithms...');
    
    try {
      // Process all images and collect ingredients
      const allDetectedIngredients: DetectedIngredient[] = [];
      
      for (const preview of previews) {
        try {
          // Resize image for processing
          let processedFile: File;
          try {
            processedFile = await resizeImageFile(preview.file, 1200, 0.78);
          } catch (resizeError) {
            console.warn('Resize failed, using original:', resizeError);
            processedFile = preview.file;
          }

          // Detect ingredients using algorithm
          const detected = await detectIngredientsFromImage(processedFile);
          allDetectedIngredients.push(...detected);
        } catch (detectError) {
          console.error('Detection error for image:', detectError);
        }
      }

      // Remove duplicates and merge
      const uniqueIngredients = removeDuplicateIngredients(allDetectedIngredients);
      
      if (uniqueIngredients.length > 0) {
        setDetectedIngredients(uniqueIngredients);
        setServerMessage(`Detected ${uniqueIngredients.length} ingredient(s) from images. You can edit them or generate recipes.`);
      } else {
        setError('No ingredients detected. Please try with clearer images showing food items.');
        setServerMessage('The algorithm could not identify ingredients. Try images with clearly visible food items.');
      }
    } catch (err) {
      console.error('Detection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect ingredients. Please try again.';
      setError(errorMessage);
      setServerMessage('Try uploading clearer images with visible food ingredients.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleGenerateRecipes = async () => {
    if (detectedIngredients.length === 0) {
      setError('Please detect ingredients first or add them manually');
      return;
    }

    setIsGeneratingRecipes(true);
    setError(null);
    setRecipes([]);
    setServerMessage('Generating recipes using AI...');

    try {
      // Extract ingredient names
      const ingredientNames = detectedIngredients.map(ing => ing.item);
      
      // Generate recipes using Gemini
      const generatedRecipes = await generateRecipesFromIngredients(ingredientNames, 3);
      
      if (generatedRecipes.length > 0) {
        setRecipes(generatedRecipes);
        setServerMessage(`Successfully generated ${generatedRecipes.length} recipe(s)!`);
      } else {
        setError('No recipes could be generated. Please try again.');
        setServerMessage('The AI could not generate recipes. Please try with different ingredients.');
      }
    } catch (err) {
      console.error('Recipe generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recipes. Please try again.';
      setError(errorMessage);
      
      if (errorMessage.includes('Network error') || errorMessage.includes('Failed to connect')) {
        setServerMessage('Cannot connect to the recipe service. Please check your internet connection.');
      } else {
        setServerMessage('Try again with different ingredients.');
      }
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (imagePreviews.length === 1) {
      setDetectedIngredients([]);
      setRecipes([]);
      setError(null);
      setServerMessage(null);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setDetectedIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditIngredient = (index: number, newValue: string) => {
    if (!newValue.trim()) {
      handleRemoveIngredient(index);
      return;
    }
    setDetectedIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], item: newValue.trim().toLowerCase() };
      return updated;
    });
  };

  const handleAddIngredient = () => {
    setDetectedIngredients((prev) => [...prev, { item: '', confidence: 0.8, method: 'pattern' }]);
  };

  const handleUseIngredients = () => {
    const ingredientNames = detectedIngredients.map((ing) => ing.item).filter(ing => ing.trim().length > 0);
    onIngredientsDetected(ingredientNames);
    handleClose();
  };

  const handleClose = () => {
    setImagePreviews([]);
    setDetectedIngredients([]);
    setRecipes([]);
    setError(null);
    setServerMessage(null);
    setIsDetecting(false);
    setIsGeneratingRecipes(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleReset = () => {
    setImagePreviews([]);
    setDetectedIngredients([]);
    setRecipes([]);
    setError(null);
    setServerMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove duplicate ingredients
  function removeDuplicateIngredients(ingredients: DetectedIngredient[]): DetectedIngredient[] {
    const map = new Map<string, DetectedIngredient>();

    for (const ing of ingredients) {
      const key = ing.item.toLowerCase().trim();
      const existing = map.get(key);
      
      if (existing) {
        // Take highest confidence
        existing.confidence = Math.max(existing.confidence, ing.confidence);
      } else {
        map.set(key, { ...ing });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.confidence - a.confidence);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image uploader"
    >
      <div
        className="glass glass-reflection rounded-2xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-dc-cream">Detect Ingredients & Generate Recipes</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg glass flex items-center justify-center text-dc-cream/70 hover:text-dc-cream transition-colors focus:outline-none focus:ring-2 focus:ring-dc-gold"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dropzone */}
        {imagePreviews.length === 0 && (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              isDragging
                ? 'border-dc-gold bg-dc-gold/10'
                : 'border-dc-cream/20 hover:border-dc-cream/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload images"
            />
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full glass flex items-center justify-center text-dc-gold">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-dc-cream mb-2">
                  Drop photos of your ingredients
                </p>
                <p className="text-sm text-dc-cream/60 mb-4">
                  Or click to browse from your device (up to {MAX_IMAGES} images)
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-glass px-6 py-2.5"
                >
                  Choose Images
                </button>
              </div>
              <p className="text-xs text-dc-cream/40">
                Supports JPG, PNG, WebP • Max 5MB per image • Algorithm-based detection (no AI)
              </p>
            </div>
          </div>
        )}

        {/* Image Previews & Results */}
        {imagePreviews.length > 0 && (
          <div className="space-y-6">
            {/* Image Previews */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-dc-cream">
                Uploaded Images ({imagePreviews.length}/{MAX_IMAGES})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden bg-gradient-to-br from-dc-gold/10 to-dc-burgundy/10">
                    <img
                      src={preview.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white text-xs transition-colors"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      ×
                    </button>
                    {isDetecting && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-dc-gold border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {isDetecting && (
              <div className="text-center space-y-3 py-8">
                <div className="w-12 h-12 border-4 border-dc-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-dc-cream font-medium">Analyzing images...</p>
                {serverMessage && (
                  <p className="text-sm text-dc-cream/60">{serverMessage}</p>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && !isDetecting && !isGeneratingRecipes && (
              <div className="glass bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
                <p className="text-sm text-red-300">{error}</p>
                {serverMessage && (
                  <p className="text-xs text-red-200/80">{serverMessage}</p>
                )}
              </div>
            )}

            {/* Detected Ingredients */}
            {detectedIngredients.length > 0 && !isDetecting && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-dc-cream">
                    Detected Ingredients ({detectedIngredients.length})
                  </h3>
                  <button
                    onClick={handleAddIngredient}
                    className="text-sm text-dc-gold hover:text-dc-gold/80 underline"
                  >
                    + Add manually
                  </button>
                </div>
                {serverMessage && !isGeneratingRecipes && (
                  <p className="text-sm text-dc-cream/70">{serverMessage}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {detectedIngredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border bg-dc-gold/10 border-dc-gold/30"
                    >
                      <input
                        type="text"
                        value={ingredient.item}
                        onChange={(e) => handleEditIngredient(index, e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-dc-cream font-medium min-w-[80px] max-w-[150px] focus:ring-1 focus:ring-dc-gold rounded px-1"
                        placeholder="ingredient"
                        aria-label={`Edit ingredient ${index + 1}`}
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-dc-gold/70">
                          {Math.round(ingredient.confidence * 100)}%
                        </span>
                        <button
                          onClick={() => handleRemoveIngredient(index)}
                          className="w-4 h-4 rounded-full hover:bg-dc-gold/20 flex items-center justify-center transition-colors"
                          aria-label={`Remove ${ingredient.item}`}
                        >
                          <svg className="w-3 h-3 text-dc-cream/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleGenerateRecipes}
                  disabled={isGeneratingRecipes || detectedIngredients.length === 0}
                  className="btn-gold px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingRecipes ? 'Generating Recipes...' : 'Generate Recipes with AI'}
                </button>
              </div>
            )}

            {/* Recipe Generation Loading */}
            {isGeneratingRecipes && (
              <div className="text-center space-y-3 py-8">
                <div className="w-12 h-12 border-4 border-dc-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-dc-cream font-medium">Generating recipes using AI...</p>
                {serverMessage && (
                  <p className="text-sm text-dc-cream/60">{serverMessage}</p>
                )}
              </div>
            )}

            {/* Generated Recipes */}
            {recipes.length > 0 && !isGeneratingRecipes && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-dc-cream">
                  Generated Recipes ({recipes.length})
                </h3>
                {serverMessage && (
                  <p className="text-sm text-dc-cream/70">{serverMessage}</p>
                )}
                <div className="space-y-4">
                  {recipes.map((recipe, index) => (
                    <div key={index} className="glass rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-dc-cream mb-1">{recipe.title}</h4>
                          <p className="text-sm text-dc-cream/70 mb-2">{recipe.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 rounded-full bg-dc-gold/20 text-dc-gold">
                              {recipe.cookingTime} min
                            </span>
                            <span className="px-2 py-1 rounded-full bg-dc-gold/20 text-dc-gold">
                              {recipe.difficulty}
                            </span>
                            {recipe.cuisine && (
                              <span className="px-2 py-1 rounded-full bg-dc-gold/20 text-dc-gold">
                                {recipe.cuisine}
                              </span>
                            )}
                            {recipe.tags && recipe.tags.length > 0 && (
                              recipe.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="px-2 py-1 rounded-full bg-dc-burgundy/20 text-dc-burgundy">
                                  {tag}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-dc-cream/10">
                        <div>
                          <h5 className="text-sm font-semibold text-dc-cream mb-2">Ingredients:</h5>
                          <ul className="text-xs text-dc-cream/80 space-y-1">
                            {recipe.ingredients.slice(0, 8).map((ing, i) => (
                              <li key={i}>• {ing}</li>
                            ))}
                            {recipe.ingredients.length > 8 && (
                              <li className="text-dc-cream/60">+ {recipe.ingredients.length - 8} more</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-dc-cream mb-2">Steps:</h5>
                          <ol className="text-xs text-dc-cream/80 space-y-1 list-decimal list-inside">
                            {recipe.steps.slice(0, 5).map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                            {recipe.steps.length > 5 && (
                              <li className="text-dc-cream/60">+ {recipe.steps.length - 5} more steps</li>
                            )}
                          </ol>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-dc-cream/10">
              <button
                onClick={handleReset}
                className="btn-glass flex-1 sm:flex-none px-6 py-2.5"
              >
                Upload New Images
              </button>
              {detectedIngredients.length > 0 && (
                <button
                  onClick={handleUseIngredients}
                  className="btn-gold flex-1 sm:flex-none px-8 py-2.5"
                >
                  Use These Ingredients
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
