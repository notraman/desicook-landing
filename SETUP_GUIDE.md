# Complete Setup Guide - Recipe Database ETL

This guide will walk you through setting up the recipe database, running the ETL, and deploying the search function.

## Prerequisites Checklist

- [x] Node.js 18+ installed (you have v22.18.0 ✅)
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Image API keys (optional but recommended)

---

## Step 1: Run Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/001_create_recipes.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

**Expected Result**: You should see "Success. No rows returned" - this means the tables were created successfully.

### Option B: Using Supabase CLI (if installed)

```bash
supabase db push
```

---

## Step 2: Configure Environment Variables

Create or update your `.env` file in the project root:

```env
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Image API Keys (OPTIONAL - but recommended for better images)
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
PEXELS_API_KEY=your-pexels-api-key
PIXABAY_API_KEY=your-pixabay-api-key
```

### Where to find these values:

1. **SUPABASE_URL**: 
   - Go to Supabase Dashboard → Settings → API
   - Copy "Project URL"

2. **SUPABASE_SERVICE_ROLE_KEY**:
   - Go to Supabase Dashboard → Settings → API
   - Copy "service_role" key (⚠️ Keep this secret!)
   - This is different from the "anon" key

3. **Image API Keys** (Get free keys):
   - **Unsplash**: https://unsplash.com/developers (50 requests/hour free)
   - **Pexels**: https://www.pexels.com/api/ (200 requests/hour free)
   - **Pixabay**: https://pixabay.com/api/docs/ (100 requests/hour free)

---

## Step 3: Run the ETL Script

### Test Mode (Recommended First)

This will seed 25 sample recipes to test everything works:

```bash
node etl/seed_recipes.js --sample
```

**Expected Output**:
```
🚀 Starting recipe seeding ETL...
Mode: SAMPLE
Concurrency: 3

📖 Loading sample recipes from: etl/recipes_sample.json
📊 Total recipes to process: 25

[1/25] Processing: Spiced Chickpea Curry
  🔍 Searching image for: "Spiced Chickpea Curry"
  ✅ Found image on Unsplash (free, public domain)
  ✅ Recipe inserted with ID: ...
  ✅ Processed 8 ingredients

...

📊 ETL Summary
==================================================
Total recipes:     25
✅ Inserted:        25
⏭️  Skipped:         0
❌ Failed:          0

📸 Image Statistics (all free/public domain):
   Unsplash:        20
   Pexels:          3
   Pixabay:         0
   Public Domain:   2
   Failed:          0
==================================================

✅ ETL completed successfully!
```

### Full Mode (After testing)

Once test mode works, run with all recipes:

```bash
node etl/seed_recipes.js --full
```

---

## Step 4: Deploy Edge Function

### Option A: Using Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **Create a new function**
3. Name it: `search-by-ingredients`
4. Copy the contents of `supabase/functions/search-by-ingredients/index.ts`
5. Paste into the editor
6. Click **Deploy**

### Option B: Using Supabase CLI

First, install Supabase CLI:

**Windows (PowerShell)**:
```powershell
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm
npm install -g supabase
```

**Mac/Linux**:
```bash
brew install supabase/tap/supabase
```

Then deploy:
```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy search-by-ingredients
```

### Option C: Manual Deployment via Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Click "Create Function"
3. Name: `search-by-ingredients`
4. Copy code from `supabase/functions/search-by-ingredients/index.ts`
5. Set environment variables:
   - `SUPABASE_URL` (auto-set)
   - `SUPABASE_SERVICE_ROLE_KEY` (add manually)

---

## Step 5: Verify Everything Works

### Check Database

1. Go to Supabase Dashboard → **Table Editor**
2. You should see:
   - `recipes` table with your recipes
   - `ingredients` table with normalized ingredients
   - `recipe_ingredients` table with relationships

### Check Images

1. Go to Supabase Dashboard → **Storage**
2. You should see `recipes-images` bucket
3. Images should be in `recipes/` folder

### Test Frontend

1. Start your dev server: `npm run dev`
2. Open the app in browser
3. You should see recipes loading from Supabase
4. Try searching by ingredients - it should use the Edge Function

---

## Troubleshooting

### ETL Fails: "Missing Supabase environment variables"
- Check `.env` file exists and has correct variable names
- Restart terminal/IDE after creating `.env`

### ETL Fails: "Failed to upload image"
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct (service_role, not anon)
- Verify Storage bucket `recipes-images` exists (ETL creates it automatically)

### No recipes showing in frontend
- Check browser console for errors
- Verify recipes exist in Supabase Table Editor
- Check RLS policies allow public read access

### Search is slow or not working
- Verify Edge Function is deployed
- Check Edge Function logs in Supabase Dashboard
- Frontend will fallback to client-side matching if API fails

### Images not loading
- Check Supabase Storage bucket is public
- Verify image URLs in `recipes.image_url` column
- Check browser network tab for 404 errors

---

## Next Steps

After setup is complete:

1. ✅ Recipes are in Supabase
2. ✅ Images are in Storage
3. ✅ Search API is deployed
4. ✅ Frontend is connected

You can now:
- Add more recipes by running ETL again (it's idempotent)
- Customize recipes in Supabase
- Add more ingredients
- Test the search functionality

---

## Quick Reference

```bash
# Test ETL with sample recipes
node etl/seed_recipes.js --sample

# Full ETL with all recipes
node etl/seed_recipes.js --full

# ETL with custom concurrency
node etl/seed_recipes.js --full --concurrency=5

# Check Supabase connection
# (Test in browser console or use Supabase Dashboard)
```

---

## Support

If you encounter issues:
1. Check the error messages in the console
2. Verify all environment variables are set
3. Check Supabase Dashboard for any errors
4. Review the README.md for detailed documentation

