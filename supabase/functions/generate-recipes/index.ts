// Supabase Edge Function: Recipe Generation using Gemini AI
// Takes ingredients as input and generates recipes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// API Key
const GEMINI_API_KEY = "AIzaSyCxhTawTBvL6gnJ5pu4WRtGyL9qZRoQQoU";

// Gemini endpoint
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface RecipeSuggestion {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  cookingTime: number;
  difficulty: "Easy" | "Medium" | "Hard";
  cuisine?: string;
  tags?: string[];
}

interface ResponseData {
  recipes: RecipeSuggestion[];
  error?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    let ingredients: string[] = [];
    let count: number = 3;

    // Parse request body
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const body = await req.json();
      ingredients = body.ingredients || [];
      count = body.count || 3;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const ingredientsParam = formData.get("ingredients");
      if (ingredientsParam) {
        ingredients = typeof ingredientsParam === "string" 
          ? JSON.parse(ingredientsParam)
          : Array.isArray(ingredientsParam)
          ? Array.from(ingredientsParam).map(String)
          : [];
      }
      const countParam = formData.get("count");
      count = countParam ? parseInt(String(countParam)) : 3;
    } else {
      // Try to parse as JSON anyway
      try {
        const body = await req.json();
        ingredients = body.ingredients || [];
        count = body.count || 3;
      } catch (e) {
        return new Response(
          JSON.stringify({
            error: "Invalid request format",
            message: "Please send JSON with ingredients array",
            recipes: [],
          } as ResponseData),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Validate ingredients
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Ingredients array is required and cannot be empty",
          message: "Please provide at least one ingredient",
          recipes: [],
        } as ResponseData),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate count
    if (count < 1 || count > 10) {
      count = 3; // Default to 3
    }

    console.info(`Generating ${count} recipes for ingredients:`, ingredients.join(", "));

    // Create prompt for Gemini
    const prompt = `You are a professional chef and recipe creator. Based on these ingredients: ${ingredients.join(", ")}, suggest ${count} delicious and practical recipes.

For each recipe, provide:
1. A creative, appetizing title
2. A brief description (1-2 sentences)
3. Complete list of ingredients (include the provided ingredients plus common pantry items needed)
4. Step-by-step cooking instructions (4-8 steps, detailed)
5. Estimated cooking time in minutes
6. Difficulty level (Easy, Medium, or Hard)
7. Cuisine type (e.g., Indian, Italian, Asian, American, etc.)
8. Tags (e.g., vegetarian, quick, healthy, spicy, gluten-free, etc.)

Return ONLY a valid JSON array with this exact format:
[
  {
    "title": "Recipe Name",
    "description": "Brief description",
    "ingredients": ["ingredient1", "ingredient2", ...],
    "steps": ["Step 1", "Step 2", ...],
    "cookingTime": 30,
    "difficulty": "Medium",
    "cuisine": "Indian",
    "tags": ["vegetarian", "quick"]
  },
  ...
]

Make recipes practical, delicious, and use the provided ingredients as the main components. Be creative but realistic.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const geminiResponse = await fetch(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }],
          }],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    // Handle 404 - try fallback models
    if (geminiResponse.status === 404) {
      console.info("Gemini model returned 404, trying fallback models...");
      
      const fallbackEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), 30000);
      
      try {
        const fallbackResponse = await fetch(
          `${fallbackEndpoint}?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }],
              }],
            }),
            signal: fallbackController.signal,
          }
        );
        clearTimeout(fallbackTimeout);
        
        if (fallbackResponse.ok) {
          return await processGeminiResponse(fallbackResponse, count);
        }
      } catch (fallbackErr) {
        console.error("Fallback model fetch failed:", fallbackErr);
      }
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini returned status ${geminiResponse.status}:`, errorText.substring(0, 500));
      
      return new Response(
        JSON.stringify({
          recipes: [],
          error: `Gemini API error: ${geminiResponse.statusText}`,
          message: "Failed to generate recipes. Please try again.",
        } as ResponseData),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return await processGeminiResponse(geminiResponse, count);
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        recipes: [],
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ResponseData),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Process Gemini response and extract recipes
 */
async function processGeminiResponse(response: Response, maxCount: number): Promise<Response> {
  const geminiText = await response.text();
  const geminiData = JSON.parse(geminiText);
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

  console.info("Gemini response received, length:", text.length);

  if (!text) {
    return new Response(
      JSON.stringify({
        recipes: [],
        error: "Gemini returned empty response",
        message: "Could not generate recipes. Please try again.",
      } as ResponseData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Extract JSON array from response
  let jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    jsonMatch = text.match(/```json\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      jsonMatch = [jsonMatch[1]];
    }
  }

  if (jsonMatch && jsonMatch[0]) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      const recipes: RecipeSuggestion[] = Array.isArray(parsed)
        ? parsed.slice(0, maxCount).map((recipe: Record<string, unknown>) => ({
            title: String(recipe.title || "Untitled Recipe"),
            description: String(recipe.description || ""),
            ingredients: Array.isArray(recipe.ingredients) 
              ? recipe.ingredients.map((ing: unknown) => String(ing))
              : [],
            steps: Array.isArray(recipe.steps)
              ? recipe.steps.map((step: unknown) => String(step))
              : [],
            cookingTime: Number(recipe.cookingTime) || 30,
            difficulty: ["Easy", "Medium", "Hard"].includes(String(recipe.difficulty))
              ? (recipe.difficulty as "Easy" | "Medium" | "Hard")
              : "Medium",
            cuisine: String(recipe.cuisine || "International"),
            tags: Array.isArray(recipe.tags)
              ? recipe.tags.map((tag: unknown) => String(tag))
              : [],
          }))
        : [];

      if (recipes.length > 0) {
        console.info(`✅ Generated ${recipes.length} recipes`);
        return new Response(
          JSON.stringify({
            recipes,
          } as ResponseData),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", parseError);
      console.error("Response text (first 1000 chars):", text.substring(0, 1000));
    }
  }

  // If parsing failed, return error
  return new Response(
    JSON.stringify({
      recipes: [],
      error: "Failed to parse recipe response",
      message: "Could not parse recipes from AI response. Please try again.",
    } as ResponseData),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

