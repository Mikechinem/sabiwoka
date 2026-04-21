// C:\Dev\my-projects\sabiwoka\types\sale.ts

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type SaleInputMethod = 'manual' | 'voice' | 'scan';

export interface Sale {
  id: string;
  user_id: string;
  lead_id?: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  amount_paid: number;
  balance: number; // This matches your GENERATED ALWAYS column
  payment_status: PaymentStatus;
  invoice_image_url?: string | null;
  input_method: SaleInputMethod;
  notes?: string | null;
  sold_at: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// This is useful for when you fetch a sale WITH its items joined
export interface SaleWithItems extends Sale {
  sale_items: SaleItem[];
}