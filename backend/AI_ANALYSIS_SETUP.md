# AI Image Analysis Setup

This backend now exposes `POST /api/posts/analyze-image`.

## What it does
- Receives the uploaded image as a data URI or public URL
- Sends it to a Gemini vision endpoint by default
- Returns structured metadata:
  - object type
  - brand
  - primary/secondary colors
  - material
  - visible text
  - distinguishing features
  - short description
  - suggested title/category

## Environment variables
Set these in your backend `.env` file:

```env
AI_API_KEY=your_api_key_here
AI_PROVIDER=gemini
AI_MODEL=models/gemini-3.8-flash
# Optional: try extra Gemini models if the main one is overloaded
# AI_MODEL_FALLBACKS=models/gemini-3.8-flash-lite,models/gemini-2.5-flash
```

### Optional: OpenAI-compatible mode
If you want to switch later, you can still use:

```env
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

## Notes
- If `AI_API_KEY` is missing, the endpoint returns a fallback response and the app will ask you to configure AI.
- Gemini expects the image as a `data:` URI from the app (the current picker flow already sends base64 data).
- The backend sends Gemini a strict JSON schema and retries automatically if the model returns malformed JSON.
- If Gemini returns 429/503/504 due high demand, the backend retries automatically and then falls back to any models listed in `AI_MODEL_FALLBACKS`.
- The add-post screen can use the returned analysis to autofill title, category, and description.





