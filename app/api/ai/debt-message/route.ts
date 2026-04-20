import { NextResponse } from "next/server";
import { generateDebtFollowUp } from "@/lib/groq/debt-message";

export async function POST(req: Request) {
  try {
    const { customerName, amount, item } = await req.json();
    const message = await generateDebtFollowUp(customerName, amount, item);
    return NextResponse.json({ message });
  } catch (error) {
    console.error("Debt AI Error:", error);
    return NextResponse.json({ error: "Failed to generate message" }, { status: 500 });
  }
}