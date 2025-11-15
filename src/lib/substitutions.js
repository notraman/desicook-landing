/**
 * Ingredient substitution/synonym mappings
 * Maps common ingredient names to their canonical forms
 */
export const substitutions = {
  // Alliums
  "scallion": ["spring onion", "spring-onion", "green onion"],
  "spring onion": ["scallion", "green onion"],
  "green onion": ["scallion", "spring onion"],
  "spring-onion": ["scallion", "spring onion"],
  
  // Herbs
  "cilantro": ["coriander", "coriander leaves"],
  "coriander": ["cilantro", "coriander leaves"],
  "coriander leaves": ["cilantro", "coriander"],
  
  // Legumes
  "chickpea": ["garbanzo bean", "garbanzo", "chick peas"],
  "garbanzo bean": ["chickpea", "garbanzo", "chick peas"],
  "garbanzo": ["chickpea", "garbanzo bean", "chick peas"],
  "chick peas": ["chickpea", "garbanzo bean", "garbanzo"],
  
  // Vegetables
  "capsicum": ["bell pepper", "sweet pepper"],
  "bell pepper": ["capsicum", "sweet pepper"],
  "sweet pepper": ["capsicum", "bell pepper"],
  "aubergine": ["eggplant", "brinjal"],
  "eggplant": ["aubergine", "brinjal"],
  "brinjal": ["eggplant", "aubergine"],
  "courgette": ["zucchini"],
  "zucchini": ["courgette"],
  
  // Spices & Seasonings
  "rock salt": ["sea salt", "kosher salt"],
  "sea salt": ["rock salt", "kosher salt"],
  "kosher salt": ["rock salt", "sea salt"],
  "black pepper": ["pepper", "ground pepper"],
  "pepper": ["black pepper", "ground pepper"],
  
  // Dairy
  "heavy cream": ["double cream", "whipping cream"],
  "double cream": ["heavy cream", "whipping cream"],
  "whipping cream": ["heavy cream", "double cream"],
  "single cream": ["light cream"],
  "light cream": ["single cream"],
  
  // Grains
  "all-purpose flour": ["plain flour", "maida"],
  "plain flour": ["all-purpose flour", "maida"],
  "maida": ["all-purpose flour", "plain flour"],
  
  // Oils & Fats
  "vegetable oil": ["cooking oil", "neutral oil"],
  "cooking oil": ["vegetable oil", "neutral oil"],
  "neutral oil": ["vegetable oil", "cooking oil"],
  
  // Proteins
  "minced meat": ["ground meat", "mince"],
  "ground meat": ["minced meat", "mince"],
  "mince": ["minced meat", "ground meat"],
  "ground beef": ["minced beef", "beef mince"],
  "minced beef": ["ground beef", "beef mince"],
  "beef mince": ["ground beef", "minced beef"],
  
  // Others
  "tomato puree": ["tomato paste", "tomato sauce"],
  "tomato paste": ["tomato puree", "tomato sauce"],
  "tomato sauce": ["tomato puree", "tomato paste"],
  "baking soda": ["bicarbonate of soda", "sodium bicarbonate"],
  "bicarbonate of soda": ["baking soda", "sodium bicarbonate"],
  "sodium bicarbonate": ["baking soda", "bicarbonate of soda"],
};

/**
 * Get all synonyms for an ingredient (including the ingredient itself)
 * @param {string} ingredient - The ingredient name
 * @returns {string[]} Array of all possible names for this ingredient
 */
export function getIngredientSynonyms(ingredient) {
  const normalized = normalizeIngredient(ingredient);
  const synonyms = [normalized];
  
  // Add direct substitutions
  if (substitutions[normalized]) {
    synonyms.push(...substitutions[normalized]);
  }
  
  // Check reverse mappings
  for (const [key, values] of Object.entries(substitutions)) {
    if (values.includes(normalized)) {
      synonyms.push(key);
      synonyms.push(...values);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(synonyms)];
}

/**
 * Normalize ingredient name for matching
 * @param {string} ingredient - The ingredient name
 * @returns {string} Normalized ingredient name
 */
export function normalizeIngredient(ingredient) {
  if (!ingredient) return "";
  
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove punctuation except hyphens
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\bs\b/g, "") // Remove standalone 's' (simple pluralization)
    .trim();
}

/**
 * Check if two ingredients match (considering substitutions)
 * @param {string} ingredient1 - First ingredient
 * @param {string} ingredient2 - Second ingredient
 * @returns {boolean} True if ingredients match
 */
export function ingredientsMatch(ingredient1, ingredient2) {
  const norm1 = normalizeIngredient(ingredient1);
  const norm2 = normalizeIngredient(ingredient2);
  
  if (norm1 === norm2) return true;
  
  const synonyms1 = getIngredientSynonyms(norm1);
  const synonyms2 = getIngredientSynonyms(norm2);
  
  return synonyms1.some(s => synonyms2.includes(s));
}

