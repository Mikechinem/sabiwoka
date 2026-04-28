import { NextRequest, NextResponse } from "next/server";
import { parseInvoiceImage } from "@/lib/groq/invoice-parser";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, scanType } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const data = await parseInvoiceImage(image, scanType || "inventory");

    if (!data) {
      return NextResponse.json({ error: "AI returned no data" }, { status: 500 });
    }

    // SURGICAL FIX: Link AI name to Product ID for inventory deduction
    if (scanType === "sale" && data.items?.length > 0) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const enriched = await Promise.all(
          data.items.map(async (item: any) => {
            const { data: product } = await supabase
              .from("products")
              .select("id, price")
              .eq("user_id", user.id)
              .ilike("name", `%${item.name?.trim() ?? ""}%`) // Fuzzy match
              .maybeSingle();

            return {
              ...item,
              product_id: product?.id ?? null,
              unit_price: item.unit_price || product?.price || 0,
            };
          })
        );
        data.items = enriched;
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Invoice scan route error:", error.message);
    return NextResponse.json(
      { error: error.message || "AI failed to process the image" },
      { status: 500 }
    );
  }
}