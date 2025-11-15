# Recipe Generation Edge Function

This Supabase Edge Function generates recipes using Gemini AI based on provided ingredients.

## Setup

1. **Deploy the Function**

   ```bash
   supabase functions deploy generate-recipes
   ```

2. **API Key**

   The Gemini API key is hardcoded in the function. For production, consider moving it to Supabase secrets:

   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_key
   ```

   Then update the function to read from environment:
   ```typescript
   const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "fallback_key";
   ```

## API

### Endpoint

`POST /functions/v1/generate-recipes`

### Request

- **Content-Type**: `application/json`
- **Headers**: 
  - `Authorization: Bearer <supabase_anon_key>` (if using Supabase URL)

- **Body**:
```json
{
  "ingredients": ["tomato", "onion", "garlic"],
  "count": 3
}
```

### Response

```json
{
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
    }
  ]
}
```

## CORS

The function handles CORS preflight requests automatically. All responses include proper CORS headers.



