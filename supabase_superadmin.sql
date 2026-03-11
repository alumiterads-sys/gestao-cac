-- ============================================================
-- SQL — Atualização para Super Admin e bloqueio de inativos
-- ============================================================

-- 1. Adicionar coluna 'ativo' na tabela clientes (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clientes' AND column_name='ativo') THEN
        ALTER TABLE clientes ADD COLUMN ativo BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Atualizar constraint de 'role' na tabela clientes para permitir 'superadmin'
-- O Supabase geralmente não usa ENUM puro por padrão, mas CHECK constraint.
-- Se houver uma constraint existente, precisamos removê-la e recriá-la.
-- Abaixo tentamos remover uma possível constraint (o nome pode variar, geralmente é clientes_role_check).
DO $$
BEGIN
    -- Substitua 'clientes_role_check' pelo nome exato da sua constraint se houver erro
    ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_role_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

ALTER TABLE clientes ADD CONSTRAINT clientes_role_check CHECK (role IN ('admin', 'user', 'superadmin'));

-- 3. (Opcional) Criar seu usuário superadmin. 
-- Substitua 'seu-email@exemplo.com' pelo seu e-mail de teste real, se quiser fazer isso via SQL
-- UPDATE clientes SET role = 'superadmin' WHERE contato = 'seu-email@exemplo.com';
