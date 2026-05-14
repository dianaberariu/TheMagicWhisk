import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useCookbookContext } from '../../../CookbookContext';

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
  return (
    <View style={styles.macroPill}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
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
  searchQuery,
}: {
  recipe: Recipe;
  onPress: () => void;
  searchQuery: string;
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.cardTitleStatsRow}>
        <Text style={styles.cardTitleCentered}>
          <HighlightedText text={recipe.title} query={searchQuery} />
        </Text>
        <View style={styles.cardStatsRow}>
          <View style={styles.calorieBadge}>
            <Text style={styles.calorieText}>{recipe.calories ?? 'N/A'} kcal</Text>
          </View>
          <View style={styles.servingsBadge}>
            <Text style={styles.servingsBadgeText}>
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
              backgroundColor: '#F9FAFB',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
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
        <MacroPill
          label="Fats"
          value={formatMacroValue(recipe.macros.fats ?? recipe.macros.fat ?? 'N/A')}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function CookbookList() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; query?: string }>();
  const normalizedCategory = CATEGORIES.includes(params.category as FilterCategory)
    ? (params.category as FilterCategory)
    : 'All';
  const normalizedQuery = typeof params.query === 'string' ? params.query : '';
  const { recipes } = useCookbookContext();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(normalizedCategory);
  const [searchQuery, setSearchQuery] = useState(normalizedQuery);

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Cookbook</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            placeholder="Search recipes, ingredients..."
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
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
                isActive && styles.actionButtonActive,
              ]}
              onPress={() => setActiveCategory(label)}
            >
              <Text style={[styles.actionText, isActive && styles.actionTextActive]}>{label}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionTextActive: {
    color: '#FFFFFF',
  },
  listSection: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.primary,
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
    color: COLORS.primary,
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
    color: '#2F855A',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
