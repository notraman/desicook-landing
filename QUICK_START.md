# Quick Start - Get Recipes Running in 5 Minutes

## 🎯 Three Simple Steps

### Step 1: Run Database Migration (2 minutes)

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the SQL below and paste it:

```sql
-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  ingredients_arr TEXT[] DEFAULT '{}',
  time_min INTEGER,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  servings INTEGER,
  cuisine TEXT,
  tags TEXT[] DEFAULT '{}',
  nutrition JSONB,
  steps TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recipe_ingredients join table
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
  quantity TEXT,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, ingredient_id)
);

-- Create GIN index on ingredients_arr for fast overlap queries
CREATE INDEX IF NOT EXISTS recipes_ingredients_arr_gin_idx ON public.recipes USING GIN (ingredients_arr);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS recipes_cuisine_idx ON public.recipes(cuisine);
CREATE INDEX IF NOT EXISTS recipes_difficulty_idx ON public.recipes(difficulty);
CREATE INDEX IF NOT EXISTS recipes_rating_idx ON public.recipes(rating);
CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_id_idx ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS recipe_ingredients_ingredient_id_idx ON public.recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS ingredients_name_idx ON public.ingredients(name);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes (public read, admin write)
CREATE POLICY "Recipes are viewable by everyone"
  ON public.recipes FOR SELECT
  USING (true);

-- RLS Policies for ingredients (public read, admin write)
CREATE POLICY "Ingredients are viewable by everyone"
  ON public.ingredients FOR SELECT
  USING (true);

-- RLS Policies for recipe_ingredients (public read, admin write)
CREATE POLICY "Recipe ingredients are viewable by everyone"
  ON public.recipe_ingredients FOR SELECT
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

6. Click **Run** (or press Ctrl+Enter)
7. You should see: "Success. No rows returned" ✅

---

### Step 2: Configure Environment Variables (1 minute)

1. Open `.env` file in project root
2. Add your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these:**
- Go to Supabase Dashboard → Settings → API
- Copy "Project URL" → `SUPABASE_URL`
- Copy "service_role" key (not anon key!) → `SUPABASE_SERVICE_ROLE_KEY`

**Optional (for better images):**
```env
UNSPLASH_ACCESS_KEY=your-key-here
PEXELS_API_KEY=your-key-here
```

---

### Step 3: Run ETL Script (2 minutes)

Open terminal in project root and run:

```bash
node etl/seed_recipes.js --sample
```

**Or use the PowerShell script:**
```powershell
.\setup-and-run.ps1
```

This will:
- ✅ Fetch images from free sources (Unsplash/Pexels/Pixabay)
- ✅ Upload images to Supabase Storage
- ✅ Insert 25 sample recipes into database
- ✅ Normalize and link ingredients

**Expected output:**
```
✅ ETL completed successfully!
Total recipes: 25
✅ Inserted: 25
```

---

### Step 4: Deploy Edge Function (Optional - for fast search)

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **Create a new function**
3. Name: `search-by-ingredients`
4. Copy code from: `supabase/functions/search-by-ingredients/index.ts`
5. Paste and click **Deploy**

**Note:** Frontend will work without this (uses client-side matching), but search will be faster with the Edge Function.

---

## ✅ Verify It Works

1. Start your dev server: `npm run dev`
2. Open browser
3. You should see recipes loading from Supabase! 🎉

---

## 🐛 Troubleshooting

**ETL fails?**
- Check `.env` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify migration was run (check Supabase Table Editor for `recipes` table)

**No recipes showing?**
- Check browser console for errors
- Verify recipes exist in Supabase Dashboard → Table Editor
- Check `recipes` table has data

**Images not loading?**
- Check Supabase Storage → `recipes-images` bucket exists
- Verify bucket is public (Settings → Public)

---

## 📚 More Help

- Detailed guide: `SETUP_GUIDE.md`
- ETL documentation: `README.md` (Recipe Database ETL section)

