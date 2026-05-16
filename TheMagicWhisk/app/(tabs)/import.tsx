import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCookbookContext } from '../../CookbookContext';

const COLORS = {
  background: '#FFFFFF',
  text: '#111827',
  muted: '#9CA3AF',
  border: '#E5E7EB',
  inputFill: '#F9FAFB',
  primary: '#65B891',
};

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Sweets'] as const;
type Category = (typeof CATEGORIES)[number];

export default function ImportScreen() {
  const router = useRouter();
  const { addRecipe } = useCookbookContext();
  const [selectedCategory, setSelectedCategory] = useState<Category>('Lunch');
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      setUrlInput('');
    }, [])
  );

  const handleExtract = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://172.20.10.6:8000/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await response.json();

      if (data?.status === 'error') {
        Alert.alert('Import Failed', data.message || 'An unknown error occurred.');
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
          languages: recipeData.languages,
        };

        await addRecipe(completeRecipe);
        setUrlInput('');
        router.push({
          pathname: '/(tabs)/cookbook/recipe-details',
          params: { recipe: JSON.stringify(completeRecipe) },
        });
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        'Could not connect to the backend. Check your IP address and ensure the server is running.'
      );
      console.error('Backend connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Import Recipe</Text>
        <TextInput
          placeholder="https://www.tiktok.com/@creator/video/123"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          value={urlInput}
          onChangeText={setUrlInput}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          textContentType="URL"
        />
        <View style={styles.categorySection}>
          <Text style={styles.categoryLabel}>Save as:</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((category) => {
              const isActive = category === selectedCategory;
              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleExtract}
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            {isLoading && (
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonSpinner} />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? 'Analyzing Video...' : 'Extract Recipe'}
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
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
    color: COLORS.text,
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
    marginBottom: 18,
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
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryTextActive: {
    color: '#FFFFFF',
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
  buttonSpinner: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
