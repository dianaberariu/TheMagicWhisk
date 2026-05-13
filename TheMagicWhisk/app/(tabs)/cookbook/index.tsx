import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useCookbookContext } from '../../../CookbookContext';

type Macro = {
  protein: number;
  carbs: number;
  fats: number;
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
  calories: number;
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

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{recipe.title}</Text>
        <View style={styles.calorieBadge}>
          <Text style={styles.calorieText}>{recipe.calories} kcal</Text>
        </View>
      </View>
      <Text style={styles.cardSubtext}>Macros per serving</Text>
      <View style={styles.macroRow}>
        <MacroPill label="Protein" value={formatMacroValue(recipe.macros.protein)} />
        <MacroPill label="Carbs" value={formatMacroValue(recipe.macros.carbs)} />
        <MacroPill label="Fats" value={formatMacroValue(recipe.macros.fats)} />
      </View>
    </TouchableOpacity>
  );
}

export default function CookbookList() {
  const router = useRouter();
  const { recipes } = useCookbookContext();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');

  const filteredRecipes = useMemo(() => {
    if (activeCategory === 'All') {
      return recipes as Recipe[];
    }
    return (recipes as Recipe[]).filter(
      (recipe) => recipe.category === activeCategory
    );
  }, [activeCategory, recipes]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Cookbook</Text>
        <View style={styles.actionRow}>
          {CATEGORIES.map((label, index) => {
            const isActive = label === activeCategory;
            return (
            <TouchableOpacity
              key={label}
              style={[
                styles.actionButton,
                isActive && styles.actionButtonActive,
                index === CATEGORIES.length - 1 && styles.actionButtonLast,
              ]}
              onPress={() => setActiveCategory(label)}
            >
              <Text style={[styles.actionText, isActive && styles.actionTextActive]}>{label}</Text>
            </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.listSection}>
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
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
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonLast: {
    marginRight: 0,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 12,
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
  cardSubtext: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
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
