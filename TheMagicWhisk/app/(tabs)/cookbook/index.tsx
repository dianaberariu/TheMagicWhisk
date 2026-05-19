import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../../components/ScreenBackground';
import {
  Animated,
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
  category: Category;
  title: string;
  servings: number;
  calories: number | string;
  macros: Macro;
  ingredients: Ingredient[];
  steps: string[];
};

const COLORS = {
  background: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  card: '#FFFFFF',
  border: '#E5E7EB',
  primary: '#65B891',
};

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Sweets'] as const;
type FilterCategory = (typeof CATEGORIES)[number];

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
  const normalizedCategory = CATEGORIES.includes(params.category as FilterCategory)
    ? (params.category as FilterCategory)
    : 'All';
  const normalizedQuery = typeof params.query === 'string' ? params.query : '';
  const { recipes, deleteRecipe } = useCookbookContext();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(normalizedCategory);
  const [searchQuery, setSearchQuery] = useState(normalizedQuery);
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
    setActiveCategory(normalizedCategory);
  }, [normalizedCategory]);

  useEffect(() => {
    setSearchQuery(normalizedQuery);
  }, [normalizedQuery]);

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return (recipes as Recipe[]).filter((recipe) => {
      const matchesCategory =
        activeCategory === 'All' || recipe.category === activeCategory;

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
  }, [activeCategory, recipes, searchQuery]);

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: palette.text }]}>Your Cookbook</Text>
        <View style={[styles.searchBar, { backgroundColor: palette.surface, borderColor: palette.border }] }>
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
          {CATEGORIES.map((label, index) => {
            const isActive = label === activeCategory;
            return (
            <TouchableOpacity
              key={label}
              style={[
                styles.actionButton,
                { backgroundColor: palette.surface, borderColor: palette.border },
                isActive && { backgroundColor: palette.chipActive, borderColor: palette.chipActive },
              ]}
              onPress={() => setActiveCategory(label)}
            >
              <Text style={[styles.actionText, { color: palette.text }, isActive && { color: palette.chipText }]}>{label}</Text>
            </TouchableOpacity>
            );
          })}
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
                  pathname: '/(tabs)/cookbook/recipe-details',
                  params: {
                    recipe: JSON.stringify(recipe),
                  },
                })
              }
            />
          ))}
        </View>
      </ScrollView>
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
