import { NextResponse } from "next/server";
import { parseMagicPaste } from "@/lib/groq/magic-paste";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const parsedLead = await parseMagicPaste(text);

    return NextResponse.json({ success: true, lead: parsedLead });

  } catch (error: any) {
    console.error("Magic paste error:", error);
    return NextResponse.json(
      { error: error.message || "AI processing failed" },
      { status: 500 }
    );
  }
}