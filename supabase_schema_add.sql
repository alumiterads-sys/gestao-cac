-- TABELA DE PREÇOS
CREATE TABLE tabela_precos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servico TEXT NOT NULL,
  taxas_gru DECIMAL(10,2),
  valor DECIMAL(10,2),
  observacoes TEXT,
  tipo_cliente TEXT -- 'Filiado' ou 'Não Filiado'
);
