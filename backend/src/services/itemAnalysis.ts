import https from "https";

import type {
  AnalyzeItemImageRequest,
  ItemAiAnalysis,
} from "../types/itemAnalysis";

export interface AnalyzeItemImageResult {
  analysis: ItemAiAnalysis;
  available: boolean;
  provider: string;
  model: string;
  message?: string;
}

export type AIProvider = "gemini" | "openai-compatible";

const DEFAULT_PROVIDER: AIProvider = "gemini";
const DEFAULT_GEMINI_MODEL = "models/gemini-3.5-flash-lite";
// Used only when AI_MODEL_FALLBACKS is not set in .env.
const DEFAULT_GEMINI_FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const GEMINI_ENDPOINT_PREFIX = "https://generativelanguage.googleapis.com/v1beta/models/";
const GEMINI_RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 504]);
// 404 = model retired / not available for this key: skip straight to the next model.
const GEMINI_SKIP_MODEL_STATUS_CODES = new Set([404]);
const GEMINI_MAX_ATTEMPTS_PER_MODEL = 2;
const GEMINI_RETRY_BASE_DELAY_MS = 500;
const AI_REQUEST_TIMEOUT_MS = 25000;
// Upper bound for the whole analysis so the app never waits for minutes.
const GEMINI_TOTAL_BUDGET_MS = 60000;
const GEMINI_MAX_OUTPUT_TOKENS = 1024;

const GEMINI_ANALYSIS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    objectType: { type: "STRING" },
    brand: { type: "STRING", nullable: true },
    primaryColor: { type: "STRING", nullable: true },
    secondaryColors: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    material: { type: "STRING", nullable: true },
    distinguishingFeatures: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    visibleText: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    shortDescription: { type: "STRING" },
    suggestedTitle: { type: "STRING" },
    suggestedCategory: { type: "STRING" },
    confidence: { type: "NUMBER" },
  },
  required: [
    "objectType",
    "brand",
    "primaryColor",
    "secondaryColors",
    "material",
    "distinguishingFeatures",
    "visibleText",
    "shortDescription",
    "suggestedTitle",
    "suggestedCategory",
    "confidence",
  ],
} as const;

class AIRequestError extends Error {
  statusCode?: number;
  responseBody?: string;

  constructor(message: string, statusCode?: number, responseBody?: string) {
    super(message);
    this.name = "AIRequestError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeText(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  const text = normalizeText(value);
  return text ? [text] : [];
};

const normalizeConfidence = (value: unknown): number => {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(1, numericValue));
};

const resolveProvider = (value?: string | null): AIProvider => {
  const normalized = normalizeText(value)?.toLowerCase();

  if (normalized === "openai" || normalized === "openai-compatible") {
    return "openai-compatible";
  }

  return "gemini";
};

const getDefaultModel = (provider: AIProvider): string =>
  provider === "gemini" ? DEFAULT_GEMINI_MODEL : DEFAULT_OPENAI_MODEL;

const normalizeGeminiModelId = (value?: string | null): string => {
  const normalized = normalizeText(value);

  if (!normalized) {
    return DEFAULT_GEMINI_MODEL.replace(/^models\//i, "");
  }

  return normalized
    .replace(/^models\//i, "")
    .replace(/^models%2F/i, "")
    .replace(/\s+/g, "-");
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const parseFallbackModels = (value?: string | null): string[] => {
  const raw = normalizeText(value);

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => normalizeGeminiModelId(entry))
    .filter((entry) => Boolean(entry));
};

const uniqueModels = (models: string[]): string[] => {
  return Array.from(new Set(models.filter(Boolean)));
};

const isRetryableGeminiError = (error: unknown): boolean => {
  if (error instanceof AIRequestError) {
    if (error.statusCode && GEMINI_RETRYABLE_STATUS_CODES.has(error.statusCode)) {
      return true;
    }

    return /timed out|timeout|not found for api version|not supported for generatecontent|temporarily unavailable|rate limit|too many requests|service unavailable|gateway timeout/i.test(
      error.message,
    );
  }

  if (error instanceof Error) {
    return /high demand|timed out|timeout|not found for api version|not supported for generatecontent|temporarily unavailable|rate limit|too many requests|service unavailable|gateway timeout/i.test(
      error.message,
    );
  }

  return false;
};

const isInvalidGeminiJsonError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return /valid JSON object|unexpected token|unterminated|JSON/i.test(error.message);
};

const buildGeminiModelCandidates = (preferredModel: string, fallbackModels?: string | null): string[] => {
  const configuredFallbacks = parseFallbackModels(fallbackModels);
  const fallbacks = configuredFallbacks.length > 0 ? configuredFallbacks : DEFAULT_GEMINI_FALLBACK_MODELS;
  const candidates = [preferredModel, ...fallbacks];
  return uniqueModels(candidates.map((model) => normalizeGeminiModelId(model)));
};

const extractProviderErrorMessage = (error: unknown): string => {
  if (error instanceof AIRequestError && error.responseBody) {
    try {
      const parsed = JSON.parse(error.responseBody);
      const message = normalizeText(parsed?.error?.message);
      if (message) {
        return message;
      }
    } catch {
      // Not JSON - fall through to the generic message.
    }
  }

  return error instanceof Error ? error.message : String(error);
};

const parseDataUri = (uri: string): { mimeType: string; base64: string } | null => {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(uri.trim());

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
};

const extractJsonObject = (text: string): string | null => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const start = cleaned.indexOf("{");
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const character = cleaned[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === "{") {
      depth += 1;
    }

    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return cleaned.slice(start, index + 1);
      }
    }
  }

  return null;
};

const buildFallbackAnalysis = (
  request?: Partial<AnalyzeItemImageRequest>,
  message = "AI provider is not configured. Set AI_API_KEY to enable real image analysis.",
): ItemAiAnalysis => ({
  objectType: normalizeText(request?.category) ?? "item",
  brand: null,
  primaryColor: null,
  secondaryColors: [],
  material: null,
  distinguishingFeatures: [],
  visibleText: [],
  shortDescription: message,
  suggestedTitle: normalizeText(request?.title) ?? "Detected item",
  suggestedCategory: normalizeText(request?.category) ?? "General",
  confidence: 0,
  provider: "fallback",
  model: "local-fallback",
  analyzedAt: new Date().toISOString(),
});

const buildPrompt = (request?: Partial<AnalyzeItemImageRequest>): string => {
  const contextLines = [
    request?.title ? `Current title draft: ${request.title}` : null,
    request?.category ? `Current category draft: ${request.category}` : null,
    request?.status ? `Item status: ${request.status}` : null,
    request?.location ? `Location context: ${request.location}` : null,
    request?.description ? `User description draft: ${request.description}` : null,
  ].filter(Boolean);

  return [
    "Analyze the image for a lost-and-found application.",
    "Identify the most likely object type, brand, primary color, secondary colors, material, visible text or logos, and distinguishing features.",
    "Write a short, user-friendly description suitable for a post.",
    "Suggest a concise title and category.",
    "Return ONLY a valid JSON object with the following keys:",
    "objectType, brand, primaryColor, secondaryColors, material, distinguishingFeatures, visibleText, shortDescription, suggestedTitle, suggestedCategory, confidence",
    "Use null for unknown scalar values and an empty array for unknown list values.",
    "confidence must be a number from 0 to 1.",
    contextLines.length > 0 ? `Additional context:\n${contextLines.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};

const normalizeAnalysis = (
  rawValue: unknown,
  request?: Partial<AnalyzeItemImageRequest>,
  provider: AIProvider = DEFAULT_PROVIDER,
  model = normalizeGeminiModelId(DEFAULT_GEMINI_MODEL),
): ItemAiAnalysis => {
  const rawObject =
    typeof rawValue === "string"
      ? (() => {
          const jsonString = extractJsonObject(rawValue);
          if (!jsonString) {
            throw new Error("The AI response did not contain a valid JSON object.");
          }

          return JSON.parse(jsonString) as Record<string, unknown>;
        })()
      : (rawValue as Record<string, unknown>);

  const objectType = normalizeText(rawObject.objectType) ?? normalizeText(request?.category) ?? "item";
  const brand = normalizeText(rawObject.brand);
  const primaryColor = normalizeText(rawObject.primaryColor);
  const secondaryColors = normalizeStringArray(rawObject.secondaryColors);
  const material = normalizeText(rawObject.material);
  const distinguishingFeatures = normalizeStringArray(rawObject.distinguishingFeatures);
  const visibleText = normalizeStringArray(rawObject.visibleText);
  const shortDescription =
    normalizeText(rawObject.shortDescription) ??
    `Likely ${objectType}${brand ? ` by ${brand}` : ""}.`;
  const suggestedTitle =
    normalizeText(rawObject.suggestedTitle) ??
    ([primaryColor, brand, objectType].filter(Boolean).join(" ") || `Detected ${objectType}`);
  const suggestedCategory =
    normalizeText(rawObject.suggestedCategory) ?? normalizeText(request?.category) ?? "General";

  return {
    objectType,
    brand,
    primaryColor,
    secondaryColors,
    material,
    distinguishingFeatures,
    visibleText,
    shortDescription,
    suggestedTitle,
    suggestedCategory,
    confidence: normalizeConfidence(rawObject.confidence),
    provider,
    model,
    analyzedAt: new Date().toISOString(),
  };
};

const postJson = async <T>(
  endpoint: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs = AI_REQUEST_TIMEOUT_MS,
): Promise<T> => {
  const url = new URL(endpoint);
  const payload = JSON.stringify(body);

  return new Promise<T>((resolve, reject) => {
    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "POST",
        timeout: timeoutMs,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          ...headers,
        },
      },
      (response) => {
        let responseBody = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new AIRequestError(
                `AI request failed with status ${response.statusCode || "unknown"}: ${responseBody}`,
                response.statusCode,
                responseBody,
              ),
            );
            return;
          }

          try {
            resolve(JSON.parse(responseBody) as T);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new AIRequestError(`AI request timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
    });

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
};

const extractAssistantContent = (response: any): string => {
  const content = response?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => (typeof entry?.text === "string" ? entry.text : ""))
      .join("")
      .trim();
  }

  throw new Error("The AI response did not include assistant content.");
};

const extractGeminiContent = (response: any): string => {
  const parts = response?.candidates?.[0]?.content?.parts;

  if (Array.isArray(parts)) {
    const text = parts
      .map((part) => {
        if (typeof part?.text === "string") {
          return part.text;
        }

        if (typeof part?.inlineData?.data === "string") {
          return part.inlineData.data;
        }

        return "";
      })
      .join("")
      .trim();

    if (text) {
      return text;
    }
  }

  if (typeof response?.text === "string") {
    return response.text;
  }

  throw new Error("The Gemini response did not include generated content.");
};

const analyzeWithOpenAICompatible = async (
  imageUri: string,
  request: Partial<AnalyzeItemImageRequest> | undefined,
  apiKey: string,
  endpoint: string,
  model: string,
): Promise<AnalyzeItemImageResult> => {
  const response = await postJson<any>(
    endpoint,
    {
      Authorization: `Bearer ${apiKey}`,
    },
    {
      model,
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an assistant for a lost-and-found app. Return concise but useful object metadata as JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildPrompt(request),
            },
            {
              type: "image_url",
              image_url: {
                url: imageUri,
              },
            },
          ],
        },
      ],
    },
  );

  const assistantContent = extractAssistantContent(response);
  const analysis = normalizeAnalysis(assistantContent, request, "openai-compatible", model);

  return {
    analysis,
    available: true,
    provider: "openai-compatible",
    model,
  };
};

const analyzeWithGemini = async (
  imageUri: string,
  request: Partial<AnalyzeItemImageRequest> | undefined,
  apiKey: string,
  model: string,
): Promise<AnalyzeItemImageResult> => {
  const imageData = parseDataUri(imageUri);

  if (!imageData) {
    throw new Error("Gemini requires the image to be sent as a data URI from the app.");
  }

  const candidateModels = buildGeminiModelCandidates(model, process.env.AI_MODEL_FALLBACKS);
  const deadline = Date.now() + GEMINI_TOTAL_BUDGET_MS;
  let lastError: unknown = null;
  let lastErrorModel: string | null = null;

  modelLoop: for (const candidateModel of candidateModels) {
    const endpoint = `${GEMINI_ENDPOINT_PREFIX}${encodeURIComponent(candidateModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      const remainingMs = deadline - Date.now();
      if (remainingMs < 3000) {
        break modelLoop;
      }

      try {
        const response = await postJson<any>(endpoint, {}, {
          systemInstruction: {
            parts: [
              {
                text: "You are an assistant for a lost-and-found app. Return concise but useful object metadata as JSON only.",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: buildPrompt(request),
                },
                {
                  inlineData: {
                    mimeType: imageData.mimeType,
                    data: imageData.base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
            responseMimeType: "application/json",
            responseSchema: GEMINI_ANALYSIS_RESPONSE_SCHEMA,
          },
        }, Math.min(AI_REQUEST_TIMEOUT_MS, remainingMs));

        const geminiContent = extractGeminiContent(response);
        const analysis = normalizeAnalysis(geminiContent, request, "gemini", candidateModel);

        return {
          analysis,
          available: true,
          provider: "gemini",
          model: candidateModel,
        };
      } catch (error) {
        lastError = error;
        lastErrorModel = candidateModel;
        console.warn(
          `[AI] Gemini model ${candidateModel} attempt ${attempt} failed: ${extractProviderErrorMessage(error).slice(0, 200)}`,
        );

        const isModelUnavailable =
          error instanceof AIRequestError && error.statusCode && GEMINI_SKIP_MODEL_STATUS_CODES.has(error.statusCode);
        const isTimeout = error instanceof Error && /timed out/i.test(error.message);

        // A retired model or a model that hangs will not recover on retry: move on.
        if (isModelUnavailable || isTimeout) {
          continue modelLoop;
        }

        if (!isRetryableGeminiError(error) && !isInvalidGeminiJsonError(error)) {
          throw new Error(`AI analysis failed: ${extractProviderErrorMessage(error)}`);
        }

        if (attempt < GEMINI_MAX_ATTEMPTS_PER_MODEL) {
          await sleep(GEMINI_RETRY_BASE_DELAY_MS * attempt);
        }
      }
    }
  }

  const lastErrorStatus = lastError instanceof AIRequestError ? lastError.statusCode : undefined;
  const lastErrorDetail = lastError ? extractProviderErrorMessage(lastError) : null;
  let fallbackMessage: string;

  if (lastErrorStatus && GEMINI_SKIP_MODEL_STATUS_CODES.has(lastErrorStatus)) {
    fallbackMessage =
      "None of the configured Gemini models are available for this API key. Update AI_MODEL / AI_MODEL_FALLBACKS in backend/.env.";
  } else if (isInvalidGeminiJsonError(lastError)) {
    fallbackMessage = "The AI returned an unreadable answer. Please try again.";
  } else {
    fallbackMessage = "The AI service is busy right now. Please try again in a moment.";
  }

  console.warn(
    `[AI] All Gemini models failed (${candidateModels.join(", ")}). Last error from ${lastErrorModel}: ${lastErrorDetail}`,
  );

  return {
    analysis: buildFallbackAnalysis(request, fallbackMessage),
    available: false,
    provider: "gemini",
    model: candidateModels[0] || model,
    message: fallbackMessage,
  };
};

export const analyzeItemImage = async (
  imageUri: string,
  request?: Partial<AnalyzeItemImageRequest>,
): Promise<AnalyzeItemImageResult> => {
  if (!imageUri) {
    throw new Error("An image is required for AI analysis.");
  }

  const apiKey = process.env.AI_API_KEY?.trim();
  const provider = resolveProvider(process.env.AI_PROVIDER);
  const model = provider === "gemini"
    ? normalizeGeminiModelId(process.env.AI_MODEL?.trim() || getDefaultModel(provider))
    : process.env.AI_MODEL?.trim() || getDefaultModel(provider);
  const endpoint = process.env.AI_BASE_URL?.trim();

  if (!apiKey) {
    return {
      analysis: buildFallbackAnalysis(request),
      available: false,
      provider: "fallback",
      model: "local-fallback",
      message: "AI provider is not configured. Set AI_API_KEY to enable real image analysis.",
    };
  }

  if (provider === "gemini") {
    return analyzeWithGemini(imageUri, request, apiKey, model);
  }

  const resolvedEndpoint = endpoint || "https://api.openai.com/v1/chat/completions";

  return analyzeWithOpenAICompatible(imageUri, request, apiKey, resolvedEndpoint, model);
};

export {
  buildPrompt,
  buildFallbackAnalysis,
  extractJsonObject,
  normalizeAnalysis,
  parseDataUri,
  resolveProvider,
  getDefaultModel,
  extractGeminiContent,
};