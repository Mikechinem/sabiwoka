import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function scanAndExtractSale(base64Image: string) {
  try {
    const response = await groq.chat.completions.create({
      // Using your specified Llama 4 Scout model
      model: "meta-llama/llama-4-scout-17b-16e-instruct", 
      messages: [
        {
          role: "system",
          content: `You are a high-precision OCR assistant for SabiWoka, a Nigerian business tool. 
          Analyze the invoice/receipt image and extract data with 100% accuracy.
          
          REQUIRED JSON STRUCTURE:
          {
            "customer_name": "string or null",
            "customer_phone": "string or null",
            "total_amount": number,
            "amount_paid": number,
            "items": [
              { "product_name": "string", "quantity": number, "unit_price": number }
            ]
          }

          RULES:
          1. If 'amount_paid' isn't clear, set it equal to 'total_amount'.
          2. If 'customer_name' is missing, return 'Walk-in Customer'.
          3. Convert all currency to raw numbers (no commas or symbols).`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all sale and item details from this receipt."
            },
            {
              type: "image_url",
              image_url: { url: base64Image }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  } catch (error: any) {
    console.error("GROQ SCOUT ERROR:", error.message);
    throw error;
  }
}