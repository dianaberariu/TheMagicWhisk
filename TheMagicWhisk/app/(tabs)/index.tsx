import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useCookbookContext } from '../../CookbookContext';
import { useGroceryContext } from '../../GroceryContext';

type Recipe = {
  id: string;
  title: string;
  calories: number | string;
  image?: string;
};

type GroceryItem = {
  id: string;
  name: string;
  amount?: string;
  isChecked: boolean;
};

type GroceryContextValue = {
  groceryList: GroceryItem[];
};

const COLORS = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  accent: '#6FCF97',
};

const CATEGORY_LINKS = [
  { label: 'Breakfast', icon: 'cafe-outline' },
  { label: 'Lunch', icon: 'fast-food-outline' },
  { label: 'Dinner', icon: 'restaurant-outline' },
  { label: 'Sweets', icon: 'ice-cream-outline' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { recipes } = useCookbookContext();
  const { groceryList } = useGroceryContext() as GroceryContextValue;
  const recentRecipes = (recipes as Recipe[]).slice(0, 4);
  const itemCount = groceryList.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, Diana!</Text>
            <Text style={styles.greetingSubtitle}>What are we cooking today?</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {CATEGORY_LINKS.map((category) => (
            <TouchableOpacity
              key={category.label}
              style={styles.categoryCard}
              activeOpacity={0.85}
              onPress={() =>
                router.navigate({
                  pathname: '/(tabs)/cookbook',
                  params: { category: category.label },
                })
              }
            >
              <Ionicons name={category.icon} size={32} color={COLORS.accent} />
              <Text style={styles.categoryCardLabel}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.quickPeekCard}
          activeOpacity={0.9}
          onPress={() => router.navigate('/grocery')}
        >
          <View style={styles.quickPeekRow}>
            <Ionicons name="cart-outline" size={20} color="#65B891" />
            <Text style={styles.quickPeekText}>
              You have <Text style={styles.quickPeekCount}>{itemCount}</Text> items in your grocery list
            </Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Recipes</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          >
            {recentRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recentCard}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/cookbook/recipe-details',
                    params: { recipe: JSON.stringify(recipe) },
                  })
                }
              >
                <Image
                  source={{ uri: recipe.image }}
                  resizeMode="cover"
                  style={styles.recentImage}
                />
                <Text style={styles.recentTitle}>{recipe.title}</Text>
                <Text style={styles.recentCalories}>{recipe.calories} kcal</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    width: '47%',
    aspectRatio: 0.85,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 2,
  },
  categoryCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  quickPeekCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  quickPeekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickPeekText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  quickPeekCount: {
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  recentList: {
    paddingRight: 10,
  },
  recentCard: {
    width: 180,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  recentImage: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  recentCalories: {
    fontSize: 12,
    color: COLORS.muted,
  },
});