import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function parseVoiceTranscript(transcript: string, context: "sales" | "leads") {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // 1. Define specific instructions based on the page the user is on
  const prompt = context === "sales" 
    ? `
      Extract sale details from this text: "${transcript}"
      Return ONLY a JSON object with:
      {
        "customer_name": string,
        "customer_phone": string,
        "item_name": string,
        "total_amount": number,
        "amount_paid": number,
        "notes": string
      }
      If a value is missing, use null.
      `
    : `
      Extract lead/prospect details from this text: "${transcript}"
      Return ONLY a JSON object with:
      {
        "full_name": string,
        "phone": string,
        "item_of_interest": string,
        "amount": number,
        "notes": string
      }
      If a value is missing, use null.
      `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the JSON response (Gemini sometimes adds ```json blocks)
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return null;
  }
}