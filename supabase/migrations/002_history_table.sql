-- Create recipe_history table to track viewed recipes
CREATE TABLE IF NOT EXISTS public.recipe_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipe_id TEXT NOT NULL,
  recipe_data JSONB,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS
ALTER TABLE public.recipe_history ENABLE ROW LEVEL SECURITY;

-- History RLS Policies
CREATE POLICY "Users can view their own history"
  ON public.recipe_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON public.recipe_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
  ON public.recipe_history FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS recipe_history_user_id_idx ON public.recipe_history(user_id);
CREATE INDEX IF NOT EXISTS recipe_history_viewed_at_idx ON public.recipe_history(viewed_at DESC);
CREATE INDEX IF NOT EXISTS recipe_history_recipe_id_idx ON public.recipe_history(recipe_id);

