export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  price: number;                // This is your Selling Price
  buying_price?: number;        // You should add this column to Supabase for profit tracking
  stock_quantity: number;       // Matches your schema
  low_stock_threshold: number;  // Matches your schema
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}