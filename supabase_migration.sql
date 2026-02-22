-- ============================================================
-- SQL — Colunas extras para tabela `clientes` no Supabase
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/azwnzvnsvqkrmfsqwkkn/sql
-- ============================================================

-- 1. Senha da aplicação (login interno, separado do Supabase Auth)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS senha_app TEXT;

-- 2. Role do usuário: 'admin' = despachante, 'user' = CAC
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 3. Email (opcional)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. Atividades no CR (csv: "Atirador Desportivo,Caçador")
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS atividades_cr TEXT;

-- 5. Clube de tiro filiado
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS clube_filiado TEXT;

-- 6. Nível do atirador (1, 2 ou 3)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nivel_atirador TEXT;

-- 7. Observações gerais do perfil
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- ============================================================
-- Criar o usuário administrador (seu amigo)
-- AJUSTE o nome, cpf e senha conforme necessário
-- ============================================================
INSERT INTO clientes (nome, cpf, contato, role, senha_app)
VALUES ('Administrador', '00000000000', '', 'admin', 'admin123')
ON CONFLICT (cpf) DO NOTHING;

-- Verificar resultado:
-- SELECT id, nome, cpf, role FROM clientes;
