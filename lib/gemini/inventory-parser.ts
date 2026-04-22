import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function parseInventoryInvoice(imageAsBase64: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this supplier invoice or waybill. Extract the items being restocked.
    Identify: Product Name, Quantity, and Unit Price (if available).
    
    Return ONLY a JSON array of objects:
    [
      { "product_name": "string", "quantity": number, "price": number }
    ]
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
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Inventory Scan Error:", error);
    throw new Error("Could not parse invoice");
  }
}