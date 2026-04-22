import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function scanPaymentReceipt(imageAsBase64: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are a professional Nigerian financial auditor. Analyze this bank transfer receipt or SMS alert screenshot.
    
    1. EXTRACT: Amount (number only), Bank Name, Sender Name, and Transaction Date.
    2. DETECT FAKE ALERTS: Look for red flags common in Nigeria:
       - Inconsistent fonts (especially different sizes in the amount).
       - Suspicious SMS headers (e.g., sending from a regular phone number instead of a bank shortcode).
       - Missing transaction references or digital signatures.
       - Poor alignment of text.
    
    Return ONLY a JSON object with this structure:
    {
      "amount": number,
      "bankName": "string",
      "sender": "string",
      "date": "string",
      "isFakeProbability": number (0 to 100),
      "redFlags": ["string description of issues found"],
      "verdict": "REAL" | "SUSPICIOUS" | "LIKELY_FAKE"
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageAsBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text();
    // Clean the JSON string if Gemini adds markdown blocks
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw new Error("Could not read receipt");
  }
}