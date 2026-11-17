import Post from "../models/Post";
import User from "../models/User";
import { sendPushNotification } from "./notifications";
import {
  getOwnerId,
  getPostId,
  MatchablePost,
  NOTIFY_MATCH_SCORE,
  rankMatches,
  RankedMatch,
} from "./matching";

const PUBLIC_USER_FIELDS = "displayName phone profileImage";

/**
 * Finds possible matches for `post` among opposite-status posts stored in MongoDB.
 * Images are left out while scoring (they are large) and loaded only for the winners.
 */
export const findMatchesForPost = async (
  post: MatchablePost,
  options: { limit?: number; minScore?: number } = {},
): Promise<RankedMatch<MatchablePost>[]> => {
  const oppositeStatus = post.status === "Lost" ? "Found" : "Lost";
  const ownerId = getOwnerId(post);

  const candidates = (await Post.find({
    status: oppositeStatus,
    ...(ownerId ? { userId: { $ne: ownerId } } : {}),
  })
    .select("-imageUri")
    .lean()) as unknown as MatchablePost[];

  return rankMatches(post, candidates, options);
};

/** Same as findMatchesForPost, with image and public owner info for the API response. */
export const findMatchesForPostWithDetails = async (post: MatchablePost, limit = 5) => {
  const matches = await findMatchesForPost(post, { limit });
  if (matches.length === 0) return [];

  const ids = matches.map((match) => getPostId(match.post));
  const fullPosts = await Post.find({ _id: { $in: ids } })
    .populate("userId", PUBLIC_USER_FIELDS)
    .lean();
  const byId = new Map(fullPosts.map((fullPost: any) => [String(fullPost._id), fullPost]));

  return matches
    .map((match) => {
      const fullPost = byId.get(String(getPostId(match.post)));
      if (!fullPost) return null;
      return {
        score: match.score,
        reasons: match.reasons,
        post: { id: String(fullPost._id), ...fullPost },
      };
    })
    .filter((match): match is NonNullable<typeof match> => match !== null);
};

/**
 * After a post is created: notify owners of strongly matching posts and tell the
 * author how many possible matches already exist. Errors are logged, never thrown.
 */
export const notifyMatchesForNewPost = async (post: MatchablePost): Promise<void> => {
  try {
    const matches = await findMatchesForPost(post, { limit: 10, minScore: NOTIFY_MATCH_SCORE });
    if (matches.length === 0) return;

    const authorId = getOwnerId(post);
    const ownerIds = [...new Set(matches.map((match) => getOwnerId(match.post)).filter(Boolean))] as string[];
    const users = await User.find({ _id: { $in: [...ownerIds, ...(authorId ? [authorId] : [])] } })
      .select("expoPushToken")
      .lean();
    const tokenByUser = new Map(
      users.map((user: any) => [String(user._id), user.expoPushToken as string | null | undefined]),
    );

    const newPostId = getPostId(post);
    const notified = new Set<string>();

    for (const match of matches) {
      const ownerId = getOwnerId(match.post);
      const token = ownerId ? tokenByUser.get(ownerId) : null;
      if (!ownerId || !token || notified.has(ownerId)) continue;
      notified.add(ownerId);

      const kind = match.post.status === "Lost" ? "lost" : "found";
      await sendPushNotification(
        token,
        `Possible match for your ${kind} item`,
        `"${post.title}" looks similar to your "${match.post.title}" (${Math.round(match.score * 100)}% match)`,
        { type: "match-found", postId: newPostId, matchedPostId: getPostId(match.post), score: match.score },
      );
    }

    const authorToken = authorId ? tokenByUser.get(authorId) : null;
    if (authorToken) {
      await sendPushNotification(
        authorToken,
        "Possible matches found",
        `We found ${matches.length} post${matches.length === 1 ? "" : "s"} similar to "${post.title}".`,
        { type: "matches-for-your-post", postId: newPostId, count: matches.length },
      );
    }

    console.log(`[match] Post ${newPostId}: ${matches.length} strong match(es), ${notified.size} owner(s) notified.`);
  } catch (error) {
    console.error("[match] Failed to notify matches:", error);
  }
};
