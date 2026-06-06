import { Item } from "../types/item";

export const lostItems: Item[] = [
  {
    id: "lost-1",
    title: "Black leather wallet",
    imageUri:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=80&auto=format&fit=crop",
    status: "Lost",
    category: "Accessories",
    location: "Central Park",
    date: "May 14, 2026",
    description:
      "Black leather wallet with a slim profile, containing a student ID and a blue metro card.",
    ownerName: "Andrei Popescu",
  },
  {
    id: "lost-2",
    title: "AirPods Pro case",
    imageUri:
      "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=900&q=80&auto=format&fit=crop",
    status: "Lost",
    category: "Electronics",
    location: "University Library",
    date: "May 18, 2026",
    description:
      "White AirPods Pro charging case in a matte silicone sleeve, last seen near the study area.",
    ownerName: "Maria Ionescu",
  },
  {
    id: "lost-3",
    title: "Silver ring",
    imageUri:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&q=80&auto=format&fit=crop",
    status: "Lost",
    category: "Jewelry",
    location: "Old Town Cafe",
    date: "May 21, 2026",
    description:
      "Small silver ring engraved with initials on the inside, sentimental value to the owner.",
    ownerName: "Ioana Marin",
  },
];

export const foundItems: Item[] = [
  {
    id: "found-1",
    title: "Blue backpack",
    imageUri:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&q=80&auto=format&fit=crop",
    status: "Found",
    category: "Bags",
    location: "Metro Station",
    date: "May 19, 2026",
    description:
      "Canvas backpack with a laptop sleeve and a reflective stripe, handed in by a commuter.",
    ownerName: "Ana Dumitrescu",
  },
  {
    id: "found-2",
    title: "iPhone 14 Pro",
    imageUri:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80&auto=format&fit=crop",
    status: "Found",
    category: "Electronics",
    location: "Café Verona",
    date: "May 20, 2026",
    description:
      "Space black iPhone with a clear case and a cracked back corner, currently kept safe by staff.",
    ownerName: "Alex Stoica",
  },
  {
    id: "found-3",
    title: "Smart watch",
    imageUri:
      "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=900&q=80&auto=format&fit=crop",
    status: "Found",
    category: "Wearables",
    location: "Gym Reception",
    date: "May 23, 2026",
    description:
      "Black fitness watch with a fabric strap, found after an evening workout session.",
    ownerName: "Vlad Radu",
  },
];

export const allMockItems: Item[] = [...lostItems, ...foundItems];

