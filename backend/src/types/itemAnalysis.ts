export type ItemStatus = "Lost" | "Found";

export interface ItemAiAnalysis {
  objectType: string;
  brand: string | null;
  primaryColor: string | null;
  secondaryColors: string[];
  material: string | null;
  distinguishingFeatures: string[];
  visibleText: string[];
  shortDescription: string;
  suggestedTitle: string;
  suggestedCategory: string;
  confidence: number;
  provider?: string;
  model?: string;
  analyzedAt?: string;
}

export interface AnalyzeItemImageRequest {
  imageUri: string;
  title?: string;
  category?: string;
  status?: ItemStatus;
  location?: string;
  description?: string;
}


