import type { Item } from "./item";

/** A post that probably refers to the same object (Lost <-> Found). */
export interface PostMatch {
  item: Item;
  /** Similarity between 0 and 1. */
  score: number;
  /** Human-readable explanations, strongest first (e.g. "Same color: black"). */
  reasons: string[];
}
