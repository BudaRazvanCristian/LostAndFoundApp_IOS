export type ItemStatus = "Lost" | "Found";

export interface Item {
  id: string;
  // Used for ownership checks (show delete only for post creator)
  userId?: string;
  title: string;
  imageUri: string;
  status: ItemStatus;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  date: string;
  description: string;
  ownerName: string;
  // Owner phone number (required for contact)
  phoneNumber: string;
}
