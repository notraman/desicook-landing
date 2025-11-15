/**
 * Recipe generation service
 * Uses Gemini AI to generate recipes from ingredients
 */

export interface RecipeSuggestion {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  cookingTime: number;
  difficulty: "Easy" | "Medium" | "Hard";
  cuisine?: string;
  tags?: string[];
}

interface RecipeResponse {
  recipes: RecipeSuggestion[];
  error?: string;
  message?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const RECIPE_URL = import.meta.env.VITE_RECIPE_URL || 
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/generate-recipes` : null);

/**
 * Generate recipes from ingredients using Gemini AI
 */
export async function generateRecipesFromIngredients(
  ingredients: string[],
  count: number = 3
): Promise<RecipeSuggestion[]> {
  if (!RECIPE_URL) {
    const errorMsg = `Recipe generation is not configured. Missing environment variables:
- VITE_RECIPE_URL: ${import.meta.env.VITE_RECIPE_URL ? '✓ Set' : '✗ Missing'}
- VITE_SUPABASE_URL: ${SUPABASE_URL ? '✓ Set' : '✗ Missing'}

Please check your .env file and ensure one of these variables is set.`;
    console.error(errorMsg);
    throw new Error('Recipe generation service is not configured. Please check your environment variables.');
  }
  
  // Only require anon key if using Supabase URL
  if (RECIPE_URL.includes('supabase.co') && !SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is required when using Supabase Edge Functions.');
  }

  // Validate inputs
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error('At least one ingredient is required');
  }

  if (count < 1 || count > 10) {
    count = 3; // Default to 3
  }

  console.log(`Generating ${count} recipes for ingredients:`, ingredients.join(", "));

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (RECIPE_URL.includes('supabase.co') && SUPABASE_ANON_KEY) {
      headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    const response = await fetch(RECIPE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ingredients: ingredients.map(ing => String(ing).toLowerCase().trim()),
        count,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recipe generation error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        const errorMessage = errorData.message || errorData.error || `Recipe generation failed: ${response.statusText}`;
        throw new Error(errorMessage);
      } catch (e) {
        throw new Error(`Recipe generation failed (${response.status} ${response.statusText}): ${errorText.substring(0, 200)}`);
      }
    }

    const responseText = await response.text();
    console.log('Recipe generation response received');
    
    let data: RecipeResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error('Invalid response format from recipe generation service');
    }
    
    // Handle error response
    if (data.error) {
      console.warn('Recipe service returned error:', data.error);
      throw new Error(data.message || data.error);
    }

    // Return recipes array
    if (Array.isArray(data.recipes)) {
      console.log(`Received ${data.recipes.length} recipes`);
      return data.recipes;
    }
    
    // Handle empty recipes with message
    if (data.message) {
      console.warn('Recipe generation message:', data.message);
      return [];
    }
    
    console.error('Unexpected response format:', data);
    throw new Error('Unexpected response format from recipe generation service');
  } catch (error) {
    console.error('Error generating recipes:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Recipe generation') || 
          error.message.includes('Network error') ||
          error.message.includes('CORS error') ||
          error.message.includes('Invalid')) {
        throw error;
      }
      throw new Error(`Failed to generate recipes: ${error.message}`);
    }
    
    throw new Error('Failed to generate recipes. Please try again.');
  }
}



