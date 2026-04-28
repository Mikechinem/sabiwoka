import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function parseInvoiceImage(
  base64Image: string,
  scanType: "sale" | "inventory" = "inventory"
) {
  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct", // RESTORED
    messages: [
      {
        role: "system",
        content: `You are an expert inventory clerk analyzing a ${
          scanType === "inventory" ? "Supply/Restock Invoice" : "Sales Receipt"
        }.

If this is "inventory", extract items being added to stock at cost prices.
If this is "sale", extract items being sold to customers at selling prices.

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
- Extract product names, quantities, and prices clearly.
- Convert shorthand prices (e.g., "20k") to full numbers (20000).
- If quantity is not visible, assume 1.
- If customer name is missing use null.
- Keep product names concise and professional.
- total_amount is the sum of all items.
- If amount_paid is not visible set it equal to total_amount.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract all items from this ${scanType} image.`,
          },
          {
            type: "image_url",
            image_url: { url: base64Image },
          },
        ],
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  return JSON.parse(content || '{"items": []}');
}