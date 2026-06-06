import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { allMockItems } from "../data/mockItems";
import { Item } from "../types/item";

export type CreateItemInput = Omit<Item, "id">;

interface ItemsContextValue {
  items: Item[];
  lostItems: Item[];
  foundItems: Item[];
  addItem: (item: CreateItemInput) => Item;
}

const ItemsContext = createContext<ItemsContextValue | undefined>(undefined);

export const ItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>(allMockItems);

  const addItem = useCallback((item: CreateItemInput) => {
    const newItem: Item = {
      ...item,
      id: `post-${Date.now()}`,
    };

    setItems((currentItems) => [newItem, ...currentItems]);

    return newItem;
  }, []);

  const value = useMemo(() => {
    const lostItems = items.filter((item) => item.status === "Lost");
    const foundItems = items.filter((item) => item.status === "Found");

    return {
      items,
      lostItems,
      foundItems,
      addItem,
    };
  }, [addItem, items]);

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
};

export const useItems = () => {
  const context = useContext(ItemsContext);

  if (!context) {
    throw new Error("useItems must be used within an ItemsProvider");
  }

  return context;
};
