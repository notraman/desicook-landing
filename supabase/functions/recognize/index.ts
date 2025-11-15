// Supabase Edge Function: Image Recognition with Recipe Generation
// Accepts multiple images (up to 4) and sends directly to Gemini for recipe suggestions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// API Keys
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
  source: "gemini";
  recipes: RecipeSuggestion[];
  detectedIngredients?: string[];
  error?: string;
  message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse form data
    const formData = await req.formData();
    
    // Get all image files (up to 4)
    const imageFiles: File[] = [];
    for (let i = 0; i < 4; i++) {
      const imageFile = formData.get(`image${i === 0 ? '' : i}`) as File;
      if (imageFile) {
        imageFiles.push(imageFile);
      }
    }
    
    // Also check for single "image" field (backward compatibility)
    if (imageFiles.length === 0) {
      const singleImage = formData.get("image") as File;
      if (singleImage) {
        imageFiles.push(singleImage);
      }
    }

    if (imageFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No image files provided", 
          recipes: [], 
          source: "gemini" 
        } as ResponseData),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (imageFiles.length > 4) {
      return new Response(
        JSON.stringify({ 
          error: "Maximum 4 images allowed", 
          recipes: [], 
          source: "gemini" 
        } as ResponseData),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate all files
    for (const imageFile of imageFiles) {
      if (imageFile.size > 5 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ 
            error: `Image ${imageFile.name} is too large (max 5MB)`, 
            recipes: [], 
            source: "gemini" 
          } as ResponseData),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    console.info(`Processing ${imageFiles.length} image(s) for recipe generation...`);

    // Convert all images to base64
    const imageParts: Array<{ inline_data: { mime_type: string; data: string } }> = [];
    
    for (const imageFile of imageFiles) {
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
      
      imageParts.push({
        inline_data: {
          mime_type: imageFile.type || "image/jpeg",
          data: base64Image,
        },
      });
    }

    // Create prompt for Gemini to analyze images and generate recipes
    const geminiPrompt = `Analyze the provided food image(s) and create delicious recipe suggestions based on the visible ingredients.

${imageFiles.length > 1 ? `You have ${imageFiles.length} images showing different ingredients or dishes. Analyze all of them together.` : 'Analyze this food image.'}

First, identify ALL visible ingredients in the image(s). Then, suggest 3-5 creative and practical recipes that can be made using these ingredients.

For each recipe, provide:
1. A creative, appetizing title
2. A brief description (1-2 sentences)
3. Complete list of ingredients (include the detected ingredients plus common pantry items needed)
4. Step-by-step cooking instructions (4-8 steps, detailed)
5. Estimated cooking time in minutes
6. Difficulty level (Easy, Medium, or Hard)
7. Cuisine type (e.g., Indian, Italian, Asian, American, etc.)
8. Tags (e.g., vegetarian, quick, healthy, spicy, gluten-free, etc.)

Return ONLY a valid JSON object with this exact format:
{
  "detectedIngredients": ["ingredient1", "ingredient2", ...],
  "recipes": [
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
}

Make recipes practical, delicious, and use the detected ingredients as the main components. Be creative but realistic.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for multiple images

    // Build the request with text prompt + all images
    const requestBody = {
      contents: [{
        parts: [
          { text: geminiPrompt },
          ...imageParts,
        ],
      }],
    };

    console.info("Sending request to Gemini with", imageFiles.length, "image(s)...");

    const geminiResponse = await fetch(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    // Handle 404 - try fallback models
    if (geminiResponse.status === 404) {
      console.info("Gemini model returned 404, trying fallback models...");
      
      // Try gemini-1.5-pro
      const fallbackEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), 60000);
      
      try {
        const fallbackResponse = await fetch(
          `${fallbackEndpoint}?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: fallbackController.signal,
          }
        );
        clearTimeout(fallbackTimeout);
        
        if (fallbackResponse.ok) {
          return await processGeminiResponse(fallbackResponse);
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
          source: "gemini",
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

    return await processGeminiResponse(geminiResponse);
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        recipes: [],
        source: "gemini",
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
async function processGeminiResponse(response: Response): Promise<Response> {
  const geminiText = await response.text();
  const geminiData = JSON.parse(geminiText);
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

  console.info("Gemini response received, length:", text.length);

  if (!text) {
    return new Response(
      JSON.stringify({
        source: "gemini",
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

  // Extract JSON object from response
  let jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonMatch = [jsonMatch[1]];
    }
  }

  if (jsonMatch && jsonMatch[0]) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      const detectedIngredients: string[] = Array.isArray(parsed.detectedIngredients) 
        ? parsed.detectedIngredients.map((ing: string) => String(ing).toLowerCase().trim())
        : [];
      
      const recipes: RecipeSuggestion[] = Array.isArray(parsed.recipes)
        ? parsed.recipes.map((recipe: Record<string, unknown>) => ({
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
        console.info(`✅ Generated ${recipes.length} recipes with ${detectedIngredients.length} detected ingredients`);
        return new Response(
          JSON.stringify({
            source: "gemini",
            recipes,
            detectedIngredients,
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
      source: "gemini",
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
