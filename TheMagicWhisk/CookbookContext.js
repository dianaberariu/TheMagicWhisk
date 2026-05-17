import React, {
createContext,
useCallback,
useContext,
useEffect,
useMemo,
useState,
} from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

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
* @property {(recipe: Recipe) => void} updateRecipe
*/

const CookbookContext = createContext(/** @type {CookbookContextValue | null} */ (null));

export function CookbookProvider({ children }) {
const [recipes, setRecipes] = useState([]);
const [loading, setLoading] = useState(true);
const { user } = useAuth();

const fetchRecipes = useCallback(async () => {
if (!user?.id) {
setRecipes([]);
setLoading(false);
return;
}

setLoading(true);
const { data, error } = await supabase
.from('recipes')
.select('*')
.eq('user_id', user.id)
.order('created_at', { ascending: false });
console.log("Supabase URL being used:", supabase.supabaseUrl);
if (error) {
console.error('Failed to fetch recipes', error);
setLoading(false);
return;
}

setRecipes(data ?? []);
setLoading(false);
}, [user]);

useEffect(() => {
fetchRecipes();
}, [fetchRecipes, user?.id]);

const addRecipe = useCallback(async (newRecipe) => {
if (!newRecipe) {
return;
}

const recipeWithOwner = user?.id ? { ...newRecipe, user_id: user.id } : newRecipe;

setRecipes((prev) => [recipeWithOwner, ...prev]);

const { error } = await supabase.from('recipes').insert(recipeWithOwner);

if (error) {
console.error('Failed to add recipe', error);
}
}, [user]);

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

const updateRecipe = useCallback(async (updatedRecipe) => {
if (!updatedRecipe) {
return;
}

setRecipes((prev) =>
prev.map((recipe) => (recipe.id === updatedRecipe.id ? updatedRecipe : recipe))
);

const { error } = await supabase
.from('recipes')
.update(updatedRecipe)
.eq('id', updatedRecipe.id);

if (error) {
console.error('Failed to update recipe', error);
}
}, []);

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
loading,
addRecipe,
deleteRecipe,
updateRecipeCategory,
updateRecipe,
}),
[recipes, loading, addRecipe, deleteRecipe, updateRecipeCategory, updateRecipe]
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