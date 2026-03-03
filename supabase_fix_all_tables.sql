-- ============================================================
-- SCRIPT: supabase_fix_all_tables.sql
-- Execute TODO este bloco no SQL Editor do Supabase
-- Corrige colunas faltantes em TODAS as tabelas do sistema
-- ============================================================

-- ─── TABELA: crafs (Armas) ───────────────────────────────────
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
ALTER TABLE public.crafs DISABLE ROW LEVEL SECURITY;

-- ─── TABELA: guias (Guias de Tráfego) ───────────────────────
ALTER TABLE public.guias ADD COLUMN IF NOT EXISTS arma_id UUID;
ALTER TABLE public.guias ADD COLUMN IF NOT EXISTS arma_nome TEXT;
ALTER TABLE public.guias ADD COLUMN IF NOT EXISTS tipo_guia TEXT;
ALTER TABLE public.guias ADD COLUMN IF NOT EXISTS data_vencimento DATE;
ALTER TABLE public.guias ADD COLUMN IF NOT EXISTS destino TEXT;
ALTER TABLE public.guias ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.guias DISABLE ROW LEVEL SECURITY;

-- ─── TABELA: ibama (IBAMA / CR) ──────────────────────────────
ALTER TABLE public.ibama ADD COLUMN IF NOT EXISTS cr_ibama TEXT;
ALTER TABLE public.ibama ADD COLUMN IF NOT EXISTS venc_cr_ibama DATE;
ALTER TABLE public.ibama DISABLE ROW LEVEL SECURITY;

-- ─── TABELA: simaf (Propriedades de Caça) ───────────────────
ALTER TABLE public.simaf ADD COLUMN IF NOT EXISTS fazenda TEXT;
ALTER TABLE public.simaf ADD COLUMN IF NOT EXISTS proprietario TEXT;
ALTER TABLE public.simaf ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.simaf ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE public.simaf ADD COLUMN IF NOT EXISTS n_car TEXT;
ALTER TABLE public.simaf ADD COLUMN IF NOT EXISTS data_vencimento DATE;
ALTER TABLE public.simaf ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.simaf DISABLE ROW LEVEL SECURITY;

-- ─── TABELA: clientes (Usuários CAC) ─────────────────────────
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS senha_app TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS atividades_cr TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS clube_filiado TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nivel_atirador TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS observacoes_globais TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS numero_cr TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS vencimento_cr DATE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS senha_gov TEXT;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;

-- Verificar resultado (opcional):
-- SELECT table_name, column_name FROM information_schema.columns
-- WHERE table_schema = 'public'
-- ORDER BY table_name, ordinal_position;
