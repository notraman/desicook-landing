// Supabase Edge Function: Search Recipes by Ingredients
// Returns recipes sorted by ingredient match score

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Ingredient substitution mappings (simplified version for Edge Function)
const substitutions: Record<string, string[]> = {
  "scallion": ["spring onion", "spring-onion", "green onion"],
  "spring onion": ["scallion", "green onion"],
  "green onion": ["scallion", "spring onion"],
  "cilantro": ["coriander", "coriander leaves"],
  "coriander": ["cilantro", "coriander leaves"],
  "chickpea": ["garbanzo bean", "garbanzo", "chick peas"],
  "garbanzo bean": ["chickpea", "garbanzo"],
  "capsicum": ["bell pepper", "sweet pepper"],
  "bell pepper": ["capsicum", "sweet pepper"],
  "aubergine": ["eggplant", "brinjal"],
  "eggplant": ["aubergine", "brinjal"],
};

/**
 * Normalize ingredient name
 */
function normalizeIngredient(ingredient: string): string {
  if (!ingredient) return "";
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\bs\b/g, "")
    .trim();
}

/**
 * Get all synonyms for an ingredient
 */
function getIngredientSynonyms(ingredient: string): string[] {
  const normalized = normalizeIngredient(ingredient);
  const synonyms = [normalized];
  
  if (substitutions[normalized]) {
    synonyms.push(...substitutions[normalized]);
  }
  
  for (const [key, values] of Object.entries(substitutions)) {
    if (values.includes(normalized)) {
      synonyms.push(key);
      synonyms.push(...values);
    }
  }
  
  return [...new Set(synonyms)];
}

/**
 * Check if two ingredients match (considering substitutions)
 */
function ingredientsMatch(ingredient1: string, ingredient2: string): boolean {
  const norm1 = normalizeIngredient(ingredient1);
  const norm2 = normalizeIngredient(ingredient2);
  
  if (norm1 === norm2) return true;
  
  const synonyms1 = getIngredientSynonyms(norm1);
  const synonyms2 = getIngredientSynonyms(norm2);
  
  return synonyms1.some(s => synonyms2.includes(s));
}

/**
 * Calculate match score for a recipe
 */
function calculateScore(
  inputIngredients: string[],
  recipeIngredients: string[]
): { matchedCount: number; partialMatches: number; totalIngredients: number; score: number } {
  const normalizedInput = inputIngredients.map(normalizeIngredient);
  const normalizedRecipe = recipeIngredients.map(normalizeIngredient);
  
  let matchedCount = 0;
  let partialMatches = 0;
  
  for (const inputIng of normalizedInput) {
    let found = false;
    
    // Exact match
    for (const recipeIng of normalizedRecipe) {
      if (inputIng === recipeIng) {
        matchedCount++;
        found = true;
        break;
      }
    }
    
    // Synonym match
    if (!found) {
      const inputSynonyms = getIngredientSynonyms(inputIng);
      for (const recipeIng of normalizedRecipe) {
        const recipeSynonyms = getIngredientSynonyms(recipeIng);
        if (inputSynonyms.some(s => recipeSynonyms.includes(s))) {
          matchedCount++;
          found = true;
          break;
        }
      }
    }
    
    // Partial match (substring)
    if (!found) {
      for (const recipeIng of normalizedRecipe) {
        if (recipeIng.includes(inputIng) || inputIng.includes(recipeIng)) {
          partialMatches++;
          found = true;
          break;
        }
      }
    }
  }
  
  const totalIngredients = normalizedRecipe.length;
  const score = totalIngredients > 0
    ? (matchedCount * 2 + partialMatches * 1) / (totalIngredients * 2)
    : 0;
  
  return { matchedCount, partialMatches, totalIngredients, score };
}

interface SearchRequest {
  ingredients: string[];
  limit?: number;
  offset?: number;
}

interface RecipeResult {
  recipe_id: string;
  title: string;
  image_url: string | null;
  score: number;
  matched: string[];
  total_ingredients: number;
  cuisine: string | null;
  difficulty: string | null;
  time_min: number | null;
  rating: number | null;
}

interface SearchResponse {
  results: RecipeResult[];
  total: number;
  limit: number;
  offset: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Supabase configuration missing",
          results: [],
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: SearchRequest = await req.json();
    const inputIngredients: string[] = body.ingredients || [];
    const limit = Math.min(body.limit || 20, 100); // Max 100 results
    const offset = body.offset || 0;

    if (!Array.isArray(inputIngredients) || inputIngredients.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Ingredients array is required and cannot be empty",
          results: [],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normalize input ingredients
    const normalizedInput = inputIngredients.map(normalizeIngredient);
    
    // Expand with synonyms for better matching
    const expandedInput: string[] = [];
    for (const ing of normalizedInput) {
      expandedInput.push(ing);
      expandedInput.push(...getIngredientSynonyms(ing));
    }
    const uniqueInput = [...new Set(expandedInput)];

    console.log(`Searching recipes for ingredients: ${inputIngredients.join(", ")}`);

    // Step 1: Find candidate recipes using GIN index (fast overlap query)
    // Using array overlap operator && to find recipes with any matching ingredients
    const { data: candidates, error: queryError } = await supabase
      .from("recipes")
      .select("id, title, image_url, ingredients_arr, cuisine, difficulty, time_min, rating")
      .not("ingredients_arr", "eq", "{}") // Exclude recipes with no ingredients
      .or(`ingredients_arr.cs.{${uniqueInput.join(",")}}`); // Contains any of the input ingredients

    if (queryError) {
      console.error("Database query error:", queryError);
      return new Response(
        JSON.stringify({
          error: "Database query failed",
          message: queryError.message,
          results: [],
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({
          results: [],
          total: 0,
          limit,
          offset,
        } as SearchResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Calculate scores for each candidate
    const scoredRecipes: RecipeResult[] = [];
    
    for (const recipe of candidates) {
      const recipeIngredients = recipe.ingredients_arr || [];
      const { matchedCount, partialMatches, totalIngredients, score } = calculateScore(
        inputIngredients,
        recipeIngredients
      );
      
      // Only include recipes with at least one match
      if (matchedCount > 0 || partialMatches > 0) {
        // Find which ingredients matched
        const matched: string[] = [];
        for (const inputIng of inputIngredients) {
          for (const recipeIng of recipeIngredients) {
            if (ingredientsMatch(inputIng, recipeIng)) {
              matched.push(recipeIng);
              break;
            }
          }
        }
        
        scoredRecipes.push({
          recipe_id: recipe.id,
          title: recipe.title,
          image_url: recipe.image_url,
          score,
          matched,
          total_ingredients: totalIngredients,
          cuisine: recipe.cuisine,
          difficulty: recipe.difficulty,
          time_min: recipe.time_min,
          rating: recipe.rating ? Number(recipe.rating) : null,
        });
      }
    }

    // Step 3: Sort by score (descending) and apply pagination
    scoredRecipes.sort((a, b) => b.score - a.score);
    
    const total = scoredRecipes.length;
    const paginatedResults = scoredRecipes.slice(offset, offset + limit);

    console.log(`Found ${total} matching recipes, returning ${paginatedResults.length}`);

    return new Response(
      JSON.stringify({
        results: paginatedResults,
        total,
        limit,
        offset,
      } as SearchResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        results: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

