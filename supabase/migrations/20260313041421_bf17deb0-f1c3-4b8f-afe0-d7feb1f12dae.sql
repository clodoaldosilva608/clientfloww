
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS house_number text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS complement text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS cpf text;
