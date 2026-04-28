export interface Debt {
  id: string;
  sale_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  amount_paid: number;
  balance: number;
  is_settled: boolean;
  created_at: string;
  updated_at: string;
  reminder_count: number;
  last_reminder_sent_at: string | null;
}