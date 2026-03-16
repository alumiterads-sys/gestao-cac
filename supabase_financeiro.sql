-- Script SQL: Inicialização do Módulo Financeiro B2B2C
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Tabela: configuracoes_globais
CREATE TABLE IF NOT EXISTS public.configuracoes_globais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    taxa_setup_despachante NUMERIC NOT NULL DEFAULT 500.00,
    mensalidade_despachante NUMERIC NOT NULL DEFAULT 150.00,
    plano_cac_semestral NUMERIC NOT NULL DEFAULT 69.90,
    plano_cac_anual NUMERIC NOT NULL DEFAULT 120.00,
    meta_cac_desconto INTEGER NOT NULL DEFAULT 10,
    percentual_desconto_meta NUMERIC NOT NULL DEFAULT 20.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir a linha inicial (se não existir)
INSERT INTO public.configuracoes_globais (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_globais);

-- 2. Tabela: assinaturas
CREATE TABLE IF NOT EXISTS public.assinaturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo_plano TEXT NOT NULL CHECK (tipo_plano IN ('despachante_base', 'cac_semestral', 'cac_anual')),
    status TEXT NOT NULL CHECK (status IN ('ativa', 'pendente_pagamento', 'cancelada', 'atrasada', 'trial')),
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
    valor_recorrente NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela assinaturas
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

-- Policy (SuperAdmin pode tudo, Cliente pode ler a sua)
CREATE POLICY "SuperAdmin pode gerenciar assinaturas" 
ON public.assinaturas FOR ALL 
USING ( (SELECT role FROM public.clientes WHERE id = auth.uid()) = 'superadmin' );

CREATE POLICY "Cliente ve sua propria assinatura" 
ON public.assinaturas FOR SELECT 
USING ( cliente_id = auth.uid() );


-- 3. Tabela: faturas
CREATE TABLE IF NOT EXISTS public.faturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assinatura_id UUID REFERENCES public.assinaturas(id) ON DELETE SET NULL,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    valor_total NUMERIC NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('aberta', 'paga', 'vencida', 'cancelada')),
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    gateway_id TEXT, -- ID no Asaas/Stripe
    link_pagamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela faturas
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin pode gerenciar faturas" 
ON public.faturas FOR ALL 
USING ( (SELECT role FROM public.clientes WHERE id = auth.uid()) = 'superadmin' );

CREATE POLICY "Cliente ve suas proprias faturas" 
ON public.faturas FOR SELECT 
USING ( cliente_id = auth.uid() );


-- 4. Função: Atualizar 'updated_at' automaticamente (para Trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers de Update
DROP TRIGGER IF EXISTS update_configuracoes_globais_updated_on ON public.configuracoes_globais;
CREATE TRIGGER update_configuracoes_globais_updated_on
BEFORE UPDATE ON public.configuracoes_globais
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_assinaturas_updated_on ON public.assinaturas;
CREATE TRIGGER update_assinaturas_updated_on
BEFORE UPDATE ON public.assinaturas
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_faturas_updated_on ON public.faturas;
CREATE TRIGGER update_faturas_updated_on
BEFORE UPDATE ON public.faturas
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- 5. Trigger/Função: Gatilho de Gamificação (Desconto no Pagamento da Fatura)
-- Este trigger escuta os updates na tabela de Faturas. Se uma fatura for marcada como 'paga',
-- e o cliente da fatura tiver um despachante vinculado, o sistema checa a meta do despachante.

CREATE OR REPLACE FUNCTION check_meta_gamificacao()
RETURNS TRIGGER AS $$
DECLARE
    v_despachante_id UUID;
    v_qtd_pagos_mes INTEGER;
    v_meta INTEGER;
    v_desconto_perc NUMERIC;
    v_valor_base NUMERIC;
    v_novo_valor NUMERIC;
BEGIN
    -- Só roda se a fatura acabou de ser paga
    IF NEW.status = 'paga' AND OLD.status != 'paga' THEN
        
        -- O cliente que pagou a fatura está vinculado a algum despachante?
        SELECT despachante_id INTO v_despachante_id 
        FROM public.clientes 
        WHERE id = NEW.cliente_id;
        
        IF v_despachante_id IS NOT NULL THEN
            
            -- Pegar as regras globais
            SELECT meta_cac_desconto, percentual_desconto_meta, mensalidade_despachante 
            INTO v_meta, v_desconto_perc, v_valor_base
            FROM public.configuracoes_globais LIMIT 1;
            
            -- Quantos CACs deste despachante PAGARAM faturas neste mesmo mês/ano?
            -- Nota: Checamos se a fatura é de um CAC olhando o 'tipo_plano' na assinatura se necessário
            -- Aqui vamos contar apenas faturas pagas no mes atual
            SELECT count(*) INTO v_qtd_pagos_mes
            FROM public.faturas f
            JOIN public.clientes c ON c.id = f.cliente_id
            WHERE c.despachante_id = v_despachante_id
              AND f.status = 'paga'
              AND extract(month from f.data_pagamento) = extract(month from CURRENT_DATE)
              AND extract(year from f.data_pagamento) = extract(year from CURRENT_DATE);
              
            -- Se acabamos de bater RESTRITAMENTE a meta (ex: 10), aplica o desconto.
            -- Maior que 10 não executa para não dar desconto duplo.
            IF v_qtd_pagos_mes = v_meta THEN
                
                -- Calcula o novo valor
                v_novo_valor := v_valor_base - (v_valor_base * (v_desconto_perc / 100));
                
                -- Atualiza a assinatura do Despachante
                UPDATE public.assinaturas
                SET valor_recorrente = v_novo_valor
                WHERE cliente_id = v_despachante_id 
                  AND tipo_plano = 'despachante_base';
                  
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Anexar a trigger à tabela faturas
DROP TRIGGER IF EXISTS trigger_verificar_meta_desconto ON public.faturas;
CREATE TRIGGER trigger_verificar_meta_desconto
AFTER UPDATE ON public.faturas
FOR EACH ROW EXECUTE PROCEDURE check_meta_gamificacao();
