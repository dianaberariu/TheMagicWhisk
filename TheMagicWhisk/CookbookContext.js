import React, {
createContext,
useCallback,
useContext,
useEffect,
useMemo,
useState,
} from 'react';
import { supabase } from './supabase';

const SUPABASE_IMAGE_BUCKET =
	process.env.EXPO_PUBLIC_SUPABASE_IMAGE_BUCKET ?? 'recipe-images';

const getImageExtension = (contentType) => {
	if (!contentType) {
		return '.jpg';
	}

	const normalized = contentType.toLowerCase();
	if (normalized.includes('png')) {
		return '.png';
	}
	if (normalized.includes('webp')) {
		return '.webp';
	}
	if (normalized.includes('gif')) {
		return '.gif';
	}
	if (normalized.includes('jpeg') || normalized.includes('jpg')) {
		return '.jpg';
	}

	return '.jpg';
};

const uploadRecipeImage = async (imageUrl, recipeId) => {
	const response = await fetch(imageUrl);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.status}`);
	}

	const contentType = response.headers?.get?.('Content-Type') ?? 'image/jpeg';
	const extension = getImageExtension(contentType);
	const blob = await response.blob();
	const safeRecipeId = recipeId ?? Date.now().toString();
	const filePath = `images/recipe_${safeRecipeId}${extension}`;

	const { data, error } = await supabase.storage
		.from(SUPABASE_IMAGE_BUCKET)
		.upload(filePath, blob, {
			contentType,
			upsert: false,
		});

	if (error) {
		throw error;
	}

	return data?.path ?? filePath;
};

/**
* @typedef {Object} RecipeMacros
* @property {string | number | undefined} [calories]
* @property {string | number | undefined} [protein]
* @property {string | number | undefined} [carbs]
* @property {string | number | undefined} [fat]
* @property {string | number | undefined} [fats]
*/

/**
* @typedef {Object} RecipeIngredient
* @property {string} id
* @property {string} name
* @property {string} amount
*/

/**
* @typedef {Object} RecipeTranslation
* @property {string} [title]
* @property {RecipeMacros} [macros]
* @property {string | number | undefined} [calories]
* @property {RecipeIngredient[]} [ingredients]
* @property {string[]} [steps]
* @property {string[]} [instructions]
*/

/**
* @typedef {Object} Recipe
* @property {string} id
* @property {'Breakfast' | 'Lunch' | 'Dinner' | 'Sweets'} [category]
* @property {string} title
* @property {RecipeMacros} [macros]
* @property {string | number | undefined} [calories]
* @property {string | undefined} [image]
* @property {RecipeIngredient[]} [ingredients]
* @property {string[]} [steps]
* @property {string[]} [instructions]
* @property {{ en?: RecipeTranslation, ro?: RecipeTranslation }} [languages]
*/

/**
* @typedef {Object} CookbookContextValue
* @property {Recipe[]} recipes
* @property {(recipe: Recipe) => void} addRecipe
* @property {(recipeId: string) => void} deleteRecipe
* @property {(recipeId: string, category: string) => void} updateRecipeCategory
*/

const CookbookContext = createContext(/** @type {CookbookContextValue | null} */ (null));

export function CookbookProvider({ children }) {
const [recipes, setRecipes] = useState([]);

const fetchRecipes = useCallback(async () => {
const { data, error } = await supabase
.from('recipes')
.select('*')
.order('created_at', { ascending: false });
console.log("Supabase URL being used:", supabase.supabaseUrl);
if (error) {
console.error('Failed to fetch recipes', error);
return;
}

setRecipes(data ?? []);
}, []);

useEffect(() => {
fetchRecipes();
}, [fetchRecipes]);

const addRecipe = useCallback(async (newRecipe) => {
if (!newRecipe) {
return;
}

setRecipes((prev) => [newRecipe, ...prev]);

const { error } = await supabase.from('recipes').insert(newRecipe);

if (error) {
console.error('Failed to add recipe', error);
}
}, []);

const updateRecipeCategory = useCallback(async (recipeId, category) => {
const { error } = await supabase
.from('recipes')
.update({ category })
.eq('id', recipeId);

if (error) {
console.error('Failed to update recipe category', error);
return;
}

fetchRecipes();
}, [fetchRecipes]);

const deleteRecipe = useCallback(async (recipeId) => {
const { error } = await supabase.from('recipes').delete().eq('id', recipeId);

if (error) {
console.error('Failed to delete recipe', error);
return;
}

fetchRecipes();
}, [fetchRecipes]);

const value = useMemo(
() => ({
recipes,
addRecipe,
deleteRecipe,
updateRecipeCategory,
}),
[recipes, addRecipe, deleteRecipe, updateRecipeCategory]
);

return <CookbookContext.Provider value={value}>{children}</CookbookContext.Provider>;
}

/** @returns {CookbookContextValue} */
export function useCookbookContext() {
const context = useContext(CookbookContext);
if (!context) {
throw new Error('useCookbookContext must be used within CookbookProvider');
}
return context;
}