import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function scanAndVerifyReceipt(imageBase64: string) {
  try {
    const completion = await groq.chat.completions.create({
      // THIS IS THE 2026 STABLE PRODUCTION ID
      model: "meta-llama/llama-4-scout-17b-16e-instruct", 
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a Nigerian Bank Receipt Auditor. Analyze the image and return ONLY JSON.
              JSON Format: {"amount": number, "bankName": "string", "verdict": "REAL"|"SUSPICIOUS"|"LIKELY_FAKE", "isFakeProbability": number, "redFlags": [], "rawTextSummary": "string"}`
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64, // Frontend sends the full data URL
              },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0]?.message?.content || "{}");

  } catch (err: any) {
    console.error("GROQ CRITICAL ERROR:", err.message);
    
    // If the 17b model is overloaded, return a friendly message instead of a 500 error
    return {
      amount: null,
      bankName: null,
      verdict: "SUSPICIOUS",
      isFakeProbability: 0,
      redFlags: ["The scanner is currently busy. Please try again in 10 seconds."],
      rawTextSummary: "System busy: " + err.message
    };
  }
}