import { MatchablePost, RankedMatch } from "./matching";
/**
 * Finds possible matches for `post` among opposite-status posts stored in MongoDB.
 * Images are left out while scoring (they are large) and loaded only for the winners.
 */
export declare const findMatchesForPost: (post: MatchablePost, options?: {
    limit?: number;
    minScore?: number;
}) => Promise<RankedMatch<MatchablePost>[]>;
/** Same as findMatchesForPost, with image and public owner info for the API response. */
export declare const findMatchesForPostWithDetails: (post: MatchablePost, limit?: number) => Promise<{
    score: number;
    reasons: string[];
    post: any;
}[]>;
/**
 * After a post is created: notify owners of strongly matching posts and tell the
 * author how many possible matches already exist. Errors are logged, never thrown.
 */
export declare const notifyMatchesForNewPost: (post: MatchablePost) => Promise<void>;
//# sourceMappingURL=postMatches.d.ts.map