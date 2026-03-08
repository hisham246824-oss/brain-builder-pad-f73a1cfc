CREATE POLICY "Admins can view all user settings"
ON public.user_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));