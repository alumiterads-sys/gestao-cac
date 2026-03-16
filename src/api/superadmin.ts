import { supabase } from '../supabase';
import type { Cliente } from '../types';

// Fetch all users (despachantes, CACs, and even other superadmins if needed)
export async function fetchAllUsers(): Promise<Cliente[]> {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('fetchAllUsers error:', error.message);
        return [];
    }

    return data || [];
}

// Toggle active status
export async function toggleUserStatus(userId: string, currentStatus: boolean): Promise<boolean> {
    const { error } = await supabase
        .from('clientes')
        .update({ ativo: !currentStatus })
        .eq('id', userId);

    if (error) {
        console.error('toggleUserStatus error:', error.message);
        return false;
    }

    return true;
}

// Get system stats
export async function getSuperAdminStats() {
    const { count: cacCount, error: cacError } = await supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user');

    const { count: dispCount, error: dispError } = await supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');

    const { count: inactiveCount, error: inError } = await supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('ativo', false);

    if (cacError) console.error('Error fetching CAC stats:', cacError.message);
    if (dispError) console.error('Error fetching Despachante stats:', dispError.message);
    if (inError) console.error('Error fetching Inactive stats:', inError.message);

    return {
        totalCacs: cacCount || 0,
        totalDespachantes: dispCount || 0,
        totalInactive: inactiveCount || 0,
    };
}

// Delete user (Full removal from database)
export async function deleteUser(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', userId);

    if (error) {
        console.error('deleteUser error:', error.message);
        return false;
    }
    return true;
}

// Create a new user from Super Admin panel
export async function createUser(userData: {
    nome: string;
    cpf: string;
    contato: string;
    email: string;
    role: 'admin' | 'user' | 'superadmin';
    senha_app: string;
}): Promise<{ success: boolean; error?: string }> {
    const cpfClean = userData.cpf.replace(/\D/g, '');

    // Check if CPF already exists
    const { data: existing } = await supabase
        .from('clientes')
        .select('id')
        .eq('cpf', cpfClean)
        .maybeSingle();

    if (existing) {
        return { success: false, error: 'CPF já cadastrado no sistema.' };
    }

    const { error } = await supabase.from('clientes').insert({
        nome: userData.nome,
        cpf: cpfClean,
        contato: userData.contato,
        email: userData.email || null,
        role: userData.role,
        senha_app: userData.senha_app,
        ativo: true
    });

    if (error) {
        console.error('createUser error:', error.message);
        return { success: false, error: 'Erro ao criar usuário no banco de dados.' };
    }

    return { success: true };
}
