-- ============================================================
-- SQL — Tabela de Conexões entre Despachantes e CACs
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

CREATE TABLE IF NOT EXISTS conexoes (
    id TEXT PRIMARY KEY,
    dispatcher_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    cac_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'pending_cac', 'pending_dispatcher', 'active'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(dispatcher_id, cac_id)
);

-- Habilitar RLS se necessário, por padrão as outras parecem ser public.
-- Mas se for habilitar, este é o comando básico:
-- ALTER TABLE conexoes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permitir tudo para autenticados" ON conexoes FOR ALL USING (true);
