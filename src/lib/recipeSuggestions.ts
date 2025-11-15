/**
 * Recipe suggestions service using Gemini AI
 * Generates AI-powered recipe suggestions based on ingredients
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

interface SuggestionsResponse {
  suggestions: RecipeSuggestion[];
  error?: string;
  message?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_EDGE_FUNCTION_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/suggest-recipes`
  : null;

/**
 * Get AI-generated recipe suggestions based on ingredients
 * @param ingredients - Array of ingredient names
 * @param count - Number of recipe suggestions to generate (default: 3)
 * @returns Array of recipe suggestions
 */
export async function getRecipeSuggestions(
  ingredients: string[],
  count: number = 3
): Promise<RecipeSuggestion[]> {
  if (!SUPABASE_EDGE_FUNCTION_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase Edge Function URL or key not configured");
    throw new Error("Recipe suggestions service not configured");
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error("Ingredients array is required and cannot be empty");
  }

  try {
    const response = await fetch(SUPABASE_EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        ingredients,
        count: Math.min(Math.max(count, 1), 5), // Limit between 1-5
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: SuggestionsResponse;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`Recipe suggestions failed: ${response.statusText}`);
      }
      throw new Error(errorData.error || errorData.message || "Failed to get recipe suggestions");
    }

    const data: SuggestionsResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
      throw new Error(data.message || "No recipe suggestions generated");
    }

    return data.suggestions;
  } catch (error) {
    console.error("Error getting recipe suggestions:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get recipe suggestions. Please try again.");
  }
}



