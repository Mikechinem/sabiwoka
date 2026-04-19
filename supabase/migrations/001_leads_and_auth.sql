-- ============================================
-- SABIWOKA DATABASE SCHEMA - MIGRATION 001
-- Covers: Auth, Leads, Notifications
-- ============================================

-- Profiles table (extends Supabase auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  business_name TEXT,
  phone TEXT,
  currency TEXT DEFAULT 'NGN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policy: users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'interested', 'paid', 'lost');
CREATE TYPE intent_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE input_method AS ENUM ('manual', 'magic_paste', 'voice');

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Core lead info (populated by AI or manually)
  full_name TEXT NOT NULL,
  phone TEXT,
  item_of_interest TEXT,
  amount NUMERIC(12, 2),
  status lead_status DEFAULT 'new',
  intent_level intent_level DEFAULT 'medium',
  input_method input_method DEFAULT 'manual',

  -- Raw input storage (for debugging AI extractions)
  raw_paste_text TEXT,
  raw_voice_url TEXT,

  -- Follow-up tracking
  last_contacted_at TIMESTAMPTZ,
  follow_up_due_at TIMESTAMPTZ,
  alert_sent BOOLEAN DEFAULT FALSE,
  notes TEXT,

  -- WhatsApp deep link
  whatsapp_url TEXT GENERATED ALWAYS AS (
    CASE
      WHEN phone IS NOT NULL
      THEN 'https://wa.me/' || regexp_replace(phone, '[^0-9]', '', 'g')
      ELSE NULL
    END
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own leads"
  ON leads FOR ALL
  USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX leads_user_id_idx ON leads(user_id);
CREATE INDEX leads_status_idx ON leads(status);
CREATE INDEX leads_follow_up_idx ON leads(follow_up_due_at);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TYPE notification_type AS ENUM ('follow_up_overdue', 'payment_received', 'fake_alert_detected');

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);
