import type { AnalyzeItemImageRequest, ItemAiAnalysis } from "../types/itemAnalysis";
export interface AnalyzeItemImageResult {
    analysis: ItemAiAnalysis;
    available: boolean;
    provider: string;
    model: string;
    message?: string;
}
export type AIProvider = "gemini" | "openai-compatible";
declare const resolveProvider: (value?: string | null) => AIProvider;
declare const getDefaultModel: (provider: AIProvider) => string;
declare const parseDataUri: (uri: string) => {
    mimeType: string;
    base64: string;
} | null;
declare const extractJsonObject: (text: string) => string | null;
declare const buildFallbackAnalysis: (request?: Partial<AnalyzeItemImageRequest>, message?: string) => ItemAiAnalysis;
declare const buildPrompt: (request?: Partial<AnalyzeItemImageRequest>) => string;
declare const normalizeAnalysis: (rawValue: unknown, request?: Partial<AnalyzeItemImageRequest>, provider?: AIProvider, model?: string) => ItemAiAnalysis;
declare const extractGeminiContent: (response: any) => string;
export declare const analyzeItemImage: (imageUri: string, request?: Partial<AnalyzeItemImageRequest>) => Promise<AnalyzeItemImageResult>;
export { buildPrompt, buildFallbackAnalysis, extractJsonObject, normalizeAnalysis, parseDataUri, resolveProvider, getDefaultModel, extractGeminiContent, };
//# sourceMappingURL=itemAnalysis.d.ts.map