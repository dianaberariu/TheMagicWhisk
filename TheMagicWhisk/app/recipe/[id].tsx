import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useGroceryContext } from '../../GroceryContext';
import { useCookbookContext } from '../../CookbookContext';
import { useThemeContext } from '../../context/ThemeContext';
import { supabase } from '../../supabase';

type Macro = {
  calories?: number | string;
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

type LocalizedRecipe = {
  title?: string;
  servings?: number;
  ingredients?: Ingredient[];
  instructions?: string[];
  macros?: Macro;
};

type Category = 'Breakfast' | 'Lunch' | 'Dinner' | 'Sweets';

type Recipe = {
  id: string;
  category?: Category | string;
  title?: string;
  servings?: number;
  calories?: number | string;
  macros?: Macro;
  ingredients?: Ingredient[];
  steps?: string[];
  instructions?: string[];
  image?: string;
  source_url?: string | null;
  languages?: {
    en?: LocalizedRecipe;
    ro?: LocalizedRecipe;
  };
};

type GroceryContextValue = {
  addToGroceryList: (ingredients: Ingredient[]) => Promise<void> | void;
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

const SUPABASE_IMAGE_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_IMAGE_BUCKET ?? 'recipe-images';

function parseRecipe(param: string | string[] | undefined): Recipe | null {
  if (!param) {
    return null;
  }

  const raw = Array.isArray(param) ? param[0] : param;
  try {
    return JSON.parse(raw) as Recipe;
  } catch {
    return null;
  }
}

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeContext();
  const params = useLocalSearchParams<{ id?: string; recipe?: string }>();
  
  const recipeId = useMemo(() => {
    const raw = params.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params.id]);
  
  const parsedRecipe = useMemo(() => parseRecipe(params.recipe), [params.recipe]);
  const { addToGroceryList } = useGroceryContext() as GroceryContextValue;
  const { recipes, deleteRecipe, updateRecipe, fetchRecipes } = useCookbookContext();
  
  // Safe extraction (using ?.) to prevent crashes if parsedRecipe is null
  const storedRecipe = recipes.find((item) => item.id === (recipeId ?? parsedRecipe?.id));
  const recipe = storedRecipe ?? parsedRecipe;
  const baselineRecipe = storedRecipe ?? parsedRecipe;

  const [currentCategory, setCurrentCategory] = useState<string>(
    (recipe?.category as Category | string) ?? 'Breakfast'
  );
  
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCustomMenuVisible, setIsCustomMenuVisible] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [lang, setLang] = useState<'en' | 'ro'>('en');
  const [sourceOpenError, setSourceOpenError] = useState<string | null>(null);
  
  const isDefaultCategory = (value: string): value is Category => CATEGORIES.includes(value as Category);
  const isCustomCategory = currentCategory.length > 0 && !isDefaultCategory(currentCategory);
  
  const menuColors = {
    text: isDarkMode ? '#F8FAFC' : '#0F172A',
    muted: isDarkMode ? '#94A3B8' : '#64748B',
    border: isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
    input: isDarkMode ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.8)',
  };

  // Safely extract properties
  const localizedRecipe = recipe?.languages?.[lang] ?? recipe?.languages?.en ?? recipe?.languages?.ro ?? recipe;
  const localizedMacros = localizedRecipe?.macros ?? recipe?.macros;

  const safeTitle = localizedRecipe?.title ?? recipe?.title ?? 'Untitled recipe';
  const safeCalories = localizedMacros?.calories ?? recipe?.calories ?? 'N/A';
  const baselineServings = Math.max(1, Number(baselineRecipe?.servings) || 1);
  const [targetServings, setTargetServings] = useState<number>(baselineServings);
  
  const safeIngredients = localizedRecipe?.ingredients ?? recipe?.ingredients ?? [];
  const baselineIngredients = baselineRecipe?.languages?.[lang]?.ingredients ?? baselineRecipe?.ingredients ?? safeIngredients;
  const safeSteps = localizedRecipe?.instructions ?? recipe?.instructions ?? recipe?.steps ?? [];
  
  const fallbackImageUri = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
  const proteinRaw = localizedMacros?.protein ?? 'N/A';
  const carbsRaw = localizedMacros?.carbs ?? 'N/A';
  const fatsRaw = localizedMacros?.fats ?? localizedMacros?.fat ?? 'N/A';
  
  const sourceUrl = typeof recipe?.source_url === 'string' ? recipe.source_url.trim() : '';
  const hasSourceUrl = sourceUrl.length > 0;
  
  const palette = isDarkMode
    ? {
        background: '#121212',
        surface: '#1E1E1E',
        surfaceSoft: '#232323',
        text: '#FFFFFF',
        muted: '#C7C7C7',
        border: '#2C3230',
        track: '#2A2A2A',
        pillBorder: '#2E3533',
      }
    : {
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceSoft: '#F6FBF8',
        text: '#111827',
        muted: '#6B7280',
        border: '#E5E7EB',
        track: '#E5E7EB',
        pillBorder: '#E5E7EB',
      };

  const [imageUri, setImageUri] = useState<string | null>(null);
  const lastSyncedRef = useRef<{ id: string | null; servings: number | null; title: string | null }>({
    id: null,
    servings: null,
    title: null,
  });

  useEffect(() => {
    setTargetServings(baselineServings);
  }, [recipe?.id, lang, baselineServings]);

  useEffect(() => {
    setSourceOpenError(null);
  }, [recipe?.id]);

  useEffect(() => {
    setCurrentCategory((recipe?.category as string | undefined) ?? 'Breakfast');
  }, [recipe?.category, recipe?.id]);

  useEffect(() => {
    let isMounted = true;

    const loadCustomCategories = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) return;

        const { data, error } = await supabase
          .from('custom_categories')
          .select('name')
          .eq('user_id', userData.user.id)
          .order('name', { ascending: true });

        if (error) return;

        if (isMounted) {
          const names = (data ?? [])
            .map((item) => (typeof item?.name === 'string' ? item.name : ''))
            .filter(Boolean);
          setCustomCategories(names);
        }
      } catch (error) {
        console.error('Failed to fetch custom categories', error);
      }
    };

    loadCustomCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!recipe?.image) {
      setImageUri(null);
      return;
    }

    if (recipe.image.startsWith('http')) {
      setImageUri(recipe.image);
    } else {
      const { data } = supabase.storage
        .from(SUPABASE_IMAGE_BUCKET)
        .getPublicUrl(recipe.image);
      setImageUri(data.publicUrl);
    }
  }, [recipe?.image]);

  const toNumber = (value: number | string | undefined) => {
    const raw = typeof value === 'number' ? String(value) : String(value ?? '');
    const normalized = raw.replace(/[^\d.]/g, '');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizedTargetServings = Number.isFinite(targetServings) ? targetServings : baselineServings;

  const macros = [
    { label: 'Protein', value: toNumber(proteinRaw), display: proteinRaw ?? 'N/A', goal: MACRO_GOALS.protein, color: '#7FB6FF' },
    { label: 'Carbs', value: toNumber(carbsRaw), display: carbsRaw ?? 'N/A', goal: MACRO_GOALS.carbs, color: '#F7B267' },
    { label: 'Fats', value: toNumber(fatsRaw), display: fatsRaw ?? 'N/A', goal: MACRO_GOALS.fats, color: '#F29CB1' },
  ];

  const scaleAmount = (amount?: string) => {
    if (!amount) return 'N/A';

    const baseServings = Number(baselineRecipe?.servings) || 1;
    const safeTargetServings = Number.isFinite(targetServings) ? targetServings : baselineServings;
    const ratio = safeTargetServings / baseServings;

    if (!Number.isFinite(ratio) || ratio === 1) return amount;

    const parseQuantity = (value: string) => {
      const trimmed = value.trim();
      if (trimmed.includes(' ')) {
        const [wholePart, fractionPart] = trimmed.split(' ');
        const whole = parseFloat(wholePart);
        const [numerator, denominator] = fractionPart.split('/').map(Number);
        if (Number.isFinite(whole) && Number.isFinite(numerator) && Number.isFinite(denominator)) {
          return whole + numerator / denominator;
        }
      }
      if (trimmed.includes('/')) {
        const [numerator, denominator] = trimmed.split('/').map(Number);
        if (Number.isFinite(numerator) && Number.isFinite(denominator)) {
          return numerator / denominator;
        }
      }
      const parsed = parseFloat(trimmed);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatQuantity = (value: number) => {
      const rounded = Math.round(value * 100) / 100;
      const whole = Math.floor(rounded);
      const fraction = rounded - whole;
      const denominators = [2, 3, 4, 8];

      for (const denominator of denominators) {
        const numerator = Math.round(fraction * denominator);
        const match = numerator / denominator;
        if (numerator > 0 && numerator < denominator && Math.abs(fraction - match) < 0.02) {
          return whole > 0 ? `${whole} ${numerator}/${denominator}` : `${numerator}/${denominator}`;
        }
      }

      return rounded.toFixed(2).replace(/\.00$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    };

    const match = amount.trim().match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/);
    if (!match) return amount;

    const scaledValue = parseQuantity(match[0]) * ratio;
    if (!Number.isFinite(scaledValue) || scaledValue <= 0) return amount;

    return amount.replace(match[0], formatQuantity(scaledValue));
  };

  const scaledIngredients = useMemo(
    () =>
      baselineIngredients.map((ingredient) => ({
        ...ingredient,
        amount: scaleAmount(ingredient.amount),
      })),
    [baselineIngredients, baselineRecipe?.servings, normalizedTargetServings]
  );

  const handleCategorySelect = async (category: string, options?: { closeMenu?: boolean }) => {
    if (!recipe?.id) return;

    setCurrentCategory(category);
    updateRecipe({ ...recipe, category, title: recipe.title ?? safeTitle });

    if (options?.closeMenu) setIsCustomMenuVisible(false);

    try {
      await supabase.from('recipes').update({ category }).eq('id', recipe.id);
    } catch (error) {
      console.error('Failed to update recipe category', error);
    }
  };

  const handleAddCustomCategory = async () => {
    const trimmedName = newCustomCategory.trim();
    if (!trimmedName || !recipe?.id) return;

    const existing = customCategories.find((cat) => cat.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      await handleCategorySelect(existing, { closeMenu: true });
      setNewCustomCategory('');
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data, error } = await supabase
        .from('custom_categories')
        .insert({ user_id: userData.user.id, name: trimmedName })
        .select('name')
        .single();

      if (error) return;

      const nextName = data?.name ?? trimmedName;
      setCustomCategories((prev) => {
        const next = [...prev, nextName].map((c) => c.trim()).filter(Boolean);
        next.sort((left, right) => left.localeCompare(right));
        return Array.from(new Set(next));
      });
      await handleCategorySelect(nextName, { closeMenu: true });
      setNewCustomCategory('');
    } catch (error) {
      console.error('Failed to add custom category', error);
    }
  };

  const handleDeleteCustomCategory = (categoryName: string) => {
    Alert.alert('Delete Category?', 'Are you sure you want to delete this custom category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('custom_categories').delete().eq('name', categoryName);
            await supabase.from('recipes').update({ category: 'Breakfast' }).eq('category', categoryName);
            fetchRecipes();
            setCustomCategories((prev) => prev.filter((cat) => cat !== categoryName));
            if (currentCategory === categoryName) await handleCategorySelect('Breakfast');
          } catch (error) {
            console.error('Failed to delete custom category', error);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (!recipe || !baselineRecipe) return;

    const currentId = recipe.id;
    const lastSynced = lastSyncedRef.current;

    if (lastSynced.id === currentId && lastSynced.title === safeTitle) return;

    const updatedRecipe = { ...baselineRecipe, title: safeTitle };
    lastSyncedRef.current = { id: currentId, servings: lastSynced.servings, title: safeTitle };

    updateRecipe(updatedRecipe);
  }, [baselineRecipe, recipe?.id, safeTitle, updateRecipe]);


  // Early Return DACA RETETA NU ESTE INCARCATA
  if (!recipe) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: palette.text, fontSize: 18, fontWeight: '600', marginBottom: 20 }}>
          Recipe loading or not found...
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#65B891', borderRadius: 12 }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          animation: 'fade',
          title: safeTitle,
          headerStyle: { backgroundColor: palette.background },
          headerShadowVisible: false,
          headerTintColor: palette.text,
          headerTitleStyle: { color: palette.text, fontWeight: '700' },
          headerLeft: () => (
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: isDarkMode ? '#232323' : '#F3F4F6', borderColor: palette.border }]}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={palette.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: isDarkMode ? '#232323' : '#F3F4F6', borderColor: palette.border }]}
              onPress={() =>
                Alert.alert('Delete Recipe?', undefined, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => { deleteRecipe(recipe.id); router.back(); } },
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
          style={[styles.heroImage, { width: '100%', height: 300, borderColor: palette.border }]}
        />

        <View style={styles.statsRow}>
          <View style={styles.statsLeftColumn}>
            <View style={[styles.languageToggle, { marginBottom: 0 }]}>
              <View style={styles.languageRow}>
                {(['en', 'ro'] as const).map((code) => {
                  const isActive = code === lang;
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[styles.languagePill, { backgroundColor: isActive ? '#65B891' : palette.surface, borderColor: isActive ? '#65B891' : palette.pillBorder }]}
                      activeOpacity={0.8}
                      onPress={() => setLang(code)}
                    >
                      <Text style={[styles.languageText, { color: isActive ? '#FFFFFF' : palette.text }]}>{code.toUpperCase()}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={[styles.caloriePill, { backgroundColor: isDarkMode ? '#1A1A1A' : '#EAF6F0', borderColor: isDarkMode ? '#404040' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
              <Text style={[styles.calorieText, { color: isDarkMode ? '#FFFFFF' : '#65B891', fontWeight: '800' }]}>{safeCalories} kcal / serving</Text>
            </View>
          </View>
          <View style={styles.statsMetaColumn}>
            <View style={[styles.servingsCounter, { backgroundColor: isDarkMode ? '#1A1A1A' : '#E8F5EE', borderColor: isDarkMode ? '#404040' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
              <Text style={[styles.servingsLabel, { color: isDarkMode ? '#FFFFFF' : '#65B891', fontWeight: '800' }]}>Servings</Text>
              <View style={styles.servingsControls}>
                <TouchableOpacity
                  style={[styles.servingsControl, normalizedTargetServings <= 1 && styles.servingsControlDisabled, { backgroundColor: isDarkMode ? '#252525' : '#F5FBF8', borderColor: isDarkMode ? '#3A3A3A' : '#8FD3B2' }]}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => setTargetServings((prev) => Math.max(1, (Number.isFinite(prev) ? prev : baselineServings) - 1))}
                  disabled={normalizedTargetServings <= 1}
                >
                  <Ionicons name="remove" size={16} color={normalizedTargetServings <= 1 ? palette.muted : '#65B891'} />
                </TouchableOpacity>
                <Text style={[styles.servingsValue, { color: isDarkMode ? '#FFFFFF' : '#65B891' }]}>{normalizedTargetServings}</Text>
                <TouchableOpacity
                  style={[styles.servingsControl, { backgroundColor: isDarkMode ? '#252525' : '#F5FBF8', borderColor: isDarkMode ? '#3A3A3A' : '#8FD3B2' }]}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => setTargetServings((prev) => (Number.isFinite(prev) ? prev : baselineServings) + 1)}
                >
                  <Ionicons name="add" size={16} color="#65B891" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.title, { color: palette.text, textAlign: 'center', width: '100%', marginBottom: 20 }]}>{safeTitle}</Text>

        {hasSourceUrl && (
          <View style={styles.sourceLinkSection}>
            <TouchableOpacity
              style={[styles.sourceLinkButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
              activeOpacity={0.9}
              onPress={async () => {
                try {
                  setSourceOpenError(null);
                  await Linking.openURL(sourceUrl);
                } catch (err) {
                  setSourceOpenError('Unable to open this link on your device.');
                }
              }}
            >
              <Ionicons name="play-circle-outline" size={20} color={palette.text} />
              <Text style={[styles.sourceLinkText, { color: palette.text }]}>Watch Original Video</Text>
            </TouchableOpacity>
            {sourceOpenError && <Text style={[styles.sourceLinkError, { color: palette.muted }]}>{sourceOpenError}</Text>}
          </View>
        )}

        <View style={styles.categorySection}>
          <Text style={[styles.categoryLabel, { color: palette.muted }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {CATEGORIES.map((category) => {
              const isActive = category === currentCategory;
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryPill, { backgroundColor: isActive ? '#65B891' : palette.surface, borderColor: isActive ? '#65B891' : palette.pillBorder }]}
                  activeOpacity={0.8}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text style={[styles.categoryText, { color: isActive ? '#FFFFFF' : palette.text }]}>{category}</Text>
                </TouchableOpacity>
              );
            })}
            {isCustomCategory && (
              <TouchableOpacity
                key="active-custom-category"
                style={[styles.categoryPill, { backgroundColor: '#65B891', borderColor: '#65B891' }]}
                activeOpacity={0.8}
                onPress={() => handleCategorySelect(currentCategory)}
              >
                <Text style={[styles.categoryText, { color: '#FFFFFF' }]}>{currentCategory}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              key="custom-category"
              style={[styles.categoryPill, { backgroundColor: palette.surface, borderColor: palette.pillBorder }]}
              activeOpacity={0.8}
              onPress={() => setIsCustomMenuVisible(true)}
            >
              <Text style={[styles.categoryText, { color: palette.text }]}>+ Custom</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Macros</Text>
          {macros.map((macro) => {
            const percent = Math.min(macro.value / macro.goal, 1) * 100;
            return (
              <View key={macro.label} style={styles.macroBlock}>
                <View style={styles.macroHeader}>
                  <Text style={[styles.macroLabel, { color: palette.text }]}>{macro.label}</Text>
                  <Text style={[styles.macroAmount, { color: palette.muted }]}>{macro.display} / {macro.goal}g</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: palette.track }]}>
                  <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: macro.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Ingredients</Text>
          {scaledIngredients.map((ingredient, index) => (
            <View key={index} style={[styles.ingredientRow, { borderBottomColor: palette.border }]}>
              <Text style={[styles.ingredientName, { color: palette.text }]}>{ingredient.name ?? 'Unknown ingredient'}</Text>
              <Text style={[styles.ingredientAmount, { color: palette.muted }]}>{ingredient.amount ?? 'N/A'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Preparation Steps</Text>
          {safeSteps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={[styles.stepIndex, { backgroundColor: isDarkMode ? '#232323' : '#F3F4F6' }]}>
                <Text style={[styles.stepIndexText, { color: palette.text }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: palette.text }]}>{step ?? 'N/A'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={isCustomMenuVisible} onRequestClose={() => setIsCustomMenuVisible(false)}>
        <View style={styles.menuRoot}>
          <Pressable style={[StyleSheet.absoluteFillObject, styles.menuBackdrop, { backgroundColor: isDarkMode ? 'rgba(2, 6, 23, 0.12)' : 'rgba(15, 23, 42, 0.04)' }]} onPress={() => setIsCustomMenuVisible(false)} />
          <View style={[styles.menuBox, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)', borderColor: menuColors.border }]}>
            <View style={styles.menuInputRow}>
              <TextInput
                placeholder="Add a new category..."
                placeholderTextColor={menuColors.muted}
                value={newCustomCategory}
                onChangeText={setNewCustomCategory}
                style={[styles.menuInput, { backgroundColor: menuColors.input, borderColor: menuColors.border, color: menuColors.text }]}
              />
              <Pressable style={styles.menuAddButton} onPress={handleAddCustomCategory}>
                <Text style={styles.menuAddText}>Add</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.menuList} contentContainerStyle={styles.menuListContent}>
              {customCategories.length === 0 ? (
                <Text style={[styles.menuEmptyText, { color: menuColors.muted }]}>No custom categories yet.</Text>
              ) : (
                customCategories.map((category, index) => {
                  const isSelected = category === currentCategory;
                  const isLast = index === customCategories.length - 1;
                  const iconColor = isSelected ? '#FFFFFF' : isDarkMode ? '#E2E8F0' : '#0F172A';
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.menuItem, { borderBottomColor: menuColors.border, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, backgroundColor: isSelected ? (isDarkMode ? 'rgba(101, 184, 145, 0.2)' : 'rgba(101, 184, 145, 0.12)') : 'transparent' }]}
                      onPress={() => handleCategorySelect(category, { closeMenu: true })}
                    >
                      <Ionicons name={isSelected ? 'checkmark-circle' : 'pricetag-outline'} size={16} color={iconColor} style={styles.menuIcon} />
                      <View style={styles.menuItemTextWrap}>
                        <Text style={[styles.menuItemText, { color: iconColor }]}>{category}</Text>
                      </View>
                      <TouchableOpacity style={styles.menuDeleteButton} onPress={(event) => { event.stopPropagation(); handleDeleteCustomCategory(category); }} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.stickyButtonWrap}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={() => {
            addToGroceryList(scaledIngredients);
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
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 140 },
  heroImage: { width: '100%', height: 300, borderRadius: 22, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 3 },
  statsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 20, marginBottom: 12 },
  statsLeftColumn: { alignItems: 'center', gap: 10 },
  statsMetaColumn: { alignItems: 'center', gap: 10 },
  languageToggle: { marginBottom: 18 },
  languageLabel: { fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 10 },
  languageRow: { flexDirection: 'row' },
  languagePill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFFFFF', marginRight: 10 },
  languagePillActive: { backgroundColor: '#65B891', borderColor: '#65B891' },
  languageText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  languageTextActive: { color: '#FFFFFF' },
  categorySection: { marginBottom: 22 },
  categoryLabel: { fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 4 },
  categoryPill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFFFFF', marginRight: 10 },
  categoryPillActive: { backgroundColor: '#65B891', borderColor: '#65B891' },
  categoryText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  categoryTextActive: { color: '#FFFFFF' },
  title: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: 22, fontWeight: '700', color: COLORS.text },
  sourceLinkSection: { alignItems: 'center', marginBottom: 18 },
  sourceLinkButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 44, borderRadius: 14, borderWidth: 1 },
  sourceLinkText: { fontSize: 14, fontWeight: '700' },
  sourceLinkError: { marginTop: 6, fontSize: 12 },
  caloriePill: { backgroundColor: '#EAF6F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  calorieText: { fontSize: 12, fontWeight: '700', color: '#65B891' },
  servingsCounter: { backgroundColor: '#E8F5EE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignItems: 'center', zIndex: 1 },
  servingsLabel: { fontSize: 11, fontWeight: '700', color: '#65B891', marginBottom: 6 },
  servingsControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  servingsControl: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5FBF8', borderWidth: 1, borderColor: '#8FD3B2' },
  servingsControlDisabled: { opacity: 0.5 },
  servingsValue: { fontSize: 14, fontWeight: '700', color: '#65B891', minWidth: 20, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  macroBlock: { marginBottom: 16 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  macroLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  macroAmount: { fontSize: 12, color: COLORS.muted },
  progressTrack: { height: 10, backgroundColor: COLORS.track, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 999 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  ingredientName: { flex: 1, fontSize: 15, color: COLORS.text },
  ingredientAmount: { fontSize: 14, color: COLORS.muted, marginLeft: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  stepIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepIndexText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  stepText: { flex: 1, fontSize: 15, color: COLORS.text, lineHeight: 22 },
  stickyButtonWrap: { position: 'absolute', left: 20, right: 20, bottom: 16 },
  headerIconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#65B891', borderRadius: 18, paddingVertical: 16, shadowColor: '#000000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 10 }, shadowRadius: 18, elevation: 4 },
  buttonIcon: { marginRight: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  menuRoot: { flex: 1 },
  menuBackdrop: { backgroundColor: 'transparent' },
  menuBox: { position: 'absolute', top: 250, right: 20, width: 200, borderRadius: 18, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 6, maxHeight: 360, shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  menuInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  menuInput: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, fontSize: 12 },
  menuAddButton: { height: 36, borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#65B891' },
  menuAddText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  menuList: { maxHeight: 280 },
  menuListContent: { paddingVertical: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10 },
  menuIcon: { marginRight: 10 },
  menuItemTextWrap: { flex: 1 },
  menuItemText: { fontSize: 13, fontWeight: '600' },
  menuDeleteButton: { paddingLeft: 6, paddingVertical: 4 },
  menuEmptyText: { fontSize: 12, fontWeight: '600', textAlign: 'center', paddingVertical: 12 },
});