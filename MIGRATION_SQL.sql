-- ============================================
-- RECIPE DATABASE MIGRATION
-- ============================================
-- Copy this entire file and paste into Supabase SQL Editor
-- Then click "Run" to create all tables and indexes
-- ============================================

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

-- ============================================
-- Migration complete!
-- You should see "Success. No rows returned"
-- ============================================

