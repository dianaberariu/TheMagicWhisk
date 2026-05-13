import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const RecipesContext = createContext(null);

const BASE_RECIPE = {
  title: 'Avocado Toast',
  calories: 420,
  macros: {
    protein: 12,
    carbs: 44,
    fats: 22,
  },
  ingredients: [
    { id: 'ing-1', name: 'Sourdough bread', amount: '2 slices' },
    { id: 'ing-2', name: 'Ripe avocado', amount: '1 large' },
    { id: 'ing-3', name: 'Olive oil', amount: '1 tbsp' },
    { id: 'ing-4', name: 'Lemon juice', amount: '1 tsp' },
    { id: 'ing-5', name: 'Chili flakes', amount: '1/4 tsp' },
    { id: 'ing-6', name: 'Salt', amount: '1 pinch' },
    { id: 'ing-7', name: 'Black pepper', amount: '1 pinch' },
  ],
  steps: [
    'Toast the bread until golden and crisp.',
    'Mash avocado with lemon juice, olive oil, salt, and pepper.',
    'Spread avocado over toast and sprinkle chili flakes on top.',
  ],
};

const INITIAL_RECIPES = [
  { id: 'saved-avo', category: 'Breakfast', ...BASE_RECIPE },
  {
    id: 'saved-salad',
    category: 'Lunch',
    ...BASE_RECIPE,
    title: 'Citrus Kale Salad',
    calories: 360,
    macros: {
      protein: 14,
      carbs: 40,
      fats: 18,
    },
  },
  {
    id: 'saved-pasta',
    category: 'Lunch',
    ...BASE_RECIPE,
    title: 'Lemon Herb Pasta',
    calories: 520,
    macros: {
      protein: 18,
      carbs: 72,
      fats: 16,
    },
  },
  {
    id: 'saved-salmon',
    category: 'Dinner',
    ...BASE_RECIPE,
    title: 'Miso Salmon Bowl',
    calories: 510,
    macros: {
      protein: 34,
      carbs: 22,
      fats: 28,
    },
  },
];

export function RecipesProvider({ children }) {
  const [recipes, setRecipes] = useState(INITIAL_RECIPES);

  const updateRecipeCategory = useCallback((recipeId, category) => {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, category } : recipe
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      recipes,
      updateRecipeCategory,
    }),
    [recipes, updateRecipeCategory]
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipesContext() {
  const context = useContext(RecipesContext);
  if (!context) {
    throw new Error('useRecipesContext must be used within RecipesProvider');
  }
  return context;
}
