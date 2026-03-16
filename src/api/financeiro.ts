import { supabase } from '../supabase';
import type { ConfiguracoesGlobais, Assinatura, Fatura } from '../types';

export const fetchConfiguracoesGlobais = async (): Promise<ConfiguracoesGlobais | null> => {
  try {
    const { data, error } = await supabase
      .from('configuracoes_globais')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching configuracoes globais:', error);
    return null;
  }
};

export const updateConfiguracoesGlobais = async (configId: string, updates: Partial<ConfiguracoesGlobais>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('configuracoes_globais')
      .update(updates)
      .eq('id', configId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating configuracoes globais:', error);
    return false;
  }
};

export const fetchAssinaturasDoUsuario = async (clienteId: string): Promise<Assinatura[]> => {
  try {
    const { data, error } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('cliente_id', clienteId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching assinaturas for client ${clienteId}:`, error);
    return [];
  }
};

export const fetchFaturasDoUsuario = async (clienteId: string): Promise<Fatura[]> => {
  try {
    const { data, error } = await supabase
      .from('faturas')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('data_vencimento', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching faturas for client ${clienteId}:`, error);
    return [];
  }
};

export const fetchTodasFaturasAbertas = async (): Promise<Fatura[]> => {
  try {
    const { data, error } = await supabase
      .from('faturas')
      .select(`*,
        clientes (
          nome,
          cpf
        )
      `)
      .eq('status', 'aberta')
      .order('data_vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching open faturas:', error);
    return [];
  }
};

export const createAssinatura = async (assinatura: Omit<Assinatura, 'id' | 'created_at' | 'updated_at'>): Promise<Assinatura | null> => {
    try {
        const { data, error } = await supabase
            .from('assinaturas')
            .insert([assinatura])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating assinatura:', error);
        return null;
    }
};

export const createFatura = async (fatura: Omit<Fatura, 'id' | 'created_at' | 'updated_at'>): Promise<Fatura | null> => {
    try {
        const { data, error } = await supabase
            .from('faturas')
            .insert([fatura])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating fatura:', error);
        return null;
    }
}
