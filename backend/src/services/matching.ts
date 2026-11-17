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
export const MIN_MATCH_SCORE = 0.4;
/** Minimum score for sending a "possible match" push notification. */
export const NOTIFY_MATCH_SCORE = 0.6;

const SIGNAL_WEIGHTS: Record<MatchSignalKey, number> = {
  object: 0.35,
  location: 0.2,
  color: 0.15,
  brand: 0.1,
  details: 0.1,
  time: 0.1,
};

const ITEM_SIGNALS = new Set<MatchSignalKey>(["object", "color", "brand", "details"]);

// When the object type is known for both posts and differs, the match is very unlikely.
const OBJECT_MISMATCH_FACTOR = 0.35;
const BRAND_MISMATCH_FACTOR = 0.7;

const OBJECT_SYNONYMS: Record<string, string[]> = {
  backpack: ["backpack", "backpacks", "rucsac", "rucsacul", "ghiozdan", "rucksack"],
  bag: ["bag", "bags", "geanta", "genti", "poseta", "handbag", "purse", "tote", "borseta", "luggage", "suitcase", "valiza"],
  wallet: ["wallet", "wallets", "portofel", "portofelul", "portmoneu", "cardholder"],
  phone: ["phone", "smartphone", "telefon", "telefonul", "iphone", "mobile", "cellphone"],
  earbuds: ["earbuds", "airpods", "earphones", "headphones", "casti", "headset"],
  keys: ["key", "keys", "chei", "cheie", "cheile", "keychain", "breloc"],
  laptop: ["laptop", "notebook", "macbook"],
  tablet: ["tablet", "ipad", "tableta"],
  watch: ["watch", "smartwatch", "ceas", "ceasul"],
  glasses: ["glasses", "sunglasses", "ochelari", "spectacles"],
  documents: ["document", "documents", "passport", "pasaport", "acte", "buletin", "license", "permis", "legitimatie"],
  card: ["card", "cards", "creditcard"],
  umbrella: ["umbrella", "umbrela"],
  jacket: ["jacket", "coat", "geaca", "haina", "jacheta", "hoodie", "hanorac"],
  bottle: ["bottle", "sticla", "termos", "thermos"],
  jewelry: ["ring", "inel", "necklace", "colier", "bracelet", "bratara", "earring", "cercei", "jewelry", "bijuterie"],
  charger: ["charger", "incarcator", "cable", "cablu", "powerbank"],
  pet: ["dog", "caine", "catel", "cat", "pisica", "pet"],
};

const RELATED_OBJECTS: Array<[string, string, number]> = [
  ["backpack", "bag", 0.6],
  ["laptop", "tablet", 0.4],
  ["documents", "card", 0.5],
  ["documents", "wallet", 0.3],
];

const COLOR_SYNONYMS: Record<string, string[]> = {
  black: ["black", "negru", "neagra", "negri", "negre"],
  white: ["white", "alb", "alba", "albi", "albe"],
  red: ["red", "rosu", "rosie", "rosii"],
  blue: ["blue", "navy", "albastru", "albastra", "albastre"],
  green: ["green", "verde", "verzi"],
  yellow: ["yellow", "galben", "galbena"],
  orange: ["orange", "portocaliu", "portocalie"],
  purple: ["purple", "violet", "mov"],
  pink: ["pink", "roz"],
  brown: ["brown", "maro", "maroniu"],
  gray: ["gray", "grey", "gri"],
  silver: ["silver", "argintiu", "argintie"],
  gold: ["gold", "golden", "auriu", "aurie"],
  beige: ["beige", "bej", "tan"],
};

const KNOWN_BRANDS = [
  "apple", "samsung", "xiaomi", "huawei", "sony", "jbl", "lenovo", "dell", "hp", "asus", "acer",
  "nike", "adidas", "puma", "reebok", "eastpak", "samsonite", "guess", "zara", "rayban", "casio",
  "garmin", "fossil", "tommy", "hilfiger", "calvin", "klein", "kors", "northface", "decathlon",
];

// Product names that imply a brand.
const BRAND_HINTS: Record<string, string> = {
  iphone: "apple",
  ipad: "apple",
  airpods: "apple",
  macbook: "apple",
  galaxy: "samsung",
};

const STOPWORDS = new Set([
  // English
  "a", "an", "the", "and", "or", "of", "with", "without", "for", "in", "on", "at", "to", "from", "by", "is", "it",
  "its", "this", "that", "was", "were", "has", "have", "had", "my", "your", "near", "item", "items", "lost", "found",
  "small", "large", "big", "some", "very", "likely", "appears", "visible", "possibly", "one", "two",
  // Romanian
  "si", "sau", "de", "la", "cu", "in", "din", "pe", "un", "o", "una", "este", "sunt", "am", "al", "ale", "ai",
  "lui", "mea", "meu", "mele", "mei", "pierdut", "pierduta", "gasit", "gasita", "langa", "obiect",
]);

const buildLookup = (groups: Record<string, string[]>): Map<string, string> => {
  const lookup = new Map<string, string>();
  for (const [canonical, words] of Object.entries(groups)) {
    for (const word of words) {
      lookup.set(word, canonical);
    }
  }
  return lookup;
};

const OBJECT_LOOKUP = buildLookup(OBJECT_SYNONYMS);
const COLOR_LOOKUP = buildLookup(COLOR_SYNONYMS);
const BRAND_SET = new Set(KNOWN_BRANDS);

export const normalizeTokens = (...values: Array<string | null | undefined | string[]>): string[] => {
  const text = values
    .flat()
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ray-ban/g, "rayban")
    .replace(/north face/g, "northface");

  return text
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
};

const toId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const candidate = (value as { _id?: unknown; id?: unknown })._id ?? (value as { id?: unknown }).id;
    if (candidate && candidate !== value) return toId(candidate);
    if (typeof (value as { toString?: () => string }).toString === "function") {
      const asString = String(value);
      return asString === "[object Object]" ? null : asString;
    }
  }
  return null;
};

export const getPostId = (post: MatchablePost): string | null => toId(post._id ?? post.id);
export const getOwnerId = (post: MatchablePost): string | null => toId(post.userId);

const objectTermsOf = (post: MatchablePost): Set<string> => {
  const ai = post.aiAnalysis;
  const toTerms = (...values: Array<string | null | undefined>) =>
    new Set(
      normalizeTokens(...values)
        .map((token) => OBJECT_LOOKUP.get(token))
        .filter((term): term is string => Boolean(term)),
    );

  // Most specific source first: AI object type, then the title, and only then the
  // category (e.g. "Bags" would otherwise make every backpack equal to every handbag).
  const sources = [
    () => toTerms(ai?.objectType),
    () => toTerms(ai?.suggestedTitle, post.title),
    () => toTerms(post.category),
  ];
  for (const source of sources) {
    const terms = source();
    if (terms.size > 0) return terms;
  }
  return new Set();
};

const colorInfoOf = (post: MatchablePost): { primary: string | null; all: Set<string> } => {
  const ai = post.aiAnalysis;
  const toColors = (tokens: string[]) =>
    tokens.map((token) => COLOR_LOOKUP.get(token)).filter((color): color is string => Boolean(color));

  const aiPrimary = toColors(normalizeTokens(ai?.primaryColor))[0] ?? null;
  const aiSecondary = toColors(normalizeTokens(ai?.secondaryColors ?? []));
  const textColors = toColors(normalizeTokens(post.title, post.description));

  return {
    primary: aiPrimary ?? textColors[0] ?? null,
    all: new Set([...(aiPrimary ? [aiPrimary] : []), ...aiSecondary, ...textColors]),
  };
};

const brandOf = (post: MatchablePost): string | null => {
  const aiBrand = normalizeTokens(post.aiAnalysis?.brand).join("");
  if (aiBrand) return aiBrand;

  for (const token of normalizeTokens(post.title, post.description)) {
    if (BRAND_SET.has(token)) return token;
    if (BRAND_HINTS[token]) return BRAND_HINTS[token];
  }
  return null;
};

const detailTokensOf = (post: MatchablePost): Set<string> => {
  const ai = post.aiAnalysis;
  const tokens = normalizeTokens(
    post.title,
    post.description,
    ai?.material,
    ai?.distinguishingFeatures ?? [],
    ai?.visibleText ?? [],
  );
  // Object and color words are scored by their own signals.
  return new Set(tokens.filter((token) => !OBJECT_LOOKUP.has(token) && !COLOR_LOOKUP.has(token)));
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const hasCoordinates = (post: MatchablePost): boolean =>
  typeof post.latitude === "number" &&
  typeof post.longitude === "number" &&
  Number.isFinite(post.latitude) &&
  Number.isFinite(post.longitude);

const parseTime = (value: Date | string | null | undefined): number | null => {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? time : null;
};

const formatDistance = (km: number): string => (km < 1 ? `${Math.round(km * 1000)} m apart` : `${km.toFixed(1)} km apart`);

const scoreObject = (a: MatchablePost, b: MatchablePost): MatchSignal | null => {
  const termsA = objectTermsOf(a);
  const termsB = objectTermsOf(b);
  if (termsA.size === 0 || termsB.size === 0) return null;

  const shared = [...termsA].find((term) => termsB.has(term));
  if (shared) {
    return { key: "object", weight: SIGNAL_WEIGHTS.object, score: 1, reason: `Same type of item: ${shared}` };
  }

  let best = 0;
  let bestPair: [string, string] | null = null;
  for (const [first, second, value] of RELATED_OBJECTS) {
    const related =
      (termsA.has(first) && termsB.has(second)) || (termsA.has(second) && termsB.has(first));
    if (related && value > best) {
      best = value;
      bestPair = [first, second];
    }
  }

  return {
    key: "object",
    weight: SIGNAL_WEIGHTS.object,
    score: best,
    reason: bestPair ? `Similar type of item: ${bestPair[0]} / ${bestPair[1]}` : undefined,
  };
};

const scoreColor = (a: MatchablePost, b: MatchablePost): MatchSignal | null => {
  const colorsA = colorInfoOf(a);
  const colorsB = colorInfoOf(b);
  if (colorsA.all.size === 0 || colorsB.all.size === 0) return null;

  if (colorsA.primary && colorsA.primary === colorsB.primary) {
    return { key: "color", weight: SIGNAL_WEIGHTS.color, score: 1, reason: `Same color: ${colorsA.primary}` };
  }

  const shared = [...colorsA.all].filter((color) => colorsB.all.has(color));
  if (shared.length > 0) {
    return { key: "color", weight: SIGNAL_WEIGHTS.color, score: 0.6, reason: `Shared color: ${shared.join(", ")}` };
  }

  return { key: "color", weight: SIGNAL_WEIGHTS.color, score: 0 };
};

const scoreBrand = (a: MatchablePost, b: MatchablePost): MatchSignal | null => {
  const brandA = brandOf(a);
  const brandB = brandOf(b);

  if (brandA && brandB) {
    return brandA === brandB
      ? { key: "brand", weight: SIGNAL_WEIGHTS.brand, score: 1, reason: `Same brand: ${brandA}` }
      : { key: "brand", weight: SIGNAL_WEIGHTS.brand, score: 0 };
  }

  // Only one side knows the brand: count it if the other post mentions it anywhere.
  const known = brandA ?? brandB;
  const other = brandA ? b : a;
  if (known && detailTokensOf(other).has(known)) {
    return { key: "brand", weight: SIGNAL_WEIGHTS.brand, score: 1, reason: `Same brand: ${known}` };
  }

  return null;
};

const scoreDetails = (a: MatchablePost, b: MatchablePost): MatchSignal | null => {
  const tokensA = detailTokensOf(a);
  const tokensB = detailTokensOf(b);
  if (tokensA.size === 0 || tokensB.size === 0) return null;

  const shared = [...tokensA].filter((token) => tokensB.has(token) && !BRAND_SET.has(token));
  const dice = (2 * shared.length) / (tokensA.size + tokensB.size);
  const score = Math.min(1, dice * 2);

  return {
    key: "details",
    weight: SIGNAL_WEIGHTS.details,
    score,
    reason: shared.length > 0 ? `Shared details: ${shared.slice(0, 4).join(", ")}` : undefined,
  };
};

const scoreLocation = (a: MatchablePost, b: MatchablePost): MatchSignal | null => {
  if (hasCoordinates(a) && hasCoordinates(b)) {
    const km = haversineKm(a.latitude as number, a.longitude as number, b.latitude as number, b.longitude as number);
    const score = km <= 0.5 ? 1 : km <= 2 ? 0.85 : km <= 5 ? 0.65 : km <= 15 ? 0.4 : km <= 30 ? 0.2 : 0;
    return { key: "location", weight: SIGNAL_WEIGHTS.location, score, reason: score > 0 ? formatDistance(km) : undefined };
  }

  const tokensA = new Set(normalizeTokens(a.location));
  const shared = normalizeTokens(b.location).filter((token) => tokensA.has(token));
  if (shared.length > 0) {
    return { key: "location", weight: SIGNAL_WEIGHTS.location, score: 0.7, reason: `Similar location: ${shared.join(" ")}` };
  }

  return null;
};

const scoreTime = (a: MatchablePost, b: MatchablePost): MatchSignal | null => {
  // Prefer the event date typed by the user; fall back to when the post was created.
  let timeA = parseTime(a.date);
  let timeB = parseTime(b.date);
  if (timeA === null || timeB === null) {
    timeA = parseTime(a.createdAt);
    timeB = parseTime(b.createdAt);
  }
  if (timeA === null || timeB === null) return null;

  const days = Math.abs(timeA - timeB) / 86_400_000;
  const score = days <= 2 ? 1 : days <= 7 ? 0.8 : days <= 14 ? 0.6 : days <= 30 ? 0.35 : days <= 90 ? 0.1 : 0;
  const rounded = Math.round(days);
  const reason =
    score > 0 ? (rounded === 0 ? "Reported the same day" : `Reported ${rounded} day${rounded === 1 ? "" : "s"} apart`) : undefined;

  return { key: "time", weight: SIGNAL_WEIGHTS.time, score, reason };
};

/** Similarity between two posts (order does not matter). */
export const scorePostMatch = (a: MatchablePost, b: MatchablePost): MatchResult => {
  const signals = [scoreObject, scoreColor, scoreBrand, scoreDetails, scoreLocation, scoreTime]
    .map((scorer) => scorer(a, b))
    .filter((signal): signal is MatchSignal => signal !== null);

  const knownWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  // Place and time only support a match; something about the object itself must agree.
  const hasItemEvidence = signals.some((signal) => ITEM_SIGNALS.has(signal.key) && signal.score > 0);
  if (knownWeight === 0 || !hasItemEvidence) {
    return { score: 0, reasons: [], signals };
  }

  const weighted = signals.reduce((sum, signal) => sum + signal.weight * signal.score, 0) / knownWeight;
  // Less known information => less certainty.
  let score = weighted * (0.5 + 0.5 * knownWeight);

  const object = signals.find((signal) => signal.key === "object");
  if (object && object.score === 0) score *= OBJECT_MISMATCH_FACTOR;

  const brand = signals.find((signal) => signal.key === "brand");
  if (brand && brand.score === 0) score *= BRAND_MISMATCH_FACTOR;

  const reasons = signals
    .filter((signal) => signal.reason && signal.score >= 0.5)
    .sort((first, second) => second.weight * second.score - first.weight * first.score)
    .map((signal) => signal.reason as string);

  return { score: Math.round(score * 100) / 100, reasons, signals };
};

export interface RankedMatch<T extends MatchablePost> extends MatchResult {
  post: T;
}

/**
 * Ranks candidate posts against `post`. Only opposite-status posts from other users
 * with a score of at least `minScore` are returned, best first.
 */
export const rankMatches = <T extends MatchablePost>(
  post: MatchablePost,
  candidates: T[],
  { limit = 5, minScore = MIN_MATCH_SCORE }: { limit?: number; minScore?: number } = {},
): RankedMatch<T>[] => {
  const postId = getPostId(post);
  const ownerId = getOwnerId(post);

  return candidates
    .filter((candidate) => candidate.status !== post.status)
    .filter((candidate) => getPostId(candidate) !== postId)
    .filter((candidate) => !ownerId || getOwnerId(candidate) !== ownerId)
    .map((candidate) => ({ post: candidate, ...scorePostMatch(post, candidate) }))
    .filter((match) => match.score >= minScore)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);
};
