// ============================================================
// db.ts — Autenticação e Perfil via Supabase (tabela: clientes)
// O sistema usa CPF como identificador único e senha própria.
// A tabela `clientes` armazena todos os dados do usuário CAC.
// ============================================================

import { supabase } from './supabase';
import type { UserProfile } from './types';

// Mapeamento: clientes (Supabase) <-> UserProfile (frontend)
function rowToProfile(row: Record<string, unknown>): UserProfile {
    return {
        id: row.id as string,
        nome: row.nome as string,
        cpf: row.cpf as string,
        telefone: (row.contato as string) || '',
        email: (row.email as string) || '',
        senhaGovBr: (row.senha_gov as string) || '',
        numeroCR: (row.cr as string) || '',
        vencimentoCR: (row.cr_expiry as string) || '',
        atividadesCR: row.atividades_cr
            ? (row.atividades_cr as string).split(',').filter(Boolean)
            : [],
        clubeFiliado: (row.clube_filiado as string) || '',
        nivelAtirador: (row.nivel_atirador as '1' | '2' | '3') || undefined,
        observacoesGlobais: (row.observacoes as string) || '',
        role: (row.role as 'admin' | 'user') || 'user',
    };
}

/**
 * Registra novo cliente (usuário CAC) na tabela `clientes`.
 * Retorna `true` em sucesso, `false` se CPF já existir.
 */
export async function registerUser(profile: UserProfile, senha: string): Promise<boolean> {
    // Verifica duplicidade de CPF
    const { data: existing } = await supabase
        .from('clientes')
        .select('id')
        .eq('cpf', profile.cpf)
        .maybeSingle();

    if (existing) return false;

    const { error } = await supabase.from('clientes').insert({
        nome: profile.nome,
        cpf: profile.cpf,
        contato: profile.telefone,
        email: profile.email || null,
        senha_gov: profile.senhaGovBr,
        senha_app: senha,
        cr: profile.numeroCR || null,
        cr_expiry: profile.vencimentoCR || null,
        atividades_cr: profile.atividadesCR.join(','),
        clube_filiado: profile.clubeFiliado || null,
        nivel_atirador: profile.nivelAtirador || null,
        observacoes: profile.observacoesGlobais || null,
        role: 'user',
    });

    if (error) {
        console.error('Erro ao registrar usuário:', error.message);
        return false;
    }
    return true;
}

/**
 * Valida login com CPF + senha da aplicação.
 */
export async function validateLogin(
    cpf: string,
    senha: string
): Promise<{ profile: UserProfile | null; error?: string; code?: string }> {
    const cpfClean = cpf.replace(/\D/g, '');

    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cpf', cpfClean)
        .maybeSingle();

    if (error) {
        console.error('Erro ao buscar usuário:', error.message);
        return { profile: null, error: 'Erro de conexão', code: 'NETWORK_ERROR' };
    }

    if (!data) {
        return { profile: null, error: 'CPF não cadastrado.', code: 'NOT_FOUND' };
    }

    if (data.senha_app !== senha) {
        return { profile: null, error: 'Senha incorreta.', code: 'WRONG_PASSWORD' };
    }

    return { profile: rowToProfile(data) };
}

/**
 * Verifica se um CPF já está cadastrado.
 */
export async function isCpfRegistered(cpf: string): Promise<boolean> {
    const cpfClean = cpf.replace(/\D/g, '');
    const { data } = await supabase
        .from('clientes')
        .select('id')
        .eq('cpf', cpfClean)
        .maybeSingle();
    return !!data;
}

/**
 * Atualiza a senha de um usuário pelo CPF.
 */
export async function updateUserPassword(cpf: string, novaSenha: string): Promise<boolean> {
    const cpfClean = cpf.replace(/\D/g, '');
    const { error } = await supabase
        .from('clientes')
        .update({ senha_app: novaSenha })
        .eq('cpf', cpfClean);

    if (error) {
        console.error('Erro ao atualizar senha:', error.message);
        return false;
    }
    return true;
}

/**
 * Atualiza o perfil completo do usuário.
 */
export async function updateUserProfile(profile: UserProfile): Promise<boolean> {
    const { error } = await supabase
        .from('clientes')
        .update({
            nome: profile.nome,
            contato: profile.telefone,
            email: profile.email || null,
            senha_gov: profile.senhaGovBr,
            cr: profile.numeroCR || null,
            cr_expiry: profile.vencimentoCR || null,
            atividades_cr: profile.atividadesCR.join(','),
            clube_filiado: profile.clubeFiliado || null,
            nivel_atirador: profile.nivelAtirador || null,
            observacoes: profile.observacoesGlobais || null,
        })
        .eq('id', profile.id);

    if (error) {
        console.error('Erro ao atualizar perfil:', error.message);
        return false;
    }
    return true;
}
