-- Tabela para gerenciar os Clientes Manuais (Avulsos) do Despachante
CREATE TABLE IF NOT EXISTS public.clientes_avulsos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispatcher_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cpf TEXT,
    telefone TEXT,
    senha_gov_br TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.clientes_avulsos ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes_avulsos
-- Apenas o despachante criador pode ver e modificar seus clientes avulsos
CREATE POLICY "Despachante gerencia seus clientes avulsos" 
ON public.clientes_avulsos FOR ALL 
USING (dispatcher_id = auth.uid());


-- Alteração na tabela Ordens de Serviço (ordens_servico)
-- Precisamos permitir que cac_id seja nulo, para podermos usar o cliente_avulso_id

ALTER TABLE public.ordens_servico ALTER COLUMN cac_id DROP NOT NULL;

-- Adiciona a coluna para referenciar o cliente avulso
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS cliente_avulso_id UUID REFERENCES public.clientes_avulsos(id) ON DELETE CASCADE;

-- Criar constraint para garantir que tenha um cac_id OU um cliente_avulso_id, mas não ambos vazios
-- (Não estrito, apenas para integridade relacional se necessário, mas o app vai tratar isso).
