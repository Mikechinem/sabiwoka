import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;
    // This is the key! We get the context from the component (leads or sales)
    const context = (formData.get("context") as string) || "sales"; 

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // 1. Transcription - Optimized for Nigerian context
    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3-turbo",
      language: "en",
      prompt: "Nigerian vendor recording business. Pidgin English, Naira (10k, 5k), and names.",
    });

    const transcript = transcription.text;

    // 2. Dynamic Prompt Selection
    const systemPrompts = {
      sales: `You are a sales assistant. Extract: customer_name, customer_phone, item_name, total_amount, amount_paid, notes. 
              Patterns: "k"=1000. If "paid full", amount_paid = total_amount.`,
      
      leads: `You are a lead generation assistant. Extract potential interest from this voice note.Return ONLY this JSON structure:
              {
              "full_name": string,
               "phone": string,
                "item_of_interest": string,
                  "amount": number,
                  "notes": string
                     }
                  Important: Use 'full_name' exactly. Use 'amount' for the budget/price. No extra text.`
    };

    // 3. AI Parsing using the selected prompt
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `${systemPrompts[context as keyof typeof systemPrompts]} 
                    Return ONLY valid JSON. If missing, use null. No markdown.`
        },
        { role: "user", content: transcript },
      ],
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // 4. Dynamic Response - This fixes the "Failed to Parse" error on the Lead page
    return NextResponse.json({
      success: true,
      transcript,
      [context === "sales" ? "sale" : "lead"]: parsed, 
    });

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Voice processing failed" }, { status: 500 });
  }
}