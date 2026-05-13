import React, { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useGroceryContext } from '../../../GroceryContext';
import { useCookbookContext } from '../../../CookbookContext';
import { supabase } from '../../../supabase';

type Macro = {
  protein?: number | string;
  carbs?: number | string;
  fats?: number | string;
  fat?: number | string;
};

type Ingredient = {
  id: string;
  name: string;
  amount: string;
};

type Category = 'Breakfast' | 'Lunch' | 'Dinner' | 'Sweets';

type Recipe = {
  id: string;
  category?: Category;
  title?: string;
  calories?: number | string;
  macros?: Macro;
  ingredients?: Ingredient[];
  steps?: string[];
  instructions?: string[];
  image?: string;
};

const FALLBACK_RECIPE: Recipe = {
  id: 'fallback-avo',
  category: 'Breakfast',
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

const MACRO_GOALS = {
  protein: 120,
  carbs: 200,
  fats: 70,
};

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Sweets'] as const;

const COLORS = {
  background: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  track: '#E5E7EB',
};

const SUPABASE_IMAGE_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_IMAGE_BUCKET ?? 'recipe-images';

function parseRecipe(param: string | string[] | undefined): Recipe {
  if (!param) {
    return FALLBACK_RECIPE;
  }

  const raw = Array.isArray(param) ? param[0] : param;
  try {
    return JSON.parse(raw) as Recipe;
  } catch {
    return FALLBACK_RECIPE;
  }
}

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipe?: string }>();
  const parsedRecipe = parseRecipe(params.recipe);
  const { addToGroceryList } = useGroceryContext() as any;
  const { recipes, updateRecipeCategory, deleteRecipe } = useCookbookContext();
  const recipe =
    recipes.find((item) => item.id === parsedRecipe.id) ?? parsedRecipe;
  const [currentCategory, setCurrentCategory] = useState<Category>(
    (recipe.category as Category) ?? 'Breakfast'
  );

  const safeTitle = recipe.title ?? 'Untitled recipe';
  const safeCalories = recipe.calories ?? 'N/A';
  const safeIngredients = recipe.ingredients ?? [];
  const safeSteps = recipe.steps ?? recipe.instructions ?? [];
  const fallbackImageUri = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
  const proteinRaw = recipe.macros?.protein ?? 'N/A';
  const carbsRaw = recipe.macros?.carbs ?? 'N/A';
  const fatsRaw = recipe.macros?.fats ?? recipe.macros?.fat ?? 'N/A';

  const [imageUri, setImageUri] = useState<string | null>(null);


  useEffect(() => {
    if (!recipe.image) {
      setImageUri(null);
      return;
    }

    if (recipe.image.startsWith('http')) {
      setImageUri(recipe.image);
    } 
    else {
      const { data } = supabase.storage
        .from(SUPABASE_IMAGE_BUCKET)
        .getPublicUrl(recipe.image);
      
      setImageUri(data.publicUrl);
    }
  }, [recipe.image]);

  const toNumber = (value: number | string | undefined) => {
    const raw = typeof value === 'number' ? String(value) : String(value ?? '');
    const normalized = raw.replace(/[^\d.]/g, '');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const macros = [
    {
      label: 'Protein',
      value: toNumber(proteinRaw),
      display: proteinRaw ?? 'N/A',
      goal: MACRO_GOALS.protein,
      color: '#7FB6FF',
    },
    {
      label: 'Carbs',
      value: toNumber(carbsRaw),
      display: carbsRaw ?? 'N/A',
      goal: MACRO_GOALS.carbs,
      color: '#F7B267',
    },
    {
      label: 'Fats',
      value: toNumber(fatsRaw),
      display: fatsRaw ?? 'N/A',
      goal: MACRO_GOALS.fats,
      color: '#F29CB1',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen
        options={{
          title: safeTitle,
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.navigate('/cookbook')}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() =>
                Alert.alert('Delete Recipe?', undefined, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      deleteRecipe(recipe.id);
                      router.back();
                    },
                  },
                ])
              }
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: imageUri ?? fallbackImageUri }}
          resizeMode="cover"
          style={[styles.heroImage, { width: '100%', height: 300 }]}
        />

        <View style={styles.titleRow}>
          <Text style={styles.title}>{safeTitle}</Text>
          <View style={styles.caloriePill}>
            <Text style={styles.calorieText}>{safeCalories} kcal</Text>
          </View>
        </View>

        <View style={styles.categorySection}>
          <Text style={styles.categoryLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((category) => {
              const isActive = category === currentCategory;
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setCurrentCategory(category as Category);
                    updateRecipeCategory(recipe.id, category);
                    Alert.alert('Updated', 'Recipe category changed!');
                  }}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macros</Text>
          {macros.map((macro) => {
            const percent = Math.min(macro.value / macro.goal, 1) * 100;
            return (
              <View key={macro.label} style={styles.macroBlock}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>{macro.label}</Text>
                  <Text style={styles.macroAmount}>
                    {macro.display} / {macro.goal}g
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percent}%`, backgroundColor: macro.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {safeIngredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>{ingredient.name ?? 'Unknown ingredient'}</Text>
              <Text style={styles.ingredientAmount}>{ingredient.amount ?? 'N/A'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preparation Steps</Text>
          {safeSteps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepIndex}>
                <Text style={styles.stepIndexText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step ?? 'N/A'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.stickyButtonWrap}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={() => {
            addToGroceryList(safeIngredients);
            Alert.alert('Added', 'Ingredients added to your grocery list!');
          }}
        >
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Add to Grocery List</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  heroImage: {
    width: '100%',
    height: 300,
    borderRadius: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  categorySection: {
    marginBottom: 22,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: '#65B891',
    borderColor: '#65B891',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  caloriePill: {
    backgroundColor: '#EAF6F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  calorieText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#65B891',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  macroBlock: {
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  macroAmount: {
    fontSize: 12,
    color: COLORS.muted,
  },
  progressTrack: {
    height: 10,
    backgroundColor: COLORS.track,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ingredientName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  ingredientAmount: {
    fontSize: 14,
    color: COLORS.muted,
    marginLeft: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  stickyButtonWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#65B891',
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
