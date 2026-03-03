-- ============================================================
-- SCRIPT: supabase_fix_crafs.sql
-- Execute TODO este bloco no SQL Editor do Supabase
-- Adiciona colunas que estão faltando na tabela 'crafs'
-- ============================================================

-- Adiciona colunas faltantes (IF NOT EXISTS evita erro se já existir)
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS fabricante TEXT;
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS modelo_arma TEXT;
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS calibre TEXT;
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS n_serie TEXT;
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS n_sigma TEXT;
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS tipo_funcionamento TEXT DEFAULT 'Semi-Auto';
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS vencimento_craf DATE;
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS acervo TEXT DEFAULT 'Atirador';
ALTER TABLE public.crafs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Garante que RLS está desabilitado (sem auth próprio do Supabase)
ALTER TABLE public.crafs DISABLE ROW LEVEL SECURITY;

-- Para verificar o resultado:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'crafs' ORDER BY ordinal_position;
