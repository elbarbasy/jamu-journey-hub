
-- Revoke public execute on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- Tighten anon insert WITH CHECK
DROP POLICY "orders public insert" ON public.orders;
CREATE POLICY "orders public insert" ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(customer_name) BETWEEN 1 AND 100
    AND char_length(customer_whatsapp) BETWEEN 6 AND 20
    AND total >= 0 AND subtotal >= 0
    AND status = 'WAITING_PAYMENT'
  );

DROP POLICY "items public insert" ON public.order_items;
CREATE POLICY "items public insert" ON public.order_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    quantity > 0 AND unit_price >= 0 AND line_total >= 0
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.status='WAITING_PAYMENT')
  );

DROP POLICY "payments public insert" ON public.payments;
CREATE POLICY "payments public insert" ON public.payments FOR INSERT TO anon, authenticated
  WITH CHECK (
    amount > 0 AND status = 'PENDING'
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id)
  );
