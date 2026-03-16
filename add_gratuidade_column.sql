-- Execute este script no SQL Editor do Supabase para adicionar a flag de Gratuidade
-- Ela permite que usuários específicos não vejam a tela do Paywall.

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS gratuidade BOOLEAN DEFAULT FALSE;

-- O superadmin pode ler e editar essa coluna naturalmente devido as políticas já existentes, 
-- não é necessário recriar as policies da tabela clientes se o Super Admin já tem acesso total.
