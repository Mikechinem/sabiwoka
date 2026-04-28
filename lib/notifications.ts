import { createClient } from "@/lib/supabase/client";

export async function getLowStockAlerts() {
  const supabase = createClient();
  
  // Fetch items where stock is below a certain threshold (e.g., 5)
  const { data: lowStockItems, error } = await supabase
    .from("inventory")
    .select("id, name, quantity, min_stock_level")
    .lt("quantity", 5); // You can also use 'min_stock_level' if you have that column

  if (error || !lowStockItems) return [];

  return lowStockItems.map(item => ({
    id: item.id,
    type: 'low_stock',
    title: 'Restock Alert',
    message: `${item.name} is low (${item.quantity} left). Time to reorder!`,
    customer_name: 'Inventory', // Placeholder to keep your alert structure consistent
  }));
}