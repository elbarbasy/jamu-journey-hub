DROP POLICY IF EXISTS "loyalty public read" ON public.loyalty_points;

CREATE POLICY "loyalty staff read"
ON public.loyalty_points
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'cashier'::app_role));

REVOKE SELECT ON public.loyalty_points FROM anon;