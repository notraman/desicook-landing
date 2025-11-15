# Gemini API Test Project

Complete working setup for calling Google Gemini API using the official SDK.

## Installation

```bash
npm install
```

Or install dependencies manually:

```bash
npm install @google/generative-ai dotenv
```

## Setup

1. **Create `.env` file** (already created with your API key):
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

2. **Get your API key** from [Google AI Studio](https://aistudio.google.com/apikey) (free tier available)

## Running

```bash
node index.js
```

Or use npm:

```bash
npm start
```

## Project Structure

```
gemini-test/
├── .env              # API key (DO NOT COMMIT)
├── .env.example      # Example file (safe to commit)
├── package.json      # Dependencies
├── index.js          # Main test script
└── README.md         # This file
```

## Security Rules

⚠️ **IMPORTANT**: Never commit `.env` to git!

The `.env` file is already in `.gitignore` at the project root. It contains your API key and must remain private.

- ✅ Safe to commit: `.env.example`
- ❌ Never commit: `.env`

## Troubleshooting

### If `.env` is not being read:

1. **Check file location**: Ensure `.env` is in the same directory as `index.js`
2. **Check file name**: Must be exactly `.env` (not `.env.txt` or `env`)
3. **Check format**: Must be `GEMINI_API_KEY=your_key` (no spaces around `=`)
4. **Run from correct directory**: Make sure you're in the `gemini-test` directory
5. **In Cursor**: If Cursor cannot read `.env`, manually create it in the `gemini-test` folder with:
   ```
   GEMINI_API_KEY=your_actual_api_key
   ```

### If you get API errors:

- **429 Too Many Requests / Quota Exceeded**: 
  - Free tier has rate limits (requests per minute)
  - Wait a minute and try again
  - Check your usage at: https://ai.dev/usage?tab=rate-limit
  - The code will automatically retry with fallback model if primary fails
  
- **API_KEY_INVALID / 401**: 
  - Check your API key in Google AI Studio
  - Ensure the key is correct in the `.env` file
  - Get a new key at: https://aistudio.google.com/apikey
  
- **404 Error / Model not found**: 
  - The model name might be incorrect
  - The code automatically tries fallback models:
    - `gemini-2.0-flash-exp` (latest - tried first)
    - `gemini-1.5-flash` (stable fallback)
    - `gemini-1.5-pro` (alternative)

## Model Information

- **Primary model**: `gemini-2.0-flash-exp` (latest experimental)
- **Fallback model**: `gemini-1.5-flash` (stable, automatically used if primary fails)
- **Free tier**: Yes, available on Google AI Studio
- **Rate limits**: Check [Google AI Studio](https://aistudio.google.com/) for current limits

### Available Models

- `gemini-2.0-flash-exp` - Latest experimental model (fast)
- `gemini-1.5-flash` - Stable, fast model (recommended for production)
- `gemini-1.5-pro` - More powerful, slower model

## SDK Documentation

Official SDK: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)

