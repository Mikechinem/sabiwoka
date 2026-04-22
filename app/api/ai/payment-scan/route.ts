import { NextRequest, NextResponse } from "next/server";
import { scanAndVerifyReceipt } from "@/lib/groq/payment-scanner";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const result = await scanAndVerifyReceipt(image);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Payment scan error:", error);
    return NextResponse.json(
      { error: "Scanner failed to process the request" },
      { status: 500 }
    );
  }
}