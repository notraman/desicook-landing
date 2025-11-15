import { useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react';
import { getAllIngredients } from '@/lib/recipeMatching';

interface IngredientSearchBarProps {
  selectedIngredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  onFindRecipes: () => void;
  onOpenImageUploader: () => void;
}

export const IngredientSearchBar = ({
  selectedIngredients,
  onIngredientsChange,
  onFindRecipes,
  onOpenImageUploader,
}: IngredientSearchBarProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [allIngredients, setAllIngredients] = useState<string[]>([]);

  // Load ingredients on mount
  useEffect(() => {
    async function loadIngredients() {
      try {
        const ingredients = await getAllIngredients();
        setAllIngredients(ingredients);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      }
    }
    loadIngredients();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setFocusedIndex(-1);
      return;
    }

    const normalizedInput = inputValue.toLowerCase().trim();
    const filtered = allIngredients
      .filter((ing) => 
        ing.toLowerCase().includes(normalizedInput) &&
        !selectedIngredients.includes(ing)
      )
      .slice(0, 8); // Limit to 8 suggestions

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setFocusedIndex(-1); // Reset focus when suggestions change
  }, [inputValue, selectedIngredients]); // Removed allIngredients from deps - it's stable

  const addIngredient = (ingredient: string) => {
    const normalized = ingredient.trim().toLowerCase();
    if (normalized && !selectedIngredients.includes(normalized)) {
      onIngredientsChange([...selectedIngredients, normalized]);
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const removeIngredient = (ingredient: string) => {
    onIngredientsChange(selectedIngredients.filter((ing) => ing !== ingredient));
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addIngredient(inputValue);
      } else if (selectedIngredients.length > 0) {
        onFindRecipes();
      }
    } else if (e.key === 'Backspace' && inputValue === '' && selectedIngredients.length > 0) {
      // Remove last chip on backspace
      removeIngredient(selectedIngredients[selectedIngredients.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addIngredient(suggestion);
    setFocusedIndex(-1);
  };

  // Scroll focused suggestion into view
  useEffect(() => {
    if (focusedIndex >= 0 && suggestionsRef.current) {
      const focusedElement = suggestionsRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass glass-reflection p-4 sm:p-5 md:p-6 rounded-xl">
        <label 
          htmlFor="ingredient-search" 
          className="block text-xs sm:text-sm font-semibold text-dc-cream/80 mb-3"
        >
          What ingredients do you have?
        </label>

        {/* Search Input Container */}
        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-3 min-h-[44px] sm:min-h-[48px] items-center">
            {/* Ingredient Chips */}
            {selectedIngredients.map((ingredient, index) => (
              <div
                key={`${ingredient}-${index}`}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full glass bg-dc-gold/10 border border-dc-gold/30"
              >
                <span className="text-xs sm:text-sm text-dc-cream font-medium">{ingredient}</span>
                <button
                  onClick={() => removeIngredient(ingredient)}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full hover:bg-dc-gold/20 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-dc-gold flex-shrink-0"
                  aria-label={`Remove ${ingredient}`}
                >
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-dc-cream/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Input Field */}
            <input
              ref={inputRef}
              id="ingredient-search"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => {
                // Delay to allow suggestion click
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder={selectedIngredients.length === 0 ? "Add ingredients... (e.g., tomato, onion, chicken)" : ""}
              className="flex-1 min-w-[150px] sm:min-w-[200px] bg-transparent border-none outline-none text-dc-cream placeholder:text-dc-cream/40 text-sm sm:text-base"
              aria-label="Search ingredients"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="ingredient-suggestions"
            />
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              id="ingredient-suggestions"
              className="absolute z-50 w-full mt-1 glass glass-reflection rounded-lg overflow-hidden max-h-64 overflow-y-auto"
              role="listbox"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`w-full text-left px-4 py-2.5 text-sm text-dc-cream/80 hover:text-dc-cream hover:bg-dc-cream/5 transition-colors focus:outline-none focus:bg-dc-cream/5 ${
                    index === focusedIndex ? 'bg-dc-cream/5 text-dc-cream' : ''
                  }`}
                  role="option"
                  aria-selected={index === focusedIndex}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-4">
          <button
            onClick={onFindRecipes}
            disabled={selectedIngredients.length === 0}
            className="btn-gold flex-1 sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Find recipes with selected ingredients"
          >
            Find Recipes
          </button>
          <button
            onClick={onOpenImageUploader}
            className="btn-glass flex-1 sm:flex-none px-5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-center gap-2 text-sm sm:text-base"
            aria-label="Detect ingredients from photo"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="whitespace-nowrap">Detect from photo</span>
          </button>
        </div>

        {/* Helper Text */}
        {selectedIngredients.length > 0 && (
          <p className="text-xs text-dc-cream/50 mt-3">
            Press Enter or comma to add ingredients • {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>
    </div>
  );
};

