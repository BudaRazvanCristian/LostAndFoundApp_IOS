import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";

import { Item } from "../types/item";
import * as apiService from "../services/apiService";
import { useAuth } from "./AuthContext";

export type CreateItemInput = Omit<Item, "id">;

interface ItemsContextValue {
  items: Item[];
  lostItems: Item[];
  foundItems: Item[];
  addItem: (item: CreateItemInput) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  currentUserId: string | null;
  refreshItems: () => Promise<void>;
}

const ItemsContext = createContext<ItemsContextValue | undefined>(undefined);

export const ItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {

      setIsLoading(true);
      setError(null);

      const posts = await apiService.getAllPosts();
      const transformed: Item[] = posts.map((post) => ({
        ...post,
        id: post.id,
      }));
      setItems(transformed);
    } catch (err) {
      console.error("Error loading items:", err);
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load items on mount and when auth state changes
  useEffect(() => {
    loadItems();
  }, [loadItems, isAuthenticated]);

  const refreshItems = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  const addItem = useCallback(
    async (item: CreateItemInput): Promise<string> => {
      if (!isAuthenticated) {
        throw new Error("User must be logged in to add items");
      }

      try {
        setError(null);
        const postId = await apiService.createPost(item);

        const newItem: Item = {
          ...item,
          id: postId,
          userId: user?.id,
        };

        setItems((current) => [newItem, ...current]);
        return postId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add item";
        setError(errorMessage);
        throw err;
      }
    },
    [isAuthenticated, user]
  );

  const value = useMemo(() => {
    const lostItems = items.filter((item) => item.status === "Lost");
    const foundItems = items.filter((item) => item.status === "Found");

    return {
      items,
      lostItems,
      foundItems,
      addItem,
      isLoading,
      error,
      currentUserId: user?.id ?? null,
      refreshItems,
    };
  }, [addItem, items, isLoading, error, user, refreshItems]);

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
};

export const useItems = () => {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error("useItems must be used within an ItemsProvider");
  }
  return context;
};
