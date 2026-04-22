import { NextRequest, NextResponse } from "next/server";
import { scanPaymentReceipt } from "@/lib/gemini/payment-scanner";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 image string from frontend

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const result = await scanPaymentReceipt(image);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}