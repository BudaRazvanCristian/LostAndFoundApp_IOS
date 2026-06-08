import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";

import { Item } from "../types/item";
import firebaseService from "../services/firebaseService";
import authService from "../services/authService";
import { allMockItems } from "../data/mockItems";

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
  const [items, setItems] = useState<Item[]>(allMockItems);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Subscribe to auth state and load items
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState(async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        // Load all items when user is authenticated
        await loadItems();
      } else {
        setCurrentUserId(null);
        // Use mock items when not authenticated
        setItems(allMockItems);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load items from Firestore
  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const firestoreItems = await firebaseService.getAllPosts();

      // Transform Firestore items to Item type
      const transformedItems = firestoreItems.map((item) => ({
        ...item,
        id: item.firebaseId,
      }));

      setItems(transformedItems);
    } catch (err) {
      console.error("Error loading items:", err);
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh items manually
  const refreshItems = useCallback(async () => {
    if (currentUserId) {
      await loadItems();
    }
  }, [currentUserId, loadItems]);

  // Add item to Firestore
  const addItem = useCallback(
    async (item: CreateItemInput): Promise<string> => {
      if (!currentUserId) {
        throw new Error("User must be logged in to add items");
      }

      try {
        setError(null);
        // Add to Firestore
        const itemId = await firebaseService.createPost(currentUserId, item);

        // Add to local state
        const newItem: Item = {
          ...item,
          id: itemId,
        };

        setItems((currentItems) => [newItem, ...currentItems]);
        return itemId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add item";
        setError(errorMessage);
        throw err;
      }
    },
    [currentUserId]
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
      currentUserId,
      refreshItems,
    };
  }, [addItem, items, isLoading, error, currentUserId, refreshItems]);

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
};

export const useItems = () => {
  const context = useContext(ItemsContext);

  if (!context) {
    throw new Error("useItems must be used within an ItemsProvider");
  }

  return context;
};
