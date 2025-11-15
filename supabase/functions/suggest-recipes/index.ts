// Supabase Edge Function: Recipe Suggestions using Gemini
// Handles image recognition and recipe suggestions using Gemini AI

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Free tier Gemini models: gemini-1.5-flash, gemini-1.5-pro, gemini-pro
// Using gemini-1.5-flash (fast, available on free tier)
const GEMINI_ENDPOINT = Deno.env.get("GEMINI_ENDPOINT") || 
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
  suggestions: RecipeSuggestion[];
  detectedIngredients?: string[];
  error?: string;
  message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get API key from environment or use provided key
    // Note: For production, set GEMINI_API_KEY as a Supabase secret instead of hardcoding
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || 
      "AIzaSyCM_Ssl9EugJoQk1ELo8ymw56t4PZcuS1o";

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Gemini API key not configured",
          suggestions: [],
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let ingredients: string[] = [];
    let count: number = 3;
    let imageFile: File | null = null;

    // Check if request contains form data (image upload)
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Handle image upload
      const formData = await req.formData();
      imageFile = formData.get("image") as File;
      const countParam = formData.get("count");
      count = countParam ? parseInt(String(countParam)) : 3;
      
      // If image provided, detect ingredients first
      if (imageFile) {
        console.log("Image provided, detecting ingredients with Gemini Vision...");
        ingredients = await detectIngredientsFromImage(imageFile, GEMINI_API_KEY);
        
        if (ingredients.length === 0) {
          return new Response(
            JSON.stringify({
              error: "Could not detect ingredients from image. Please try a clearer image or provide ingredients manually.",
              suggestions: [],
              detectedIngredients: [],
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        console.log(`Detected ${ingredients.length} ingredients from image:`, ingredients);
      }
    } else {
      // Handle JSON request
      const body = await req.json();
      ingredients = body.ingredients || [];
      count = body.count || 3;
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Ingredients array is required and cannot be empty. Either provide an image or an ingredients array.",
          suggestions: [],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating ${count} recipe suggestions for ingredients:`, ingredients);

    // Create prompt for Gemini
    const prompt = `You are a professional chef and recipe creator. Based on these ingredients: ${ingredients.join(", ")}, suggest ${count} delicious and practical recipes.

For each recipe, provide:
1. A creative, appetizing title
2. A brief description (1-2 sentences)
3. Complete list of ingredients (include the provided ingredients plus common pantry items)
4. Step-by-step cooking instructions (4-6 steps)
5. Estimated cooking time in minutes
6. Difficulty level (Easy, Medium, or Hard)
7. Cuisine type (e.g., Indian, Italian, Asian, American, etc.)
8. Tags (e.g., vegetarian, quick, healthy, spicy, etc.)

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

Make recipes practical, delicious, and use the provided ingredients as the main components.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    let response = await fetch(
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

    // Handle 404 - try fallback models (for free tier compatibility)
    if (response.status === 404) {
      console.info("Gemini model returned 404, trying fallback models...");
      
      // Try gemini-1.5-pro
      if (GEMINI_ENDPOINT.includes("gemini-1.5-flash")) {
        console.info("Trying fallback: gemini-1.5-pro");
        const fallbackEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 30000);
        
        try {
          response = await fetch(
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
          
          // If still 404, try gemini-pro
          if (response.status === 404) {
            console.info("Trying fallback: gemini-pro");
            const legacyEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
            const legacyController = new AbortController();
            const legacyTimeout = setTimeout(() => legacyController.abort(), 30000);
            
            response = await fetch(
              `${legacyEndpoint}?key=${GEMINI_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{
                    parts: [{ text: prompt }],
                  }],
                }),
                signal: legacyController.signal,
              }
            );
            clearTimeout(legacyTimeout);
          }
        } catch (fallbackErr) {
          console.error("Fallback model fetch failed:", fallbackErr);
        }
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText.substring(0, 500));
      
      // Provide helpful error message for 404
      if (response.status === 404) {
        return new Response(
          JSON.stringify({
            error: "Gemini model not found. Please check your API key has access to Gemini 1.5 models. Free tier supports: gemini-1.5-flash, gemini-1.5-pro",
            suggestions: [],
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          error: `Gemini API error: ${response.statusText}`,
          suggestions: [],
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("Gemini response (first 500 chars):", text.substring(0, 500));

    // Extract JSON array from response
    let suggestions: RecipeSuggestion[] = [];
    
    try {
      // Try to find JSON array in the response
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          suggestions = parsed.slice(0, count).map((recipe: Record<string, unknown>) => ({
            title: recipe.title || "Untitled Recipe",
            description: recipe.description || "",
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
            steps: Array.isArray(recipe.steps) ? recipe.steps : [],
            cookingTime: Number(recipe.cookingTime) || 30,
            difficulty: ["Easy", "Medium", "Hard"].includes(recipe.difficulty) 
              ? recipe.difficulty 
              : "Medium",
            cuisine: recipe.cuisine || "International",
            tags: Array.isArray(recipe.tags) ? recipe.tags : [],
          }));
        }
      } else {
        // Try parsing entire text as JSON
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          suggestions = parsed;
        }
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.error("Raw response:", text);
      return new Response(
        JSON.stringify({
          error: "Failed to parse recipe suggestions from AI response",
          message: "The AI response format was unexpected. Please try again.",
          suggestions: [],
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (suggestions.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No recipe suggestions generated",
          message: "Could not generate recipes. Please try again with different ingredients.",
          suggestions: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        suggestions,
        detectedIngredients: imageFile ? ingredients : undefined,
      } as ResponseData),
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
        suggestions: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Detect ingredients from an image using Gemini Vision API
 */
async function detectIngredientsFromImage(
  imageFile: File,
  apiKey: string
): Promise<string[]> {
  try {
    // Validate file
    if (imageFile.size > 5 * 1024 * 1024) {
      throw new Error("Image too large (max 5MB)");
    }

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);
    
    let base64Image: string;
    try {
      let binaryString = '';
      for (let i = 0; i < imageBytes.length; i++) {
        binaryString += String.fromCharCode(imageBytes[i]);
      }
      base64Image = btoa(binaryString);
    } catch (base64Error) {
      // Fallback: chunked approach for large images
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < imageBytes.length; i += chunkSize) {
        const chunk = imageBytes.slice(i, i + chunkSize);
        for (let j = 0; j < chunk.length; j++) {
          binaryString += String.fromCharCode(chunk[j]);
        }
      }
      base64Image = btoa(binaryString);
    }

    console.info("Image converted to base64, length:", base64Image.length);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const geminiPrompt = `Analyze this food image and identify ALL visible ingredients. 
Return ONLY a valid JSON array with this exact format:
[{"item":"ingredient_name","confidence":0.95}]

Rules:
- Use lowercase ingredient names (e.g., "tomato" not "Tomato")
- Only include ingredients you can clearly see in the image
- Confidence should reflect certainty (0.7-1.0)
- Include vegetables, fruits, meats, spices, herbs, grains, dairy products
- Skip generic terms like "food", "dish", "meal", "plate"
- Return at least 3-5 ingredients if visible
- Be specific: "bell pepper" not just "pepper", "chicken breast" not just "chicken"

Example: [{"item":"carrot","confidence":0.9},{"item":"celery","confidence":0.85},{"item":"bell pepper","confidence":0.8},{"item":"cucumber","confidence":0.75}]`;

    let response = await fetch(
      `${GEMINI_ENDPOINT}?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: geminiPrompt },
              {
                inline_data: {
                  mime_type: imageFile.type || "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          }],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    // Handle 404 - try fallback models
    if (response.status === 404) {
      console.info("Gemini model returned 404, trying fallback models...");
      
      if (GEMINI_ENDPOINT.includes("gemini-1.5-flash")) {
        console.info("Trying fallback: gemini-1.5-pro");
        const fallbackEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 30000);
        
        try {
          response = await fetch(
            `${fallbackEndpoint}?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: geminiPrompt },
                    {
                      inline_data: {
                        mime_type: imageFile.type || "image/jpeg",
                        data: base64Image,
                      },
                    },
                  ],
                }],
              }),
              signal: fallbackController.signal,
            }
          );
          clearTimeout(fallbackTimeout);
          
          if (response.status === 404) {
            console.info("Trying fallback: gemini-pro");
            const legacyEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
            const legacyController = new AbortController();
            const legacyTimeout = setTimeout(() => legacyController.abort(), 30000);
            
            response = await fetch(
              `${legacyEndpoint}?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { text: geminiPrompt },
                      {
                        inline_data: {
                          mime_type: imageFile.type || "image/jpeg",
                          data: base64Image,
                        },
                      },
                    ],
                  }],
                }),
                signal: legacyController.signal,
              }
            );
            clearTimeout(legacyTimeout);
          }
        } catch (fallbackErr) {
          console.error("Fallback model fetch failed:", fallbackErr);
        }
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Vision API error:", response.status, errorText.substring(0, 500));
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      throw new Error("Gemini returned empty text");
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
        if (Array.isArray(parsed)) {
          const ingredients = parsed
            .filter((item: Record<string, unknown>) => item.item && typeof item.confidence === 'number')
            .map((item: Record<string, unknown>) => String(item.item).toLowerCase().trim())
            .filter((item: string) => item.length > 1)
            .slice(0, 15); // Limit to top 15 ingredients
          
          console.info(`✅ Detected ${ingredients.length} ingredients from image`);
          return ingredients;
        }
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);
        throw new Error("Failed to parse ingredient detection response");
      }
    }

    throw new Error("No ingredients found in Gemini response");
  } catch (error) {
    console.error("Image detection error:", error);
    return [];
  }
}

