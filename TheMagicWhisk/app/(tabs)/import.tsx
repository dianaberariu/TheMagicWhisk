import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import ScreenBackground from '../../components/ScreenBackground';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCookbookContext } from '../../CookbookContext';
import { useThemeContext } from '../../context/ThemeContext';

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
  const { addRecipe } = useCookbookContext();
  const { isDarkMode } = useThemeContext();
  const [selectedCategory, setSelectedCategory] = useState<Category>('Lunch');
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setUrlInput('');
    }, [])
  );

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
      const response = await fetch('http://192.168.1.171:8000/api/extract', {
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
