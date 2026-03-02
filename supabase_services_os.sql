-- Script para criar as tabelas de Ordens de Serviço e Tabela de Preços para os Despachantes

-- Tabela de Preços e Serviços do Despachante
CREATE TABLE IF NOT EXISTS public.servicos_precos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispatcher_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nome_servico TEXT NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    prazo_estimado_dias INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.servicos_precos ENABLE ROW LEVEL SECURITY;

-- Políticas para servicos_precos
-- Despachantes podem ver, criar, atualizar e deletar seus próprios serviços
CREATE POLICY "Despachantes gerenciam seus proprios servicos" 
ON public.servicos_precos FOR ALL 
USING (dispatcher_id = auth.uid() OR dispatcher_id IN (SELECT id FROM public.clientes WHERE role = 'admin'));

-- Tabela de Ordens de Serviço (OS)
CREATE TABLE IF NOT EXISTS public.ordens_servico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispatcher_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    cac_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    servico_id UUID REFERENCES public.servicos_precos(id) ON DELETE SET NULL,
    servico_nome TEXT NOT NULL, -- Caso o serviço seja deletado, mantemos o nome original na OS
    status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'aguardando_cliente', 'concluida', 'cancelada')),
    valor_cobrado DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

-- Políticas para ordens_servico
-- Despachantes gerenciam suas OS
CREATE POLICY "Despachantes gerenciam suas proprios ordens" 
ON public.ordens_servico FOR ALL 
USING (dispatcher_id = auth.uid() OR dispatcher_id IN (SELECT id FROM public.clientes WHERE role = 'admin'));

-- Clientes visualizam apenas as suas próprias OS
CREATE POLICY "Clientes visualizam suas proprios ordens" 
ON public.ordens_servico FOR SELECT 
USING (cac_id = auth.uid());
