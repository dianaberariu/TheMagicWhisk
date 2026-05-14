import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  {
    name: 'Breakfast',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  },
  {
    name: 'Lunch',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  },
  {
    name: 'Dinner',
    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80',
  },
  {
    name: 'Sweets',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80',
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredRecipe, setFeaturedRecipe] = useState<any>(null);
  const { recipes } = useCookbookContext();
  const { groceryList } = useGroceryContext() as GroceryContextValue;
  const recentRecipes = (recipes as Recipe[]).slice(0, 4);
  const itemCount = groceryList.length;

  useEffect(() => {
    const recipeList = recipes as Recipe[];
    if (!recipeList?.length) {
      setFeaturedRecipe(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * recipeList.length);
    setFeaturedRecipe(recipeList[randomIndex]);
  }, [recipes]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentInset}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Hello, Diana!</Text>
              <Text style={styles.greetingSubtitle}>What are we cooking today?</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.muted} />
            <TextInput
              placeholder="Search recipes, ingredients..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => {
                const trimmed = searchQuery.trim();
                if (!trimmed) {
                  return;
                }

                router.navigate({
                  pathname: '/(tabs)/cookbook',
                  params: { query: trimmed },
                });
                setSearchQuery('');
              }}
            />
          </View>

          <View style={styles.categoryGrid}>
            {CATEGORY_LINKS.map((category) => (
              <TouchableOpacity
                key={category.name}
                activeOpacity={0.8}
                onPress={() =>
                  router.navigate({
                    pathname: '/(tabs)/cookbook',
                    params: { category: category.name },
                  })
                }
                style={styles.categoryCard}
              >
                <ImageBackground
                  source={{ uri: category.image }}
                  style={styles.categoryCardImage}
                >
                  <View style={styles.categoryCardOverlay} />
                  <Text style={styles.categoryCardLabel}>{category.name}</Text>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>

          {!recipes || recipes.length === 0 ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                Get Started 🚀
              </Text>
              <View
                style={{
                  backgroundColor: '#EAF6F0',
                  borderRadius: 20,
                  padding: 24,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#D1EAE0',
                }}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={48}
                  color="#65B891"
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  Your Cookbook is Empty
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#6B7280',
                    textAlign: 'center',
                    marginBottom: 20,
                  }}
                >
                  Import your first recipe from TikTok, YouTube, or a website to start cooking!
                </Text>
                <TouchableOpacity
                  onPress={() => router.navigate('/(tabs)/import')}
                  style={{
                    backgroundColor: '#65B891',
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                    Import a Recipe
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            featuredRecipe && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#111827',
                    marginTop: 8,
                    marginBottom: 12,
                    textAlign: 'center',
                  }}
                >
                  Recipe of the Day
                </Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    router.navigate({
                      pathname: '/(tabs)/cookbook/recipe-details',
                      params: { recipe: JSON.stringify(featuredRecipe) },
                    })
                  }
                  style={{
                    height: 200,
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: '#F3F4F6',
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 10,
                    elevation: 4,
                  }}
                >
                  <ImageBackground
                    source={{
                      uri:
                        featuredRecipe.image_url ||
                        featuredRecipe.image ||
                        'https://via.placeholder.com/400x200?text=No+Image',
                    }}
                    style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
                  >
                    {/* Dark Gradient Overlay for Text Readability */}
                    <View
                      style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                      }}
                    />

                    <View style={{ padding: 16 }}>
                      <Text
                        style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}
                        numberOfLines={2}
                      >
                        {featuredRecipe.title}
                      </Text>
                      <Text style={{ color: '#EAF6F0', fontSize: 14, fontWeight: '600' }}>
                        {featuredRecipe.calories ? `${featuredRecipe.calories} kcal  •  ` : ''}
                        {featuredRecipe.time || 'Quick Prep'}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            )
          )}

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
    paddingTop: 20,
    paddingBottom: 40,
  },
  contentInset: {
    paddingHorizontal: 20,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  categoryCard: {
    width: '47%',
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: '#F3F4F6',
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  categoryCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
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
    textAlign: 'center',
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