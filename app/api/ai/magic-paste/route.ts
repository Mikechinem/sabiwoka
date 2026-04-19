import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ success: true, lead: parsed });

  } catch (error: any) {
    console.error("Magic paste error:", error);
    return NextResponse.json(
      { error: error.message || "AI processing failed" },
      { status: 500 }
    );
  }
}