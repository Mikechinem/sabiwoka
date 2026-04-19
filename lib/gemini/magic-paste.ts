import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function parseLeadFromText(text: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Extract sales lead information from this text snippet.
    The text may be in English or Nigerian Pidgin.
    
    Return ONLY a JSON object with these keys:
    {
      "full_name": "string",
      "phone": "string or null",
      "item_of_interest": "string or null",
      "amount": number or null,
      "intent_level": "low" | "medium" | "high",
      "notes": "short summary of the request"
    }

    Context for intent_level:
    - "high": Ready to pay, asking for account details, or urgent.
    - "medium": Interested but asking questions or promised to pay later.
    - "low": Just asking for price or generic window shopping.

    Text: "${text}"
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().replace(/```json|```/g, "");
  return JSON.parse(responseText);
}