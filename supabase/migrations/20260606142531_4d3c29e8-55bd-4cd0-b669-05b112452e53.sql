
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM auth.users WHERE email = 'owner@majamu.id';
  IF existing_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
      'owner@majamu.id', crypt('Owner@Majamu1', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Owner Majamu"}'::jsonb,
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', 'owner@majamu.id', 'email_verified', true),
      'email', new_user_id::text, now(), now(), now());
    existing_id := new_user_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (existing_id, 'owner')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.profiles (id, full_name)
  VALUES (existing_id, 'Owner Majamu')
  ON CONFLICT (id) DO NOTHING;
END $$;
