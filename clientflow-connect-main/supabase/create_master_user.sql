
-- ==========================================================
-- SCRIPT DE CRIAÇÃO DO USUÁRIO MASTER (EXECUTAR NO SQL EDITOR)
-- ==========================================================
-- Este script cria o usuário diretamente no sistema de autenticação
-- do Supabase e vincula ao perfil do ClientFlow.

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- 1. Verifica se o usuário já existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'clodoaldo608@gmail.com') THEN
    
    -- 2. Insere na tabela de autenticação (Senha: 88677488)
    -- O hash foi gerado usando crypt()
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'clodoaldo608@gmail.com',
      extensions.crypt('88677488', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Clodoaldo Master"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- 3. Insere a identidade do usuário
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id::text, 'clodoaldo608@gmail.com')::jsonb,
      'email',
      new_user_id, -- provider_id é o ID do usuário para o provedor email
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Usuário clodoaldo608@gmail.com criado com sucesso!';
  ELSE
    RAISE NOTICE 'Usuário já existe!';
  END IF;
END $$;
