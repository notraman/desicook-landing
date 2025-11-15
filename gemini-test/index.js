import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Verify API key is loaded
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Error: GEMINI_API_KEY not found in .env file");
  console.error("Please create a .env file with: GEMINI_API_KEY=your_api_key_here");
  process.exit(1);
}

console.log("✅ API Key Loaded");
console.log("🚀 Running Gemini test...\n");

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(apiKey);

// Get the model instance
// Using gemini-2.0-flash-exp (latest experimental model)
// If this model is not available, the code will automatically fallback to gemini-1.5-flash
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Sample prompt
const prompt = "Say hello in 5 different styles";

async function run() {
  try {
    console.log(`📝 Prompt: "${prompt}"\n`);
    console.log(`🤖 Using model: ${model.model || 'gemini-2.0-flash-exp'}\n`);
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ API Response:\n");
    console.log(text);
    console.log("\n✨ Test completed successfully!");
  } catch (error) {
    console.error("❌ Error calling Gemini API:");
    console.error(error.message);
    
    // Try fallback model if 404
    if (error.message.includes("404") || error.message.includes("not found")) {
      console.log("\n🔄 Trying fallback model: gemini-1.5-flash...");
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("✅ API Response (using fallback model):\n");
        console.log(text);
        console.log("\n✨ Test completed successfully!");
        return;
      } catch (fallbackError) {
        console.error("❌ Fallback model also failed:", fallbackError.message);
      }
    }
    
    if (error.message.includes("API_KEY_INVALID") || error.message.includes("401")) {
      console.error("\n💡 Tip: Check that your API key is correct in the .env file");
      console.error("   Get your API key at: https://aistudio.google.com/apikey");
    } else if (error.message.includes("404")) {
      console.error("\n💡 Tip: The model name might be incorrect. Available models:");
      console.error("   - gemini-2.0-flash-exp (latest)");
      console.error("   - gemini-1.5-flash (stable)");
      console.error("   - gemini-1.5-pro (more powerful)");
    }
    
    process.exit(1);
  }
}

run();

