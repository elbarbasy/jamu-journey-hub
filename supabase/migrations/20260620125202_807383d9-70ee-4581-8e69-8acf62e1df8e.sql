
-- Drop tables not in PRD
DROP TABLE IF EXISTS public.loyalty_points CASCADE;
DROP TABLE IF EXISTS public.quiz_options CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.tables CASCADE;

-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.stok_status AS ENUM ('tersedia','habis_hari_ini');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ingredient_kategori AS ENUM ('rimpang_segar','rempah_kering','daun_bunga','asam_sitrus','pemanis');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.shift_note_kategori AS ENUM ('pengeluaran','selisih_kas_kurang','selisih_kas_lebih','catatan_kas','lainnya');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.toko_status AS ENUM ('buka','tutup');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ FILTER CHIPS ============
CREATE TABLE IF NOT EXISTS public.filter_chips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL UNIQUE,
  urutan integer NOT NULL DEFAULT 0,
  is_special boolean NOT NULL DEFAULT false, -- 'Semua' & 'Rekomendasi'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.filter_chips TO anon, authenticated;
GRANT ALL ON public.filter_chips TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.filter_chips TO authenticated;
ALTER TABLE public.filter_chips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read filter_chips" ON public.filter_chips FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner manage filter_chips" ON public.filter_chips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

-- ============ INGREDIENTS ============
CREATE TABLE IF NOT EXISTS public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL UNIQUE,
  kategori public.ingredient_kategori NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ingredients TO anon, authenticated;
GRANT ALL ON public.ingredients TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ingredients" ON public.ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner manage ingredients" ON public.ingredients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

-- ============ PRODUCTS additions ============
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status_stok public.stok_status NOT NULL DEFAULT 'tersedia',
  ADD COLUMN IF NOT EXISTS filter_chip_unggulan_id uuid REFERENCES public.filter_chips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deskripsi_kontekstual jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ============ PIVOTS ============
CREATE TABLE IF NOT EXISTS public.product_filter_chips (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  filter_chip_id uuid NOT NULL REFERENCES public.filter_chips(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, filter_chip_id)
);
GRANT SELECT ON public.product_filter_chips TO anon, authenticated;
GRANT ALL ON public.product_filter_chips TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.product_filter_chips TO authenticated;
ALTER TABLE public.product_filter_chips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pfc" ON public.product_filter_chips FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner manage pfc" ON public.product_filter_chips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TABLE IF NOT EXISTS public.product_ingredients (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, ingredient_id)
);
GRANT SELECT ON public.product_ingredients TO anon, authenticated;
GRANT ALL ON public.product_ingredients TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.product_ingredients TO authenticated;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pi" ON public.product_ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner manage pi" ON public.product_ingredients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

-- ============ ORDERS additions ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS nomor_tampilan jsonb,
  ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uidx ON public.orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============ ORDER STATUS HISTORY ============
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON public.order_status_history(order_id, created_at);
GRANT SELECT ON public.order_status_history TO anon, authenticated;
GRANT INSERT ON public.order_status_history TO anon, authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read history" ON public.order_status_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "System insert history" ON public.order_status_history FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Trigger: append to history on insert & status change
CREATE OR REPLACE FUNCTION public.log_order_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.order_status_history(order_id, status) VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_log_status_ins ON public.orders;
CREATE TRIGGER orders_log_status_ins AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status();

DROP TRIGGER IF EXISTS orders_log_status_upd ON public.orders;
CREATE TRIGGER orders_log_status_upd AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status();

-- ============ SHIFT NOTES ============
CREATE TABLE IF NOT EXISTS public.shift_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori public.shift_note_kategori NOT NULL,
  nominal integer,
  keterangan text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.shift_notes TO authenticated;
GRANT ALL ON public.shift_notes TO service_role;
ALTER TABLE public.shift_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read shift_notes" ON public.shift_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'cashier'));
CREATE POLICY "Staff insert shift_notes" ON public.shift_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'cashier'));

-- Validation: nominal wajib untuk 3 kategori finansial
CREATE OR REPLACE FUNCTION public.validate_shift_note() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kategori IN ('pengeluaran','selisih_kas_kurang','selisih_kas_lebih') AND NEW.nominal IS NULL THEN
    RAISE EXCEPTION 'nominal wajib untuk kategori finansial';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS shift_notes_validate ON public.shift_notes;
CREATE TRIGGER shift_notes_validate BEFORE INSERT OR UPDATE ON public.shift_notes
  FOR EACH ROW EXECUTE FUNCTION public.validate_shift_note();

-- ============ APP CONFIG (single row) ============
CREATE TABLE IF NOT EXISTS public.app_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  threshold_urgensi_menit integer NOT NULL DEFAULT 5,
  toko_status public.toko_status NOT NULL DEFAULT 'tutup',
  nomor_antrian_counter integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT UPDATE ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read config" ON public.app_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff update config" ON public.app_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'cashier'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'cashier'));

-- ============ SEED ============
INSERT INTO public.app_config(id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.filter_chips(nama, urutan, is_special) VALUES
  ('Semua', 0, true),
  ('Rekomendasi', 1, true),
  ('Daya Tahan Tubuh', 2, false),
  ('Pencernaan Nyaman', 3, false),
  ('Pegal & Capek', 4, false),
  ('Tenang & Tidur', 5, false),
  ('Hangatkan Tubuh', 6, false),
  ('Segar di Tengah Hari', 7, false),
  ('Untuk Wanita', 8, false),
  ('Klasik Jamu', 9, false),
  ('Manis Lembut', 10, false)
ON CONFLICT (nama) DO NOTHING;
