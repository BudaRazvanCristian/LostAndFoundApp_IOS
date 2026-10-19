import * as assert from "assert";

import {
  buildFallbackAnalysis,
  extractJsonObject,
  extractGeminiContent,
  getDefaultModel,
  parseDataUri,
  normalizeAnalysis,
  resolveProvider,
} from "../src/services/itemAnalysis";

const sampleText = [
  "Here is the analysis:",
  "",
  "```json",
  "{",
  '  "objectType": "backpack",',
  '  "brand": "Nike",',
  '  "primaryColor": "black",',
  '  "secondaryColors": ["red", "white"],',
  '  "material": "nylon",',
  '  "distinguishingFeatures": ["front zipper pocket", "logo patch"],',
  '  "visibleText": ["NIKE"],',
  '  "shortDescription": "Black Nike backpack with red accents.",',
  '  "suggestedTitle": "Black Nike backpack",',
  '  "suggestedCategory": "Bags",',
  '  "confidence": 0.93',
  "}",
  "```",
].join("\n");

const extractedJson = extractJsonObject(sampleText);
assert.ok(extractedJson, "JSON should be extracted from fenced AI output");

assert.strictEqual(resolveProvider(undefined), "gemini");
assert.strictEqual(resolveProvider("gemini"), "gemini");
assert.strictEqual(resolveProvider("openai"), "openai-compatible");
assert.strictEqual(getDefaultModel("gemini"), "models/gemini-3.8-flash");
assert.strictEqual(getDefaultModel("openai-compatible"), "gpt-4o-mini");

const parsedImage = parseDataUri("data:image/png;base64,ZmFrZS1kYXRh");
assert.ok(parsedImage, "Data URI should be parsed for Gemini");
assert.strictEqual(parsedImage?.mimeType, "image/png");
assert.strictEqual(parsedImage?.base64, "ZmFrZS1kYXRh");

const geminiContent = extractGeminiContent({
  candidates: [
    {
      content: {
        parts: [{ text: '{"objectType":"wallet"}' }],
      },
    },
  ],
});
assert.strictEqual(geminiContent, '{"objectType":"wallet"}');

const normalized = normalizeAnalysis(
  extractedJson,
  { title: "", category: "", description: "" },
  "openai-compatible",
  "test-model",
);

assert.strictEqual(normalized.objectType, "backpack");
assert.strictEqual(normalized.brand, "Nike");
assert.strictEqual(normalized.primaryColor, "black");
assert.deepStrictEqual(normalized.secondaryColors, ["red", "white"]);
assert.deepStrictEqual(normalized.visibleText, ["NIKE"]);
assert.strictEqual(normalized.confidence, 0.93);
assert.strictEqual(normalized.provider, "openai-compatible");
assert.strictEqual(normalized.model, "test-model");

const fallback = buildFallbackAnalysis({ title: "Wallet", category: "Accessories" });
assert.strictEqual(fallback.suggestedTitle, "Wallet");
assert.strictEqual(fallback.suggestedCategory, "Accessories");
assert.strictEqual(fallback.provider, "fallback");
assert.strictEqual(fallback.confidence, 0);

console.log("AI analysis helpers passed.");







