
-- search_path eksplisit (validate_shift_note sudah punya tapi pastikan log_order_status juga)
CREATE OR REPLACE FUNCTION public.validate_shift_note() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.kategori IN ('pengeluaran','selisih_kas_kurang','selisih_kas_lebih') AND NEW.nominal IS NULL THEN
    RAISE EXCEPTION 'nominal wajib untuk kategori finansial';
  END IF;
  RETURN NEW;
END $$;

-- Cabut EXECUTE publik dari fungsi internal trigger
REVOKE ALL ON FUNCTION public.log_order_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_shift_note() FROM PUBLIC, anon, authenticated;

-- Perketat policy insert order_status_history: hanya boleh diisi oleh trigger (service_role), bukan client.
DROP POLICY IF EXISTS "System insert history" ON public.order_status_history;
REVOKE INSERT ON public.order_status_history FROM anon, authenticated;
-- Tetap boleh insert via service_role (sudah ada GRANT ALL ... TO service_role).
