-- ============================================================
-- SCRIPT CORRIGIDO: supabase_offline_clients_fix.sql
-- Execute TODO este bloco no SQL Editor do Supabase
-- 
-- MOTIVO DO FIX: o app usa autenticação própria (CPF+senha) 
-- e NÃO usa o Supabase Auth, logo auth.uid() = NULL.
-- Solução: desabilitar RLS restritivo e usar política permissiva.
-- ============================================================

-- 1. Criar tabela de Clientes Avulsos (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.clientes_avulsos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispatcher_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cpf TEXT,
    telefone TEXT,
    senha_gov_br TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. REMOVER todas as políticas antigas (evitar conflito)
DROP POLICY IF EXISTS "Despachante gerencia seus clientes avulsos" ON public.clientes_avulsos;

-- 3. DESABILITAR RLS completamente para esta tabela
--    (A segurança é feita via anon key do Supabase + filtro dispatcher_id no código)
ALTER TABLE public.clientes_avulsos DISABLE ROW LEVEL SECURITY;

-- 4. Modificar tabela ordens_servico para suportar clientes avulsos
ALTER TABLE public.ordens_servico ALTER COLUMN cac_id DROP NOT NULL;

ALTER TABLE public.ordens_servico 
    ADD COLUMN IF NOT EXISTS cliente_avulso_id UUID 
    REFERENCES public.clientes_avulsos(id) ON DELETE SET NULL;
