"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyMatchesForNewPost = exports.findMatchesForPostWithDetails = exports.findMatchesForPost = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const notifications_1 = require("./notifications");
const matching_1 = require("./matching");
const PUBLIC_USER_FIELDS = "displayName phone profileImage";
/**
 * Finds possible matches for `post` among opposite-status posts stored in MongoDB.
 * Images are left out while scoring (they are large) and loaded only for the winners.
 */
const findMatchesForPost = async (post, options = {}) => {
    const oppositeStatus = post.status === "Lost" ? "Found" : "Lost";
    const ownerId = (0, matching_1.getOwnerId)(post);
    const candidates = (await Post_1.default.find({
        status: oppositeStatus,
        ...(ownerId ? { userId: { $ne: ownerId } } : {}),
    })
        .select("-imageUri")
        .lean());
    return (0, matching_1.rankMatches)(post, candidates, options);
};
exports.findMatchesForPost = findMatchesForPost;
/** Same as findMatchesForPost, with image and public owner info for the API response. */
const findMatchesForPostWithDetails = async (post, limit = 5) => {
    const matches = await (0, exports.findMatchesForPost)(post, { limit });
    if (matches.length === 0)
        return [];
    const ids = matches.map((match) => (0, matching_1.getPostId)(match.post));
    const fullPosts = await Post_1.default.find({ _id: { $in: ids } })
        .populate("userId", PUBLIC_USER_FIELDS)
        .lean();
    const byId = new Map(fullPosts.map((fullPost) => [String(fullPost._id), fullPost]));
    return matches
        .map((match) => {
        const fullPost = byId.get(String((0, matching_1.getPostId)(match.post)));
        if (!fullPost)
            return null;
        return {
            score: match.score,
            reasons: match.reasons,
            post: { id: String(fullPost._id), ...fullPost },
        };
    })
        .filter((match) => match !== null);
};
exports.findMatchesForPostWithDetails = findMatchesForPostWithDetails;
/**
 * After a post is created: notify owners of strongly matching posts and tell the
 * author how many possible matches already exist. Errors are logged, never thrown.
 */
const notifyMatchesForNewPost = async (post) => {
    try {
        const matches = await (0, exports.findMatchesForPost)(post, { limit: 10, minScore: matching_1.NOTIFY_MATCH_SCORE });
        if (matches.length === 0)
            return;
        const authorId = (0, matching_1.getOwnerId)(post);
        const ownerIds = [...new Set(matches.map((match) => (0, matching_1.getOwnerId)(match.post)).filter(Boolean))];
        const users = await User_1.default.find({ _id: { $in: [...ownerIds, ...(authorId ? [authorId] : [])] } })
            .select("expoPushToken")
            .lean();
        const tokenByUser = new Map(users.map((user) => [String(user._id), user.expoPushToken]));
        const newPostId = (0, matching_1.getPostId)(post);
        const notified = new Set();
        for (const match of matches) {
            const ownerId = (0, matching_1.getOwnerId)(match.post);
            const token = ownerId ? tokenByUser.get(ownerId) : null;
            if (!ownerId || !token || notified.has(ownerId))
                continue;
            notified.add(ownerId);
            const kind = match.post.status === "Lost" ? "lost" : "found";
            await (0, notifications_1.sendPushNotification)(token, `Possible match for your ${kind} item`, `"${post.title}" looks similar to your "${match.post.title}" (${Math.round(match.score * 100)}% match)`, { type: "match-found", postId: newPostId, matchedPostId: (0, matching_1.getPostId)(match.post), score: match.score });
        }
        const authorToken = authorId ? tokenByUser.get(authorId) : null;
        if (authorToken) {
            await (0, notifications_1.sendPushNotification)(authorToken, "Possible matches found", `We found ${matches.length} post${matches.length === 1 ? "" : "s"} similar to "${post.title}".`, { type: "matches-for-your-post", postId: newPostId, count: matches.length });
        }
        console.log(`[match] Post ${newPostId}: ${matches.length} strong match(es), ${notified.size} owner(s) notified.`);
    }
    catch (error) {
        console.error("[match] Failed to notify matches:", error);
    }
};
exports.notifyMatchesForNewPost = notifyMatchesForNewPost;
//# sourceMappingURL=postMatches.js.map