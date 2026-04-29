import { Groq } from "groq-sdk";

// 1. Get the public key
const publicApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

// 2. Initialize with a check to prevent the "Uncaught Error" crash
export const groq = publicApiKey 
  ? new Groq({ apiKey: publicApiKey, dangerouslyAllowBrowser: true }) 
  : null;

export async function transcribeAudio(file: File) {
  if (!groq) throw new Error("AI Service not configured. Please check your API Key.");
  
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      language: "en",
      response_format: "json",
    });
    return transcription.text;
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
}

export async function parseVoiceTranscript(transcript: string, mode: 'sales' | 'leads' | 'inventory') {
  if (!groq) throw new Error("AI Service not configured.");

  const systemPrompts = {
    inventory: `You are an Inventory Assistant. Return JSON: { "items": [{ "name": string, "quantity": number, "buying_price": number }] }`,
    
    // FIXED: Removed "content:" and added a comma at the end!
    sales: `You are an expert sales assistant. Extract the transaction details from the text.
        
        Return ONLY a JSON object in this exact format:
        {
          "customer_name": "string or null",
          "customer_phone": "string or null",
          "total_amount": number or null,
          "amount_paid": number or null,
          "items": [
            { "name": "string", "quantity": number, "unit_price": number }
          ]
        }
        
        Guidelines:
        - If multiple different items are mentioned, put each in the "items" array.
        - If quantity is not mentioned, assume 1.
        - total_amount is the sum of (quantity * unit_price) for all items.
        - If amount_paid is not explicitly stated as partial, assume amount_paid equals total_amount.`, 
        
    leads: `You are a Lead Generator. Return JSON: { "full_name": string, "phone": string, "intent": "high" | "medium" | "low" }`
  };

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompts[mode] },
      { role: "user", content: transcript },
    ],
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0]?.message?.content || "{}");
}