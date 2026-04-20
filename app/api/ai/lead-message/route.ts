import { NextResponse } from "next/server";
import { generateLeadFollowUp } from "@/lib/groq/lead-message";

export async function POST(req: Request) {
  try {
    const { customerName, item, notes } = await req.json();
    const message = await generateLeadFollowUp(customerName, item, notes);
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: "Groq error" }, { status: 500 });
  }
}