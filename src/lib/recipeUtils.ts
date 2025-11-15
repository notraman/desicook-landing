interface Recipe {
  id: string;
  title: string;
  ingredients?: string[];
  tags?: string[];
  cuisine?: string;
  rating?: number;
}

/**
 * Filter recipes by selected ingredients (AND logic - all selected ingredients must be present)
 */
export function filterRecipesByIngredients(recipes: Recipe[], selectedIngredients: string[]): Recipe[] {
  if (selectedIngredients.length === 0) {
    return recipes;
  }

  return recipes.filter(recipe => {
    const recipeIngredients = (recipe.ingredients || []).map(ing => ing.toLowerCase());
    return selectedIngredients.every(selected => 
      recipeIngredients.some(ing => ing.includes(selected.toLowerCase()))
    );
  });
}

/**
 * Get unique ingredients from all recipes
 */
export function getAllIngredients(recipes: Recipe[]): string[] {
  const ingredientSet = new Set<string>();
  
  recipes.forEach(recipe => {
    (recipe.ingredients || []).forEach(ing => {
      ingredientSet.add(ing.toLowerCase());
    });
  });

  return Array.from(ingredientSet).sort();
}

/**
 * Get top-rated recipes
 */
export function getTopRatedRecipes(recipes: Recipe[], limit: number = 6): Recipe[] {
  return [...recipes]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}

/**
 * Get recipes by cuisine
 */
export function getRecipesByCuisine(recipes: Recipe[], cuisine: string): Recipe[] {
  return recipes.filter(recipe => 
    recipe.cuisine?.toLowerCase() === cuisine.toLowerCase()
  );
}

/**
 * Get recipes by tags
 */
export function getRecipesByTags(recipes: Recipe[], tags: string[]): Recipe[] {
  if (tags.length === 0) return recipes;
  
  return recipes.filter(recipe => {
    const recipeTags = (recipe.tags || []).map(t => t.toLowerCase());
    return tags.some(tag => recipeTags.includes(tag.toLowerCase()));
  });
}

