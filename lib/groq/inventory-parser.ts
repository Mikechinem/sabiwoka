import Groq from "groq-sdk";

// Use the NEXT_PUBLIC prefix so the browser can see it
const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

// Initialize with a check so it doesn't crash if the key is missing
const groq = new Groq({ 
  apiKey: apiKey || "", 
  dangerouslyAllowBrowser: true 
});

export async function parseInventoryInput(text: string) {
  if (!apiKey) {
    console.error("GROQ API Key is missing from environment variables.");
    throw new Error("AI features are not configured correctly.");
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an inventory assistant. Extract product details from the text. 
          Return ONLY a JSON object with an "items" array. 
          Each item must have: "name", "quantity" (number), and "buying_price" (number).`
        },
        { role: "user", content: text },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    return JSON.parse(content || '{"items": []}');
  } catch (error) {
    console.error("Groq Parser Error:", error);
    throw error;
  }
}