import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

const GroceryContext = createContext(null);

function normalizeName(name) {
  return String(name ?? '').trim().toLowerCase();
}

export function GroceryProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [groceryList, setGroceryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  const userId = user?.id;

  const refreshGroceryList = useCallback(async () => {
    if (!userId) {
      return [];
    }

    const { data, error: fetchError } = await supabase
      .from('groceries')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    return Array.isArray(data) ? data : [];
  }, [userId]);

  useEffect(() => {
    let isActive = true;

    const loadGroceryList = async () => {
      if (authLoading) {
        return;
      }

      if (!userId) {
        if (isActive) {
          setGroceryList([]);
          setIsLoading(false);
          setError(null);
        }
        return;
      }

      if (isActive) {
        setIsLoading(true);
      }

      try {
        const groceries = await refreshGroceryList();
        if (isActive) {
          setGroceryList(groceries);
          setError(null);
        }
      } catch (loadError) {
        console.error('Failed to load grocery list', loadError);
        if (isActive) {
          setError(loadError?.message ?? 'Failed to load grocery list');
          setGroceryList([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadGroceryList();

    return () => {
      isActive = false;
    };
  }, [authLoading, refreshGroceryList, userId]);

  const addToGroceryList = useCallback(
    async (newIngredients) => {
      if (!userId || !Array.isArray(newIngredients) || newIngredients.length === 0) {
        return;
      }

      const currentNames = new Set(groceryList.map((item) => normalizeName(item.name)));
      const additions = newIngredients.reduce((items, ingredient) => {
        const name = String(ingredient?.name ?? '').trim();
        const normalizedName = normalizeName(name);

        if (!name || currentNames.has(normalizedName)) {
          return items;
        }

        currentNames.add(normalizedName);
        items.push({
          name,
          is_completed: false,
          user_id: userId,
        });

        return items;
      }, []);

      if (additions.length === 0) {
        return;
      }

      setIsMutating(true);

      try {
        const { error: insertError } = await supabase.from('groceries').insert(additions);

        if (insertError) {
          throw insertError;
        }

        const groceries = await refreshGroceryList();
        setGroceryList(groceries);
        setError(null);
      } catch (addError) {
        console.error('Failed to add grocery items', addError);
        setError(addError?.message ?? 'Failed to add grocery items');
      } finally {
        setIsMutating(false);
      }
    },
    [groceryList, refreshGroceryList, userId]
  );

  const toggleGroceryItem = useCallback(
    async (id) => {
      if (!userId) {
        return;
      }

      const item = groceryList.find((entry) => entry.id === id);
      if (!item) {
        return;
      }

      setIsMutating(true);

      try {
        const { error: updateError } = await supabase
          .from('groceries')
          .update({ is_completed: !item.is_completed })
          .eq('id', id)
          .eq('user_id', userId);

        if (updateError) {
          throw updateError;
        }

        const groceries = await refreshGroceryList();
        setGroceryList(groceries);
        setError(null);
      } catch (toggleError) {
        console.error('Failed to update grocery item', toggleError);
        setError(toggleError?.message ?? 'Failed to update grocery item');
      } finally {
        setIsMutating(false);
      }
    },
    [groceryList, refreshGroceryList, userId]
  );

  const removeGroceryItem = useCallback(
    async (id) => {
      if (!userId) {
        return;
      }

      setIsMutating(true);

      try {
        const { error: deleteError } = await supabase
          .from('groceries')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (deleteError) {
          throw deleteError;
        }

        const groceries = await refreshGroceryList();
        setGroceryList(groceries);
        setError(null);
      } catch (deleteError) {
        console.error('Failed to remove grocery item', deleteError);
        setError(deleteError?.message ?? 'Failed to remove grocery item');
      } finally {
        setIsMutating(false);
      }
    },
    [refreshGroceryList, userId]
  );

  const clearGroceryList = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsMutating(true);

    try {
      const { error: deleteError } = await supabase
        .from('groceries')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      setGroceryList([]);
      setError(null);
    } catch (clearError) {
      console.error('Failed to clear grocery list', clearError);
      setError(clearError?.message ?? 'Failed to clear grocery list');
    } finally {
      setIsMutating(false);
    }
  }, [userId]);

  const value = useMemo(
    () => ({
      groceryList,
      isLoading,
      isMutating,
      error,
      refreshGroceryList,
      addToGroceryList,
      toggleGroceryItem,
      removeGroceryItem,
      clearGroceryList,
    }),
    [
      groceryList,
      isLoading,
      isMutating,
      error,
      refreshGroceryList,
      addToGroceryList,
      toggleGroceryItem,
      removeGroceryItem,
      clearGroceryList,
    ]
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
