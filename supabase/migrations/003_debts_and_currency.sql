-- ============================================
-- SABIWOKA DATABASE SCHEMA - MIGRATION 003
-- Covers: Debts, Payment Scans, Currency
-- ============================================

-- ============================================
-- DEBTS TABLE
-- ============================================
CREATE TABLE debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_amount NUMERIC(12, 2) NOT NULL,
  amount_paid NUMERIC(12, 2) DEFAULT 0,
  balance NUMERIC(12, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,

  -- WhatsApp recovery message
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,

  is_settled BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own debts"
  ON debts FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX debts_user_id_idx ON debts(user_id);
CREATE INDEX debts_is_settled_idx ON debts(is_settled);

-- ============================================
-- PAYMENT SCANS TABLE
-- Stores results of proof-of-payment scans
-- and fake alert detections
-- ============================================
CREATE TYPE scan_type AS ENUM ('proof_of_payment', 'fake_alert_check');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

CREATE TABLE payment_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,

  scan_type scan_type NOT NULL,
  image_url TEXT NOT NULL,

  -- AI extracted data
  extracted_amount NUMERIC(12, 2),
  extracted_date TIMESTAMPTZ,
  extracted_bank TEXT,
  extracted_reference TEXT,

  -- Fake alert detection
  risk_level risk_level DEFAULT 'low',
  risk_reasons TEXT[],
  is_flagged BOOLEAN DEFAULT FALSE,

  ai_raw_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment scans"
  ON payment_scans FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX payment_scans_user_id_idx ON payment_scans(user_id);
CREATE INDEX payment_scans_is_flagged_idx ON payment_scans(is_flagged);

-- ============================================
-- CURRENCY SETTINGS TABLE
-- ============================================
CREATE TABLE currency_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  usd_to_ngn_rate NUMERIC(10, 2) DEFAULT 1500.00,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE currency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own currency settings"
  ON currency_settings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER (applies to all tables)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
