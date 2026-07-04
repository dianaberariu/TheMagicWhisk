import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCookbookContext } from '../../CookbookContext';
import { useThemeContext } from '../../context/ThemeContext';
import { supabase } from '../../supabase';

const COLORS = {
  background: '#FFFFFF',
  text: '#111827',
  muted: '#9CA3AF',
  border: '#E5E7EB',
  inputFill: '#F9FAFB',
  primary: '#65B891',
};

const LOADING_MESSAGES = [
  'Whisking the ingredients...',
  'Asking the AI chef...',
  'Chopping the vegetables...',
  'Plating the dish...',
  'Simmering the flavors...',
  'Tasting for seasoning...',
];

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Sweets'] as const;
type Category = (typeof CATEGORIES)[number];
type CategoryValue = Category | string;

type CustomCategory = {
  id: string;
  user_id: string;
  name: string;
};

const SUPPORTED_DOMAINS = ['tiktok.com', 'instagram.com', 'youtube.com', 'youtu.be'];

function isSupportedRecipeLink(value: string) {
  const trimmed = value.trim();
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\S]*)?$/i;

  if (!trimmed || !urlPattern.test(trimmed)) {
    return false;
  }

  try {
    const normalizedUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsedUrl = new URL(normalizedUrl);
    return SUPPORTED_DOMAINS.some((domain) => {
      const hostname = parsedUrl.hostname.toLowerCase();
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
}

export default function ImportScreen() {
  const router = useRouter();
  const { addRecipe, fetchRecipes } = useCookbookContext();
  const { isDarkMode } = useThemeContext();
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>('Lunch');
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [customCategoryError, setCustomCategoryError] = useState<string | null>(null);
  const [isSavingCustomCategory, setIsSavingCustomCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const isDefaultCategory = (value: string): value is Category => CATEGORIES.includes(value as Category);
  const isCustomCategorySelected = selectedCategory.length > 0 && !isDefaultCategory(selectedCategory);

  const tagColors = {
    label: isDarkMode ? '#9CA3AF' : COLORS.muted,
    pillBackground: isDarkMode ? '#111827' : '#FFFFFF',
    pillBorder: isDarkMode ? '#1F2937' : COLORS.border,
    text: isDarkMode ? '#E5E7EB' : COLORS.text,
    addText: isDarkMode ? '#A7F3D0' : COLORS.primary,
  };

  const menuColors = {
    text: isDarkMode ? '#F8FAFC' : '#0F172A',
    muted: isDarkMode ? '#94A3B8' : '#64748B',
    border: isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
    input: isDarkMode ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.8)',
  };

  useFocusEffect(
    useCallback(() => {
      setUrlInput('');
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    const loadCustomCategories = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Failed to load custom categories user', userError);
          return;
        }

        if (!userData?.user) {
          if (isMounted) {
            setCustomCategories([]);
          }
          return;
        }

        const { data, error } = await supabase
          .from('custom_categories')
          .select('id, user_id, name')
          .eq('user_id', userData.user.id)
          .order('name', { ascending: true });

        if (error) {
          console.error('Failed to fetch custom categories', error);
          return;
        }

        if (isMounted) {
          setCustomCategories(data ?? []);
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
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }

    setLoadingMessageIndex(0);
    const intervalId = setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => {
      clearInterval(intervalId);
    };
  }, [isLoading]);

  const closeCategoryModal = () => {
    setIsCategoryModalVisible(false);
    setNewCustomCategory('');
    setCustomCategoryError(null);
    setIsSavingCustomCategory(false);
  };

  const openCategoryModal = () => {
    setCustomCategoryError(null);
    setIsCategoryModalVisible(true);
  };

  const handleAddCustomCategory = async () => {
    const trimmedName = newCustomCategory.trim();

    if (!trimmedName) {
      setCustomCategoryError('Enter a category name.');
      return;
    }

    if (isDefaultCategory(trimmedName)) {
      setSelectedCategory(trimmedName);
      closeCategoryModal();
      return;
    }

    const existing = customCategories.find(
      (category) => category.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing) {
      setSelectedCategory(existing.name);
      closeCategoryModal();
      return;
    }

    setIsSavingCustomCategory(true);
    setCustomCategoryError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Failed to read user for custom category', userError);
        setCustomCategoryError('Please sign in to save custom categories.');
        return;
      }

      if (!userData?.user) {
        console.error('No authenticated user for custom category');
        setCustomCategoryError('Please sign in to save custom categories.');
        return;
      }

      const { data, error } = await supabase
        .from('custom_categories')
        .insert({ user_id: userData.user.id, name: trimmedName })
        .select('id, user_id, name')
        .single();

      if (error) {
        console.error('Failed to add custom category', error);
        setCustomCategoryError(error.message || 'Could not add category. Try again.');
        return;
      }

      if (data) {
        setCustomCategories((current) =>
          [...current, data].sort((left, right) => left.name.localeCompare(right.name))
        );
        setSelectedCategory(data.name);
      } else {
        setCustomCategoryError('Could not add category. Try again.');
        return;
      }

      closeCategoryModal();
    } catch (error) {
      console.error('Failed to add custom category', error);
      setCustomCategoryError('Could not add category. Try again.');
    } finally {
      setIsSavingCustomCategory(false);
    }
  };

  const handleSelectCustomCategory = (name: string) => {
    setSelectedCategory(name);
    closeCategoryModal();
  };

  const handleDeleteCustomCategory = (categoryId: string, categoryName: string) => {
    Alert.alert(
      'Delete Category?',
      'Are you sure you want to delete this custom category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('custom_categories')
                .delete()
                .eq('id', categoryId);

              if (error) {
                console.error('Failed to delete custom category', error);
                return;
              }

              const { error: updateError } = await supabase
                .from('recipes')
                .update({ category: 'Lunch' })
                .eq('category', categoryName);

              if (updateError) {
                console.error('Failed to update recipes for deleted category', updateError);
                return;
              }

              fetchRecipes();

              setCustomCategories((current) =>
                current.filter((category) => category.id !== categoryId)
              );

              if (selectedCategory === categoryName) {
                setSelectedCategory('Lunch');
              }
            } catch (error) {
              console.error('Failed to delete custom category', error);
            }
          },
        },
      ]
    );
  };

  const handleExtract = async () => {
    if (isLoading) {
      return;
    }

    setErrorMessage(null);

    const trimmedUrl = urlInput.trim();

    if (!trimmedUrl || !isSupportedRecipeLink(trimmedUrl)) {
      setErrorMessage(
        'Please paste a valid recipe or video link from TikTok, Instagram, YouTube, or YouTube Shorts.'
      );
      setUrlInput('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.171/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await response.json();

      if (data?.error === 'NOT_A_RECIPE') {
        setErrorMessage("We couldn't find a recipe in this link. Please make sure it's a cooking video or article.");
        setUrlInput('');
        return;
      }

      if (data?.status === 'error') {
        setErrorMessage(data.message || 'An unknown error occurred while extracting the recipe.');
        setUrlInput('');
        return;
      }

      const recipeData = data?.recipe ?? data;

      if (recipeData) {
        const remoteImage = recipeData.image_url ?? recipeData.image;
        const normalizedImage =
          typeof remoteImage === 'string' && remoteImage.trim().length > 0
            ? remoteImage.trim()
            : undefined;

        const localizedData = recipeData.languages?.en || recipeData;

        const completeRecipe = {
          id: Date.now().toString(),
          category: selectedCategory,
          title: localizedData.title,
          ingredients: localizedData.ingredients,
          instructions: localizedData.instructions,
          calories: localizedData.macros?.calories || 'N/A',
          macros: {
            protein: localizedData.macros?.protein || 'N/A',
            carbs: localizedData.macros?.carbs || 'N/A',
            fats: localizedData.macros?.fat || localizedData.macros?.fats || 'N/A',
          },
          servings: localizedData.servings || 1,
          image: normalizedImage,
          source_url: trimmedUrl,
          languages: recipeData.languages,
        };

        const { data: insertedRecipe, error: insertError } = await addRecipe(completeRecipe);

        if (insertError || !insertedRecipe) {
          setErrorMessage('Could not save the recipe. Please try again.');
          return;
        }

        closeCategoryModal();
        setUrlInput('');
        setErrorMessage(null);
        setCustomCategoryError(null);

        router.push({
          pathname: '/recipe/[id]',
          params: { id: insertedRecipe.id, recipe: JSON.stringify(insertedRecipe) },
        });
      }
    } catch (error) {
      setErrorMessage(
        'Could not connect to the backend. Check your IP address and ensure the server is running.'
      );
      setUrlInput('');
      console.error('Backend connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#121212' }]}>Import Recipe</Text>
        <TextInput
          placeholder="https://www.tiktok.com/@creator/video/123"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          value={urlInput}
          onChangeText={(text) => {
            setUrlInput(text);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          textContentType="URL"
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <View style={styles.categorySection}>
          <Text style={[styles.categoryLabel, { color: tagColors.label }]}>Save as:</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((category) => {
              const isActive = category === selectedCategory;
              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryPill,
                    { backgroundColor: tagColors.pillBackground, borderColor: tagColors.pillBorder },
                    isActive && styles.categoryPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: tagColors.text },
                      isActive && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
            {isCustomCategorySelected && (
              <Pressable
                onPress={() => setSelectedCategory(selectedCategory)}
                style={[
                  styles.categoryPill,
                  { backgroundColor: tagColors.pillBackground, borderColor: tagColors.pillBorder },
                  styles.categoryPillActive,
                ]}
              >
                <Text style={[styles.categoryText, { color: tagColors.text }, styles.categoryTextActive]}>
                  {selectedCategory}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={openCategoryModal}
              style={[
                styles.categoryPill,
                { backgroundColor: 'transparent', borderColor: tagColors.pillBorder },
                styles.categoryPillAdd,
              ]}
            >
              <Text style={[styles.categoryText, styles.categoryTextAdd, { color: tagColors.addText }]}>
                + Custom
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleExtract}
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>
              {isLoading ? 'Analyzing Video...' : 'Extract Recipe'}
            </Text>
          </View>
        </Pressable>
      </View>
      <Modal
        animationType="slide"
        transparent
        visible={isCategoryModalVisible}
        onRequestClose={closeCategoryModal}
      >
        <View style={styles.menuRoot}>
          <Pressable
            style={[
              StyleSheet.absoluteFillObject,
              styles.menuBackdrop,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(2, 6, 23, 0.12)'
                  : 'rgba(15, 23, 42, 0.04)',
              },
            ]}
            onPress={closeCategoryModal}
          />
          <View
            style={[
              styles.menuBox,
              {
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: menuColors.border,
              },
            ]}
          >
            <View style={styles.menuInputRow}>
              <TextInput
                placeholder="Add a new category"
                placeholderTextColor={menuColors.muted}
                value={newCustomCategory}
                onChangeText={(value) => {
                  setNewCustomCategory(value);
                  if (customCategoryError) {
                    setCustomCategoryError(null);
                  }
                }}
                style={[
                  styles.menuInput,
                  { backgroundColor: menuColors.input, borderColor: menuColors.border, color: menuColors.text },
                ]}
              />
              <Pressable
                style={[styles.menuAddButton, isSavingCustomCategory && styles.menuAddButtonDisabled]}
                onPress={handleAddCustomCategory}
                disabled={isSavingCustomCategory}
              >
                {isSavingCustomCategory ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.menuAddText}>Add</Text>
                )}
              </Pressable>
            </View>
            {customCategoryError ? <Text style={styles.menuErrorText}>{customCategoryError}</Text> : null}
            <ScrollView style={styles.menuList} contentContainerStyle={styles.menuListContent}>
              {customCategories.length === 0 ? (
                <Text style={[styles.menuEmptyText, { color: menuColors.muted }]}>No custom categories yet.</Text>
              ) : (
                customCategories.map((category, index) => {
                  const isSelected = category.name === selectedCategory;
                  const isLast = index === customCategories.length - 1;
                  const iconColor = isSelected
                    ? '#FFFFFF'
                    : isDarkMode
                      ? '#E2E8F0'
                      : '#0F172A';
                  return (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.menuItem,
                        {
                          borderBottomColor: menuColors.border,
                          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                          backgroundColor: isSelected
                            ? isDarkMode
                              ? 'rgba(101, 184, 145, 0.2)'
                              : 'rgba(101, 184, 145, 0.12)'
                            : 'transparent',
                        },
                      ]}
                      onPress={() => handleSelectCustomCategory(category.name)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'pricetag-outline'}
                        size={16}
                        color={iconColor}
                        style={styles.menuIcon}
                      />
                      <View style={styles.menuItemTextWrap}>
                        <Text style={[styles.menuItemText, { color: iconColor }]}>{category.name}</Text>
                      </View>
                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          handleDeleteCustomCategory(category.id, category.name);
                        }}
                        style={styles.menuDeleteButton}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </Pressable>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal transparent={true} visible={isLoading} animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            {LOADING_MESSAGES[loadingMessageIndex] || 'Cooking up something tasty...'}
          </Text>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
    marginBottom: 18,
  },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputFill,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 10,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#E63946',
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    marginBottom: 10,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillAdd: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryTextAdd: {
    color: COLORS.primary,
  },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 18,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  menuRoot: {
    flex: 1,
  },
  menuBackdrop: {
    backgroundColor: 'transparent',
  },
  menuBox: {
    position: 'absolute',
    top: 220,
    right: 24,
    width: 200,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    maxHeight: 360,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  menuInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  menuInput: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  menuAddButton: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  menuAddButtonDisabled: {
    opacity: 0.7,
  },
  menuAddText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  menuErrorText: {
    marginTop: -4,
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 16,
    color: '#E11D48',
    fontWeight: '600',
  },
  menuList: {
    maxHeight: 240,
  },
  menuListContent: {
    paddingVertical: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  menuItemTextWrap: {
    flex: 1,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuDeleteButton: {
    paddingLeft: 6,
    paddingVertical: 4,
  },
  menuEmptyText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
