
-- ==========================================================
-- SCRIPT PARA SALVAR TOKEN DO HUGGING FACE
-- ==========================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Pega o ID do seu usuário master
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'clodoaldo608@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- 2. Insere ou atualiza a configuração do Hugging Face
    INSERT INTO public.integration_configs (user_id, platform, is_active, config, updated_at)
    VALUES (
      v_user_id, 
      'huggingface', 
      true, 
      '{"api_token": "YOUR_ACTUAL_TOKEN_HERE", "model_id": "mistralai/Mistral-7B-Instruct-v0.2"}'::jsonb,
      now()
    )
    ON CONFLICT (user_id, platform) 
    DO UPDATE SET 
      config = EXCLUDED.config,
      is_active = true,
      updated_at = now();

    RAISE NOTICE 'Token do Hugging Face configurado com sucesso para o usuário master!';
  ELSE
    RAISE NOTICE 'Usuário master não encontrado. Certifique-se de que o usuário clodoaldo608@gmail.com foi criado.';
  END IF;
END $$;
