-- -------------------------------------------------------------
-- MadMix Insights Database Schema (DDL)
-- Run this in the Supabase SQL editor to provision all tables.
-- -------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- 1. PROFILES — 1:1 with auth.users (auto-created via trigger)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    watched_cities TEXT[] DEFAULT '{}',
    watched_flavours TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_read"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ----------------------------------------------------------------
-- 2. GEO REFERENCE — pincode → city → state canonical mapping
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.geo_reference (
    pincode VARCHAR(10) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_geo_city ON public.geo_reference(city);
ALTER TABLE public.geo_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geo_team_read" ON public.geo_reference
    FOR SELECT USING (auth.role() = 'authenticated');


-- ----------------------------------------------------------------
-- 3. PODS SALES — city-level aggregate MRP sales per platform/month
--    "PODs" = Points of Distribution.  Values are rupees, NOT percentages.
--    Source: "PODs Availability" sheet of MadMix Quick Com Data.xlsx
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pods_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL,    -- 'Big Basket' | 'Instamart'
    month VARCHAR(20) NOT NULL,       -- 'Apr 2026' | 'May 2026'
    sales_mrp NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (city, platform, month)
);
CREATE INDEX IF NOT EXISTS idx_pods_sales_city ON public.pods_sales(city, platform);
ALTER TABLE public.pods_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pods_team_read" ON public.pods_sales
    FOR SELECT USING (auth.role() = 'authenticated');


-- ----------------------------------------------------------------
-- 4. SKU SALES — SKU-level sales MRP per city/platform
--    Source: "SKU Level Sales" sheet of MadMix Quick Com Data.xlsx
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sku_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT NOT NULL,                -- normalized: 'Aloo Sev Millet Bhujia'
    sku_raw TEXT,                     -- original Excel string (audit trail)
    line TEXT NOT NULL,               -- product line: 'Baked Millet Bhujia' etc.
    city VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL,    -- 'Big Basket' | 'Instamart'
    sales_mrp NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sku_sales_lookup ON public.sku_sales(city, platform, sku);
ALTER TABLE public.sku_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sku_team_read" ON public.sku_sales
    FOR SELECT USING (auth.role() = 'authenticated');


-- ----------------------------------------------------------------
-- 5. SALES VS SPENDS — daily ad spend + sales + computed A2S ratio
--    Source: "Sales vs Spends" sheet of MadMix Quick Com Data.xlsx
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_spends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    platform VARCHAR(50) NOT NULL,    -- 'Big Basket' | 'Instamart'
    spend NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    a2s NUMERIC(7, 4) GENERATED ALWAYS AS
        (CASE WHEN sales > 0 THEN spend / sales ELSE 0 END) STORED,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (date, platform)
);
CREATE INDEX IF NOT EXISTS idx_sales_spends_date ON public.sales_spends(date);
ALTER TABLE public.sales_spends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spends_team_read" ON public.sales_spends
    FOR SELECT USING (auth.role() = 'authenticated');


-- ----------------------------------------------------------------
-- 6. SURVEY RESPONSES — customer form data (form customer data.xlsx)
--    Columns match the actual Excel file structure.
--    platform here = where the CUSTOMER shops (Blinkit/Zepto),
--    NOT where MadMix sells (Big Basket/Instamart).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id VARCHAR(100) PRIMARY KEY,                    -- MadMix Code e.g. 'MX4A7'
    submitted_at TIMESTAMPTZ NOT NULL,
    age_group VARCHAR(30),                          -- '18-24', '25-34', '35-44', etc.
    location VARCHAR(100) NOT NULL,                 -- city name (normalized)
    consumption_frequency VARCHAR(50),              -- 'Daily' | 'Few times a week' | 'Monthly' | 'Rarely'
    skipped_due_to_unavailability BOOLEAN DEFAULT false,
    platform VARCHAR(50),                           -- 'Blinkit' | 'Zepto' (customer's shopping platform)
    pincode_availability BOOLEAN DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_survey_location ON public.survey_responses(location, platform);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_team_read" ON public.survey_responses
    FOR SELECT USING (auth.role() = 'authenticated');


-- ----------------------------------------------------------------
-- 7. DECISIONS — cached business recommendations (engine output)
--    scope_hash enables 24h caching; UNIQUE prevents duplicate runs.
--    type includes 'expand' (new: platform expansion opportunity).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.decisions (
    id VARCHAR(50) PRIMARY KEY,
    action TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,        -- 'grow'|'reduce'|'remove'|'monitor'|'spend'|'expand'
    severity VARCHAR(20) NOT NULL,    -- 'low'|'medium'|'high'
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    flavour TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    platform VARCHAR(50),
    reasoning TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_data_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    scope_hash VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decisions_scope ON public.decisions(scope_hash);
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "decisions_team_read" ON public.decisions
    FOR SELECT USING (auth.role() = 'authenticated');


-- ----------------------------------------------------------------
-- 8. SHARED ANALYSES — team collaboration board
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shared_by TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shared_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    note TEXT NOT NULL,
    title TEXT NOT NULL,
    filter_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
    preview_type VARCHAR(30) NOT NULL,    -- 'decision' | 'chart'
    preview_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    decision_id VARCHAR(50) REFERENCES public.decisions(id) ON DELETE SET NULL
);
ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared_team_read" ON public.shared_analyses
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "shared_user_insert" ON public.shared_analyses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);
CREATE POLICY "shared_owner_delete" ON public.shared_analyses
    FOR DELETE USING (auth.uid() = created_by);


-- ----------------------------------------------------------------
-- 9. SAVED ITEMS — user bookmarks on decisions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    decision_id VARCHAR(50) NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, decision_id)
);
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_own" ON public.saved_items
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- 10. COMPLETED ITEMS — decisions marked as actioned
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.completed_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    decision_id VARCHAR(50) NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, decision_id)
);
ALTER TABLE public.completed_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "completed_own" ON public.completed_items
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
