# Image Recognition Edge Function

This Supabase Edge Function handles secure image recognition using HuggingFace (primary) and Gemini Vision (fallback).

## Setup

1. **Set Environment Variables (Secrets)**

   In your Supabase project dashboard, go to **Settings → Edge Functions → Secrets** and add:

   - `VITE_HF_API_KEY`: Your HuggingFace API key
   - `VITE_GEMINI_API_KEY`: Your Google Gemini API key

   Or use Supabase CLI:

   ```bash
   supabase secrets set VITE_HF_API_KEY=your_huggingface_key
   supabase secrets set VITE_GEMINI_API_KEY=your_gemini_key
   ```

2. **Deploy the Function**

   ```bash
   supabase functions deploy recognize
   ```

## API

### Endpoint

`POST /functions/v1/recognize`

### Request

- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `image` field containing the image file
- **Headers**: 
  - `Authorization: Bearer <supabase_anon_key>`

### Response

```json
{
  "source": "huggingface" | "gemini" | "none",
  "predictions": [
    {
      "item": "tomato",
      "confidence": 0.92
    },
    ...
  ],
  "message": "Optional error or info message"
}
```

### Behavior

1. Validates image (type, size < 2MB)
2. Tries HuggingFace first
3. If top confidence ≥ 0.85, returns HF results
4. Otherwise, falls back to Gemini Vision
5. Returns predictions sorted by confidence

### Error Handling

- Returns 400 for invalid requests (no file, wrong type, too large)
- Returns 500 for server errors
- Returns 200 with empty predictions if detection fails

