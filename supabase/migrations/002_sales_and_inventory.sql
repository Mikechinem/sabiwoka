-- ============================================
-- SABIWOKA DATABASE SCHEMA - MIGRATION 002
-- Covers: Products, Inventory, Sales
-- ============================================

-- ============================================
-- PRODUCTS TABLE (vendor catalogue)
-- ============================================
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  price_usd_equivalent NUMERIC(12, 2),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own products"
  ON products FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX products_user_id_idx ON products(user_id);
CREATE INDEX products_is_active_idx ON products(is_active);

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TYPE sale_input_method AS ENUM ('manual', 'invoice_scan', 'voice');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');

CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Sale details
  customer_name TEXT,
  customer_phone TEXT,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12, 2) DEFAULT 0,
  balance NUMERIC(12, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  payment_status payment_status DEFAULT 'unpaid',

  -- Invoice/waybill scan
  invoice_image_url TEXT,
  input_method sale_input_method DEFAULT 'manual',

  notes TEXT,
  sold_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sales"
  ON sales FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX sales_user_id_idx ON sales(user_id);
CREATE INDEX sales_payment_status_idx ON sales(payment_status);
CREATE INDEX sales_sold_at_idx ON sales(sold_at);

-- ============================================
-- SALE ITEMS TABLE (line items per sale)
-- ============================================
CREATE TABLE sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sale items"
  ON sale_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.user_id = auth.uid()
    )
  );

-- Auto-subtract inventory when a sale item is created
CREATE OR REPLACE FUNCTION deduct_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_sale_item_created
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION deduct_inventory();
