import assert from "assert";

import { MatchablePost, MIN_MATCH_SCORE, NOTIFY_MATCH_SCORE, rankMatches, scorePostMatch } from "../src/services/matching";

// Two points ~300 m apart in Targu Mures, and one in Bucharest.
const TG_MURES_A = { latitude: 46.5425, longitude: 24.5575 };
const TG_MURES_B = { latitude: 46.5450, longitude: 24.5560 };
const BUCHAREST = { latitude: 44.4268, longitude: 26.1025 };

const post = (overrides: Partial<MatchablePost>): MatchablePost => ({
  _id: Math.random().toString(16).slice(2),
  userId: "user-a",
  status: "Lost",
  title: "",
  description: "",
  category: "",
  location: "",
  date: "2026-11-10",
  ...overrides,
});

const lostNikeBackpack = post({
  title: "Black Nike Backpack",
  description: "Lost my backpack, it has a big white logo and a laptop sleeve.",
  category: "Bags",
  ...TG_MURES_A,
  aiAnalysis: {
    objectType: "backpack",
    brand: "Nike",
    primaryColor: "black",
    secondaryColors: ["white"],
    material: "polyester",
    distinguishingFeatures: ["large white logo", "laptop sleeve"],
    visibleText: ["NIKE"],
  },
});

const foundNikeBackpack = post({
  userId: "user-b",
  status: "Found",
  title: "Black backpack found near the station",
  description: "Black backpack with a white logo",
  category: "Bags & Luggage",
  date: "2026-11-11",
  ...TG_MURES_B,
  aiAnalysis: {
    objectType: "backpack",
    brand: "Nike",
    primaryColor: "black",
    secondaryColors: ["white"],
    material: "polyester",
    distinguishingFeatures: ["white swoosh logo", "laptop sleeve"],
    visibleText: ["NIKE"],
  },
});

// 1. Same object, same place, one day apart => strong match, notification-worthy.
const strong = scorePostMatch(lostNikeBackpack, foundNikeBackpack);
assert.ok(strong.score >= NOTIFY_MATCH_SCORE, `Expected strong match, got ${strong.score}`);
assert.ok(strong.reasons.some((reason) => reason.includes("backpack")), "Reasons should mention the object type");
assert.ok(strong.reasons.some((reason) => reason.includes("black")), "Reasons should mention the color");
assert.ok(strong.reasons.some((reason) => reason.includes("nike")), "Reasons should mention the brand");

// 2. Symmetric.
assert.strictEqual(scorePostMatch(foundNikeBackpack, lostNikeBackpack).score, strong.score);

// 3. Different object at the same place and time => not a match.
const foundAirpods = post({
  userId: "user-c",
  status: "Found",
  title: "AirPods case",
  category: "Electronics",
  date: "2026-11-11",
  ...TG_MURES_B,
  aiAnalysis: { objectType: "earbuds", brand: "Apple", primaryColor: "white" },
});
const differentObject = scorePostMatch(lostNikeBackpack, foundAirpods);
assert.ok(differentObject.score < MIN_MATCH_SCORE, `Different objects should not match, got ${differentObject.score}`);

// 4. Same object but a different brand scores lower than the same brand.
const foundAdidasBackpack = post({
  ...foundNikeBackpack,
  _id: "adidas",
  aiAnalysis: { ...foundNikeBackpack.aiAnalysis, brand: "Adidas", visibleText: ["ADIDAS"] },
});
assert.ok(
  scorePostMatch(lostNikeBackpack, foundAdidasBackpack).score < strong.score,
  "A different brand should lower the score",
);

// 5. Far away and months apart scores lower than nearby and recent.
const farAndOld = post({ ...foundNikeBackpack, _id: "far", date: "2026-06-01", ...BUCHAREST });
assert.ok(scorePostMatch(lostNikeBackpack, farAndOld).score < strong.score, "Distance and time should matter");

// 6. Romanian text without AI analysis still matches English AI data.
const foundRucsac = post({
  userId: "user-d",
  status: "Found",
  title: "Rucsac negru Nike",
  description: "Am gasit un rucsac negru langa gara",
  category: "Genti",
  date: "2026-11-12",
  ...TG_MURES_B,
});
const romanian = scorePostMatch(lostNikeBackpack, foundRucsac);
assert.ok(romanian.score >= MIN_MATCH_SCORE, `Romanian post should match, got ${romanian.score}`);

// 7. A backpack and a generic bag are related, but less than two backpacks.
const foundBag = post({ userId: "user-e", status: "Found", title: "Geanta neagra", date: "2026-11-11", ...TG_MURES_B });
const bagScore = scorePostMatch(lostNikeBackpack, foundBag).score;
assert.ok(bagScore > differentObject.score && bagScore < strong.score, `Bag vs backpack should be in between, got ${bagScore}`);

// 8. Ranking: opposite status only, never the author's own posts, best first.
const ownFoundPost = post({ ...foundNikeBackpack, _id: "own", userId: "user-a" });
const otherLostPost = post({ ...lostNikeBackpack, _id: "other-lost", userId: "user-z" });
const ranked = rankMatches(lostNikeBackpack, [foundAirpods, foundRucsac, ownFoundPost, otherLostPost, foundNikeBackpack]);
assert.deepStrictEqual(
  ranked.map((match) => match.post),
  [foundNikeBackpack, foundRucsac],
  "Ranking should keep only other users' Found posts that match, best first",
);

// 9. Posts with no comparable information never match.
assert.strictEqual(scorePostMatch(post({ title: "Test" }), post({ status: "Found", title: "Tete" })).score, 0);

console.log("Matching checks passed.");
console.log(`  strong=${strong.score} romanian=${romanian.score} bag=${bagScore} differentObject=${differentObject.score}`);
