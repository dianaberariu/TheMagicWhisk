import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GroceryContext = createContext(null);
const STORAGE_KEY = '@grocery_list';

export function GroceryProvider({ children }) {
  const [groceryList, setGroceryList] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadGroceryList = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && isActive) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setGroceryList(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load grocery list', error);
      } finally {
        if (isActive) {
          setHasLoaded(true);
        }
      }
    };

    loadGroceryList();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const saveGroceryList = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(groceryList));
      } catch (error) {
        console.error('Failed to save grocery list', error);
      }
    };

    saveGroceryList();
  }, [groceryList, hasLoaded]);

  const addToGroceryList = useCallback((newIngredients) => {
    if (!Array.isArray(newIngredients) || newIngredients.length === 0) {
      return;
    }

    setGroceryList((prev) => {
      const existingNames = new Set(
        prev.map((item) => item.name.trim().toLowerCase())
      );
      const additions = newIngredients
        .filter((item) => {
          const nameKey = (item?.name ?? '').trim().toLowerCase();
          return nameKey && !existingNames.has(nameKey);
        })
        .map((item, index) => ({
          id: item.id ?? `grocery-${Date.now()}-${index}`,
          name: item.name,
          amount: item.amount ?? '',
          isChecked: false,
        }));

      if (additions.length === 0) {
        return prev;
      }

      return [...prev, ...additions];
    });
  }, []);

  const toggleGroceryItem = useCallback((id) => {
    setGroceryList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  }, []);

  const removeGroceryItem = useCallback((id) => {
    setGroceryList((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearGroceryList = useCallback(() => {
    setGroceryList([]);
  }, []);

  const value = useMemo(
    () => ({
      groceryList,
      addToGroceryList,
      toggleGroceryItem,
      removeGroceryItem,
      clearGroceryList,
    }),
    [groceryList, addToGroceryList, toggleGroceryItem, removeGroceryItem, clearGroceryList]
  );

  return <GroceryContext.Provider value={value}>{children}</GroceryContext.Provider>;
}

export function useGroceryContext() {
  const context = useContext(GroceryContext);
  if (!context) {
    throw new Error('useGroceryContext must be used within GroceryProvider');
  }
  return context;
}
