import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../../components/ScreenBackground';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { useCookbookContext } from '../../../CookbookContext';
import { useThemeContext } from '../../../context/ThemeContext';
import { supabase } from '../../../supabase';

type Macro = {
  protein: number | string;
  carbs: number | string;
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
  category?: Category | string;
  title: string;
  servings: number;
  calories: number | string;
  macros: Macro;
  ingredients: Ingredient[];
  steps: string[];
  source_url?: string | null;
};

const COLORS = {
  background: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  card: '#FFFFFF',
  border: '#E5E7EB',
  primary: '#65B891',
};

const DEFAULT_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Sweets'] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedText({ text, query }: { text?: string; query: string }) {
  const safeText = text ?? '';
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return <Text>{safeText}</Text>;
  }

  const regex = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi');
  const parts = safeText.split(regex);

  return (
    <Text>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();
        return (
          <Text key={`${part}-${index}`} style={isMatch ? styles.highlightText : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  const { isDarkMode } = useThemeContext();
  const pillBg = isDarkMode ? '#232323' : '#F9FAFB';
  const textColor = isDarkMode ? '#FFFFFF' : COLORS.text;
  const mutedColor = isDarkMode ? '#FFFFFF' : COLORS.text;

  return (
    <View style={[styles.macroPill, { backgroundColor: pillBg }] }>
      <Text style={[styles.macroValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.macroLabel, { color: mutedColor }]}>{label}</Text>
    </View>
  );
}

function formatMacroValue(value: number | string) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return 'N/A';
  }

  return raw.toLowerCase().endsWith('g') ? raw : `${raw} g`;
}

function RecipeCard({
  recipe,
  onPress,
  onDelete,
  searchQuery,
}: {
  recipe: Recipe;
  onPress: () => void;
  onDelete: () => void;
  searchQuery: string;
}) {
  const { isDarkMode } = useThemeContext();
  const cardBg = isDarkMode ? '#252525' : COLORS.card;
  const cardBorder = isDarkMode ? '#2C3230' : COLORS.border;
  const cardTextColor = isDarkMode ? '#FFFFFF' : COLORS.text;
  const cardSubTextColor = isDarkMode ? '#121212' : COLORS.text;

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 72],
      extrapolate: 'clamp',
    });

    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.94, 1],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.72, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionContainer}>
        <Animated.View
          style={[
            styles.swipeDeleteButton,
            {
              opacity,
              transform: [{ translateX }, { scale }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={0.92} onPress={onDelete} style={styles.swipeDeleteButtonInner}>
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.swipeDeleteText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2.2} rightThreshold={44}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            shadowOpacity: isDarkMode ? 0.16 : 0.08,
            shadowRadius: isDarkMode ? 18 : 16,
            elevation: isDarkMode ? 2 : 3,
          },
        ]}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.cardTitleStatsRow}>
          <Text style={[styles.cardTitleCentered, { color: cardTextColor }] }>
            <HighlightedText text={recipe.title} query={searchQuery} />
          </Text>
          <View style={styles.cardStatsRow}>
            <View style={styles.calorieBadge}>
              <Text style={[styles.calorieText, { color: cardSubTextColor }]}>{recipe.calories ?? 'N/A'} kcal</Text>
            </View>
            <View style={styles.servingsBadge}>
              <Text style={[styles.servingsBadgeText, { color: cardSubTextColor }]}>
                {recipe.servings ?? 1} serving{recipe.servings > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          {searchQuery.trim().length > 0 &&
            recipe.ingredients?.some((ing) =>
              ing.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
            ) && (
              <View
                style={{
                  marginTop: 6,
                  backgroundColor: isDarkMode ? '#232323' : '#F9FAFB',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#2C3230' : '#E5E7EB',
                }}
              >
                <Text style={{ fontSize: 11, color: isDarkMode ? '#FFFFFF' : COLORS.text, textAlign: 'center' }}>
                  Includes:{' '}
                  <HighlightedText
                    text={
                      recipe.ingredients.find((ing) =>
                        ing.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
                      )?.name
                    }
                    query={searchQuery}
                  />
                </Text>
              </View>
            )}
        </View>
        <View style={styles.macroRow}>
          <MacroPill label="Protein" value={formatMacroValue(recipe.macros.protein)} />
          <MacroPill label="Carbs" value={formatMacroValue(recipe.macros.carbs)} />
          <MacroPill label="Fats" value={formatMacroValue(recipe.macros.fats ?? recipe.macros.fat ?? 'N/A')} />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function CookbookList() {
  const router = useRouter();
  const { isDarkMode } = useThemeContext();
  const params = useLocalSearchParams<{ category?: string; query?: string }>();
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCustomMenuVisible, setIsCustomMenuVisible] = useState(false);
  const availableCategories = useMemo(() => {
    const normalized = [...DEFAULT_CATEGORIES, ...customCategories]
      .map((category) => category.trim())
      .filter(Boolean);
    return ['All', ...Array.from(new Set(normalized))];
  }, [customCategories]);
  const normalizedCategory = useMemo(() => {
    const candidate = typeof params.category === 'string' ? params.category : 'All';
    return availableCategories.includes(candidate) ? candidate : 'All';
  }, [availableCategories, params.category]);
  const normalizedQuery = typeof params.query === 'string' ? params.query : '';
  const { recipes, deleteRecipe } = useCookbookContext();
  const [selectedCategory, setSelectedCategory] = useState<string>(normalizedCategory);
  const [searchQuery, setSearchQuery] = useState(normalizedQuery);
  const isDefaultCategory = (value: string): value is Category => DEFAULT_CATEGORIES.includes(value as Category);
  const isCustomCategory = selectedCategory !== 'All' && !isDefaultCategory(selectedCategory);
  const palette = isDarkMode
    ? {
        surface: '#1A1A1A',
        border: '#2C3230',
        text: '#F5F7F8',
        muted: '#A9B0B2',
        chipActive: '#65B891',
        chipText: '#F5F7F8',
        softCard: '#1F1F1F',
        pillBg: '#232323',
      }
    : {
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: '#111827',
        muted: '#6B7280',
        chipActive: '#65B891',
        chipText: '#FFFFFF',
        softCard: '#F9FAFB',
        pillBg: '#F9FAFB',
      };

  useEffect(() => {
    setSelectedCategory(normalizedCategory);
  }, [normalizedCategory]);

  useEffect(() => {
    setSearchQuery(normalizedQuery);
  }, [normalizedQuery]);

  useEffect(() => {
    let isMounted = true;

    const loadCustomCategories = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          const message = typeof userError.message === 'string' ? userError.message : '';
          const isMissingSession =
            userError.name === 'AuthSessionMissingError' ||
            message.includes('Auth session missing') ||
            userError.status === 401;

          if (isMissingSession) {
            if (isMounted) {
              setCustomCategories([]);
            }
            return;
          }

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
          .select('name')
          .eq('user_id', userData.user.id)
          .order('name', { ascending: true });

        if (error) {
          console.error('Failed to fetch custom categories', error);
          return;
        }

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
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return (recipes as Recipe[]).filter((recipe) => {
      const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const inTitle = recipe.title?.toLowerCase().includes(normalizedSearch);
      const inIngredients = recipe.ingredients?.some((ingredient) =>
        `${ingredient.name ?? ''} ${ingredient.amount ?? ''}`
          .toLowerCase()
          .includes(normalizedSearch)
      );

      return Boolean(inTitle || inIngredients);
    });
  }, [recipes, searchQuery, selectedCategory]);

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: palette.text }]}>Your Cookbook</Text>
        <View style={[styles.searchBar, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="search" size={18} color={palette.muted} />
          <TextInput
            placeholder="Search recipes, ingredients..."
            placeholderTextColor={palette.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: palette.text }]}
            returnKeyType="search"
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionRow}
        >
          {['All', ...DEFAULT_CATEGORIES].map((label) => {
            const isActive = label === selectedCategory;
            return (
              <TouchableOpacity
                key={label}
                style={[
                  styles.actionButton,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                  isActive && { backgroundColor: palette.chipActive, borderColor: palette.chipActive },
                ]}
                onPress={() => setSelectedCategory(label)}
              >
                <Text
                  style={[
                    styles.actionText,
                    { color: palette.text },
                    isActive && { color: palette.chipText },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {isCustomCategory && (
            <View
              key="active-custom-category"
              style={[
                styles.actionButton,
                styles.customActiveTag,
                { backgroundColor: palette.chipActive, borderColor: palette.chipActive },
              ]}
            >
              <Text style={[styles.actionText, { color: palette.chipText }]}>{selectedCategory}</Text>
              <Pressable
                onPress={() => setSelectedCategory('All')}
                hitSlop={8}
                style={styles.customActiveClose}
              >
                <Ionicons name="close" size={12} color={palette.chipText} />
              </Pressable>
            </View>
          )}
          <TouchableOpacity
            key="custom-category"
            style={[
              styles.actionButton,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            onPress={() => setIsCustomMenuVisible(true)}
          >
            <Text style={[styles.actionText, { color: palette.text }]}>+ Custom</Text>
          </TouchableOpacity>
        </ScrollView>
        <View style={styles.listSection}>
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              searchQuery={searchQuery}
              onDelete={() => deleteRecipe(recipe.id)}
              onPress={() =>
                router.push({
                  pathname: '/recipe/[id]',
                  params: {
                    id: recipe.id,
                    recipe: JSON.stringify(recipe),
                  },
                })
              }
            />
          ))}
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent
        visible={isCustomMenuVisible}
        onRequestClose={() => setIsCustomMenuVisible(false)}
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
            onPress={() => setIsCustomMenuVisible(false)}
          />
          <View
            style={[
              styles.menuBox,
              {
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
              },
            ]}
          >
            <ScrollView style={styles.menuList} contentContainerStyle={styles.menuListContent}>
              {customCategories.length === 0 ? (
                <Text style={[styles.menuEmptyText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                  No custom categories yet.
                </Text>
              ) : (
                customCategories.map((category, index) => {
                  const isSelected = category === selectedCategory;
                  const isLast = index === customCategories.length - 1;
                  const iconColor = isSelected
                    ? palette.chipText
                    : isDarkMode
                      ? '#E2E8F0'
                      : '#0F172A';
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.menuItem,
                        {
                          borderBottomColor: isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
                          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                          backgroundColor: isSelected
                            ? isDarkMode
                              ? 'rgba(101, 184, 145, 0.2)'
                              : 'rgba(101, 184, 145, 0.12)'
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setSelectedCategory(category);
                        setIsCustomMenuVisible(false);
                      }}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'pricetag-outline'}
                        size={16}
                        color={iconColor}
                        style={styles.menuIcon}
                      />
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: iconColor },
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customActiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  customActiveClose: {
    marginLeft: 8,
  },
  menuRoot: {
    flex: 1,
  },
  menuBackdrop: {
    backgroundColor: 'transparent',
  },
  menuBox: {
    position: 'absolute',
    top: 150,
    right: 20,
    width: 200,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    maxHeight: 320,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  menuList: {
    maxHeight: 280,
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
  menuIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuEmptyText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
  listSection: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
  },
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'stretch',
    marginVertical: 6,
    marginLeft: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  swipeDeleteButton: {
    width: 88,
    flex: 1,
    backgroundColor: '#D98C8C',
    borderWidth: 1,
    borderColor: '#C97C7C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 1,
  },
  swipeDeleteButtonInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 14,
    gap: 5,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitleStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitleCentered: {
    width: '100%',
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  highlightText: {
    fontWeight: '700',
  },
  cardStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  calorieBadge: {
    backgroundColor: '#EAF6F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  calorieText: {
    fontSize: 12,
    fontWeight: '600',
  },
  servingsBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  servingsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  macroLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
});
