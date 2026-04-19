import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3-turbo",
      language: "en",
      prompt: "Nigerian vendor recording a sale. May include Pidgin English, Naira amounts like 10k, 5000 naira, customer names.",
    });

    const transcript = transcription.text;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a sales assistant for a Nigerian small business vendor.
Extract sale information from transcribed voice notes.
The text may be in English, Pidgin English, or a mix of both.

Understand these patterns:
- "Monica paid for red ankara, gave me 10k, balance is 5k" means total is 15000, paid 10000
- "Sold 2 bags of rice to Emeka for 40k, he paid 20k" means total 40000, paid 20000
- "Chioma don pay complete for the shoe" means fully paid
- "Tunde never pay at all" means amount_paid is 0
- "k" or "K" always means multiply by 1000 (e.g. 10k = 10000)
- "complete" or "full" means fully paid
- "balance" or "remains" or "still owes" means there is an outstanding amount

Extract these fields:
- customer_name: The customer full name or first name
- customer_phone: Phone number if mentioned, otherwise null
- item_name: The product or item sold
- total_amount: The full price of the item (number only, no currency)
- amount_paid: How much was actually paid. If fully paid use total_amount. If not paid at all use 0
- notes: Any extra detail worth noting

Important rules:
- If text says balance is X and paid is Y, then total = X + Y
- If text says fully paid or complete, set amount_paid equal to total_amount
- Always return numbers without commas or currency symbols
- Return ONLY a valid JSON object. No explanation, no markdown, no extra text.
- If a field cannot be found, use null`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      transcript,
      sale: parsed,
    });

  } catch (error: any) {
    console.error("Voice to task error:", error);
    return NextResponse.json(
      { error: error.message || "Voice processing failed" },
      { status: 500 }
    );
  }
}