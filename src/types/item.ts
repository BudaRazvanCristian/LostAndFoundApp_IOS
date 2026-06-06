export type ItemStatus = "Lost" | "Found";

export interface Item {
  id: string;
  title: string;
  imageUri: string;
  status: ItemStatus;
  category: string;
  location: string;
  date: string;
  description: string;
  ownerName: string;
}
