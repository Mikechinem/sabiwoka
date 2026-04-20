import { groq, GROQ_MODEL } from "./client";

export async function parseMagicPaste(text: string) {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a sales assistant for a Nigerian small business vendor.
Extract lead information from WhatsApp chats or text snippets.
The text may be in English, Pidgin English, or a mix of both.

Extract these fields:
- full_name: The customer full name
- phone: Phone number (e.g 08012345678 or +2348012345678)
- item_of_interest: The product or service they want to buy
- amount: Price or amount mentioned (numbers only, no currency symbol)
- intent_level: "high" if buying now or paid, "medium" if interested, "low" if just asking
- status: "paid" if payment confirmed, "interested" if wants to buy, "new" if just enquiring
- notes: Any other useful detail

Return ONLY a valid JSON object with these exact keys. No explanation, no markdown, no extra text.
If a field is not found, use null for that field.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: "json_object" }, // This replaces the need for .replace(/```json/g, "")
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  return JSON.parse(raw);
}