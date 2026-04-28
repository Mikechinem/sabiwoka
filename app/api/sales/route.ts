import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      customer_name,
      customer_phone,
      total_amount,
      amount_paid,
      payment_status,
      input_method,
      notes,
      sold_at,
      lead_id,
      items,
    } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1 — Create the sale record
    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          user_id,
          customer_name,
          customer_phone: customer_phone || null,
          total_amount,
          amount_paid: amount_paid || 0,
          payment_status: payment_status || "unpaid",
          input_method: input_method || "manual",
          notes: notes || null,
          sold_at: sold_at || new Date().toISOString(),
          lead_id: lead_id || null,
        },
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    // 2 — Create sale_items if provided
    if (items && items.length > 0) {
      const saleItems = items.map((item: any) => ({
        sale_id: saleData.id,
        product_id: item.product_id || null,
        product_name: item.product_name || item.name,
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;
    }

    // 3 — Auto-create debt if not fully paid
    const paid = parseFloat(amount_paid) || 0;
    const total = parseFloat(total_amount) || 0;
    const status = paid === 0 ? "unpaid" : paid >= total ? "paid" : "partial";

    if (status !== "paid") {
      await supabase.from("debts").insert([
        {
          user_id,
          sale_id: saleData.id,
          customer_name,
          customer_phone: customer_phone || null,
          total_amount: total,
          amount_paid: paid,
          is_settled: false,
        },
      ]);
    }

    return NextResponse.json({ success: true, data: saleData }, { status: 200 });

  } catch (error: any) {
    console.error("Sales route error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("sales")
      .select("*, sale_items(*)")
      .eq("user_id", user_id)
      .order("sold_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}