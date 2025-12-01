import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Note: API Key must be provided via process.env.API_KEY
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const checkShellScript = async (script: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const model = "gemini-3-pro-preview"; // Good balance of speed and reasoning for code
    
    const prompt = `
      Analyze the following Shell/Bash script for syntax errors, potential bugs, and best practice violations.
      Be concise. If the script is safe and correct, say so.
      
      Script:
      \`\`\`bash
      ${script}
      \`\`\`
      
      Output format: Markdown. Response MUST be in Chinese (Simplifed).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No analysis returned.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing script. Please check your API key and connection.";
  }
};

export const explainRegex = async (regex: string, text: string): Promise<string> => {
   try {
    const ai = getAiClient();
    const model = "gemini-3-pro-preview";
    
    const prompt = `
      Explain this Hyperscan/PCRE regular expression: \`${regex}\`.
      Test string provided: "${text}".
      Explain how it matches or why it fails.
      
      Output format: Response MUST be in Chinese (Simplifed).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No explanation returned.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating explanation.";
  }
}