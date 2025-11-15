# Quick Setup Instructions

## Step 1: Install Dependencies

```bash
cd gemini-test
npm install
```

This installs:
- `@google/generative-ai` - Official Google Gemini SDK
- `dotenv` - For loading environment variables

## Step 2: Create `.env` File

Create a `.env` file in the `gemini-test` directory:

```bash
GEMINI_API_KEY=your_api_key_here
```

**Get your API key**: https://aistudio.google.com/apikey

## Step 3: Run the Test

```bash
node index.js
```

## Expected Output

```
✅ API Key Loaded
🚀 Running Gemini test...

📝 Prompt: "Say hello in 5 different styles"

🤖 Using model: models/gemini-2.0-flash-exp

✅ API Response:

[Response text here]

✨ Test completed successfully!
```

## Running in Cursor

1. Open the `gemini-test` folder in Cursor
2. Open terminal (Ctrl+`)
3. Run: `node index.js`

## If `.env` is Not Read in Cursor

1. Manually create `.env` file in `gemini-test` directory
2. Add: `GEMINI_API_KEY=your_key`
3. Save the file
4. Run `node index.js` again

## Security Note

⚠️ **Never commit `.env` to git!** 

The `.env` file is already in `.gitignore` at the project root. It contains your private API key.

