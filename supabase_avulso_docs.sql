-- ============================================================
-- SCRIPT: supabase_avulso_docs.sql
-- Execute TODO este bloco no SQL Editor do Supabase
-- Cria tabelas para armas, guias e SIMAF dos clientes "Sem App"
-- ============================================================

-- 1. Armas dos Clientes Sem App
CREATE TABLE IF NOT EXISTS public.avulso_crafs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    avulso_id UUID NOT NULL REFERENCES public.clientes_avulsos(id) ON DELETE CASCADE,
    tipo TEXT,
    fabricante TEXT,
    modelo_arma TEXT,
    calibre TEXT,
    n_serie TEXT,
    n_sigma TEXT,
    tipo_funcionamento TEXT DEFAULT 'Semi-Auto',
    vencimento_craf DATE,
    acervo TEXT DEFAULT 'Atirador',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.avulso_crafs DISABLE ROW LEVEL SECURITY;

-- 2. Guias de Tráfego dos Clientes Sem App
CREATE TABLE IF NOT EXISTS public.avulso_guias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    avulso_id UUID NOT NULL REFERENCES public.clientes_avulsos(id) ON DELETE CASCADE,
    n_guia TEXT,
    data_emissao DATE,
    vencimento_gt DATE,
    origem TEXT,
    destino TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.avulso_guias DISABLE ROW LEVEL SECURITY;

-- 3. SIMAF/IBAMA dos Clientes Sem App
CREATE TABLE IF NOT EXISTS public.avulso_simaf (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    avulso_id UUID NOT NULL UNIQUE REFERENCES public.clientes_avulsos(id) ON DELETE CASCADE,
    cr_ibama TEXT,
    venc_cr_ibama DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.avulso_simaf DISABLE ROW LEVEL SECURITY;
