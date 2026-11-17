/**
 * Lost <-> Found matching.
 *
 * Compares a post with posts of the opposite status and produces an explainable
 * similarity score (0..1) built from independent signals:
 *   object type, color, brand, shared details, map distance and time between reports.
 *
 * Signals use the AI image analysis when a post has one and fall back to the
 * title / description / category text otherwise (English + Romanian keywords).
 */
import type { ItemAiAnalysis } from "../types/itemAnalysis";
export type MatchSignalKey = "object" | "color" | "brand" | "details" | "location" | "time";
export interface MatchablePost {
    _id?: unknown;
    id?: unknown;
    userId?: unknown;
    status: "Lost" | "Found" | string;
    title?: string | null;
    description?: string | null;
    category?: string | null;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    date?: string | null;
    createdAt?: Date | string | null;
    aiAnalysis?: Partial<ItemAiAnalysis> | null;
}
export interface MatchSignal {
    key: MatchSignalKey;
    weight: number;
    score: number;
    reason?: string;
}
export interface MatchResult {
    score: number;
    reasons: string[];
    signals: MatchSignal[];
}
/** Minimum score for a post to be listed as a possible match. */
export declare const MIN_MATCH_SCORE = 0.4;
/** Minimum score for sending a "possible match" push notification. */
export declare const NOTIFY_MATCH_SCORE = 0.6;
export declare const normalizeTokens: (...values: Array<string | null | undefined | string[]>) => string[];
export declare const getPostId: (post: MatchablePost) => string | null;
export declare const getOwnerId: (post: MatchablePost) => string | null;
/** Similarity between two posts (order does not matter). */
export declare const scorePostMatch: (a: MatchablePost, b: MatchablePost) => MatchResult;
export interface RankedMatch<T extends MatchablePost> extends MatchResult {
    post: T;
}
/**
 * Ranks candidate posts against `post`. Only opposite-status posts from other users
 * with a score of at least `minScore` are returned, best first.
 */
export declare const rankMatches: <T extends MatchablePost>(post: MatchablePost, candidates: T[], { limit, minScore }?: {
    limit?: number;
    minScore?: number;
}) => RankedMatch<T>[];
//# sourceMappingURL=matching.d.ts.map