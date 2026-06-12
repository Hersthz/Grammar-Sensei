# Grammar Sensei Cloud AI Contract

This contract is for a publish-safe backend proxy. The Chrome extension must not store provider API keys or call OpenAI/Gemini/Claude directly.

## Endpoint

Recommended production endpoint:

```txt
POST https://api.example.com/v1/grammar/analyze
```

The extension accepts HTTPS endpoints. HTTP is allowed only for localhost backend development.

## Request

Headers:

```txt
Content-Type: application/json
Accept: application/json
X-Grammar-Sensei-Schema: grammar-sensei-cloud-ai-v1
```

Future account-enabled builds may add:

```txt
Authorization: Bearer <user-session-token>
```

This must be a user/session token issued by your backend, not an AI provider API key.

Body:

```json
{
  "schemaVersion": "grammar-sensei-cloud-ai-v1",
  "requestId": "1710000000000-abcd",
  "app": "grammar-sensei",
  "extensionVersion": "1.0.0",
  "uiLanguage": "vi",
  "strictMode": true,
  "source": "sidepanel",
  "detectedLanguage": "ja",
  "sentence": "日本に行ったことがあります。",
  "localResult": {
    "normalized_input": "日本に行ったことがあります。",
    "detectedLanguage": "ja",
    "source": "selection",
    "primary": {
      "id": "ta-koto-ga-aru",
      "display": "たことがある",
      "matchedText": "行ったことがあります",
      "meaning_vi": "đã từng làm gì",
      "jlpt_level": "N4",
      "confidence": 92
    },
    "matches": [],
    "suggestions": [],
    "romaji": "",
    "romajiQuality": "basic-kana-only",
    "warnings": []
  },
  "grammarDbVersion": "2026.06.phase1.50.phase4",
  "allowedGrammarIds": ["ta-koto-ga-aru"],
  "grammarCandidates": [
    {
      "id": "ta-koto-ga-aru",
      "pattern": "〜たことがある",
      "display": "たことがある",
      "jlpt_level": "N4",
      "meaning_vi": "đã từng làm gì",
      "meaning_en": "have experienced doing something",
      "structure": "Vた + ことがある",
      "tags": ["experience"],
      "confusions": ["ことができる"]
    }
  ],
  "responseSchema": {},
  "privacy": {
    "sendsOnlyCurrentSentence": true,
    "excludesPageUrl": true,
    "excludesPageTitle": true,
    "excludesFullPageText": true
  }
}
```

The extension intentionally does not send page URL, page title, full page text, cookies, or provider API keys.

## Response

Return direct JSON or `{ "success": true, "data": ... }`.

```json
{
  "detectedLanguage": "ja",
  "originalSentence": "日本に行ったことがあります。",
  "japaneseEquivalent": "",
  "matches": [
    {
      "grammarId": "ta-koto-ga-aru",
      "pattern": "〜たことがある",
      "matchedText": "行ったことがあります",
      "jlptLevel": "N4",
      "meaningVi": "đã từng làm gì",
      "meaningEn": "have experienced doing something",
      "structure": "Vた + ことがある",
      "explanationVi": "Dùng để nói về trải nghiệm đã từng làm gì trong quá khứ.",
      "confidence": 0.92,
      "whyMatched": "Câu có động từ thể た trước ことがあります.",
      "possibleConfusions": ["〜ことができる"]
    }
  ],
  "warning": ""
}
```

## Error Response

Use JSON errors:

```json
{
  "error": {
    "code": "quota_exceeded",
    "message": "AI quota exceeded for this account."
  }
}
```

Suggested codes:

- `invalid_request`
- `unauthorized`
- `quota_exceeded`
- `rate_limited`
- `provider_unavailable`
- `provider_timeout`
- `schema_validation_failed`

HTTP status guidance:

- `400`: invalid request
- `401`: missing or invalid user auth
- `402`: paid quota required
- `429`: rate limited
- `500`: backend failure
- `502`: provider failure
- `504`: provider timeout

## Backend Prompt Rules

The backend should instruct the AI provider:

- Return only valid JSON.
- Do not return Markdown.
- If `strictMode` is true, use only `grammarId` values from `allowedGrammarIds` or the backend's matching grammar database version.
- If unsure, return low confidence.
- For Vietnamese or English input, explain that the result is an equivalent Japanese grammar pattern, not a direct match.
- Prefer Vietnamese explanations for `uiLanguage: "vi"`.

## Privacy Rules

- Do not log raw sentence text longer than needed for debugging.
- Never store provider API keys in the extension.
- Do not require the extension to send page URL or full page text.
- Apply rate limits per user/account/IP.
- Keep provider selection and billing on the backend.
