import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useCookbookContext } from '../../CookbookContext';
import { useGroceryContext } from '../../GroceryContext';
import { useAuth } from '../../AuthContext';

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
  accentDark: '#4F9B78',
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
  const { signOut, user } = useAuth();
  const recentRecipes = (recipes as Recipe[]).slice(0, 4);
  const itemCount = groceryList.length;
  const displayName = user?.user_metadata?.full_name || 'Chef';

  useEffect(() => {
    const recipeList = recipes as Recipe[];
    if (!recipeList?.length) {
      setFeaturedRecipe(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * recipeList.length);
    setFeaturedRecipe(recipeList[randomIndex]);
  }, [recipes]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Failed to sign out', error);
      }
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentInset}>
            <View style={styles.headerRow}>
              <View style={styles.greetingWrap}>
                <Text style={styles.greeting}>Hello, {displayName}!</Text>
                <Text style={styles.greetingSubtitle}>What are we cooking today?</Text>
              </View>
              <TouchableOpacity
                style={styles.iconShell}
                activeOpacity={0.85}
                onPress={() => router.push('/settings' as never)}
              >
                <Ionicons name="person-circle-outline" size={34} color={COLORS.accentDark} />
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

          {recipes && recipes.length > 0 ? (
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
          ) : (
            <View style={styles.emptyStateWrap}>
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateIconShell}>
                  <Ionicons name="restaurant-outline" size={28} color={COLORS.accent} />
                </View>
                <Text style={styles.emptyStateTitle}>Your cookbook is waiting</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Head over to the Import tab to add your first recipe and start your culinary magic.
                </Text>
                <TouchableOpacity
                  onPress={() => router.navigate('/(tabs)/import')}
                  activeOpacity={0.85}
                  style={styles.emptyStateButton}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyStateButtonText}>Import a Recipe</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {recipes && recipes.length > 0 && (
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

          {recipes && recipes.length > 0 && (
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
          )}
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
  iconShell: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#E4F4EC',
    borderWidth: 1,
    borderColor: '#D5EBDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  greetingWrap: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
  emptyStateWrap: {
    marginBottom: 18,
  },
  emptyStateCard: {
    backgroundColor: '#F2FAF6',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6EBDD',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  emptyStateIconShell: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#E3F3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#55606B',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 320,
  },
  emptyStateButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
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