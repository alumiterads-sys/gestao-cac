// ============================================================
// api.ts — Dados CAC via Supabase
// Armas → tabela crafs | Guias → tabela guias | IBAMA → tabela ibama + simaf
// O campo cliente_id referencia clientes.id
// ============================================================

import { supabase } from './supabase';
import type { Weapon, TrafficGuide, IbamaDoc, IbamaProperty, UserProfile } from './types';

// ─── WEAPONS (tabela: crafs) ────────────────────────────────

export async function fetchWeapons(userId: string): Promise<Weapon[]> {
    const { data, error } = await supabase
        .from('crafs')
        .select('*')
        .eq('cliente_id', userId);

    if (error) { console.error('fetchWeapons:', error.message); return []; }

    return (data || []).map(row => ({
        id: row.id,
        userId: row.cliente_id,
        tipo: row.tipo || '',
        fabricante: row.fabricante || '',
        modelo: row.modelo_arma || '',
        calibre: row.calibre || '',
        numeroSerie: row.n_serie || '',
        registroSistema: 'SIGMA',
        numeroSigma: row.n_sigma || '',
        tipoFuncionamento: row.tipo_funcionamento || 'Semi-Auto',
        vencimentoCRAF: row.vencimento_craf || '',
        tipoAcervo: row.acervo || 'Atirador',
        imageUrl: row.image_url || '',
    }));
}

export async function createWeapon(weapon: Weapon): Promise<boolean> {
    const { error } = await supabase.from('crafs').insert({
        id: weapon.id,
        cliente_id: weapon.userId,
        tipo: weapon.tipo,
        fabricante: weapon.fabricante,
        modelo_arma: weapon.modelo,
        calibre: weapon.calibre,
        n_serie: weapon.numeroSerie,
        n_sigma: weapon.numeroSigma || null,
        tipo_funcionamento: weapon.tipoFuncionamento,
        vencimento_craf: weapon.vencimentoCRAF || null,
        acervo: weapon.tipoAcervo,
        image_url: weapon.imageUrl || null,
    });
    if (error) { console.error('createWeapon:', error.message); return false; }
    return true;
}

export async function updateWeapon(weapon: Weapon): Promise<boolean> {
    const { error } = await supabase.from('crafs').update({
        tipo: weapon.tipo,
        fabricante: weapon.fabricante,
        modelo_arma: weapon.modelo,
        calibre: weapon.calibre,
        n_serie: weapon.numeroSerie,
        n_sigma: weapon.numeroSigma || null,
        tipo_funcionamento: weapon.tipoFuncionamento,
        vencimento_craf: weapon.vencimentoCRAF || null,
        acervo: weapon.tipoAcervo,
        image_url: weapon.imageUrl || null,
    }).eq('id', weapon.id);
    if (error) { console.error('updateWeapon:', error.message); return false; }
    return true;
}

export async function deleteWeapon(id: string): Promise<boolean> {
    const { error } = await supabase.from('crafs').delete().eq('id', id);
    if (error) { console.error('deleteWeapon:', error.message); return false; }
    return true;
}

// ─── GUIDES (tabela: guias) ─────────────────────────────────

export async function fetchGuides(userId: string): Promise<TrafficGuide[]> {
    const { data, error } = await supabase
        .from('guias')
        .select('*')
        .eq('cliente_id', userId);

    if (error) { console.error('fetchGuides:', error.message); return []; }

    return (data || []).map(row => ({
        id: row.id,
        weaponId: row.arma_id || '',
        tipoGuia: row.tipo_guia || '',
        vencimentoGT: row.data_vencimento || '',
        destino: row.destino || '',
        observacoes: row.observacoes || '',
    }));
}

export async function createGuide(guide: TrafficGuide): Promise<boolean> {
    const { error } = await supabase.from('guias').insert({
        id: guide.id,
        cliente_id: guide.userId,
        arma_id: guide.weaponId || null,
        arma_nome: guide.armaNome || null,
        tipo_guia: guide.tipoGuia,
        data_vencimento: guide.vencimentoGT || null,
        destino: guide.destino || null,
        observacoes: guide.observacoes || null,
    });
    if (error) { console.error('createGuide:', error.message); return false; }
    return true;
}

export async function deleteGuide(id: string): Promise<boolean> {
    const { error } = await supabase.from('guias').delete().eq('id', id);
    if (error) { console.error('deleteGuide:', error.message); return false; }
    return true;
}

// ─── IBAMA (tabela: ibama + simaf) ──────────────────────────

export async function fetchIbamaDoc(userId: string): Promise<IbamaDoc | null> {
    const { data: ibamaRow, error } = await supabase
        .from('ibama')
        .select('*')
        .eq('cliente_id', userId)
        .maybeSingle();

    if (error) { console.error('fetchIbamaDoc:', error.message); return null; }
    if (!ibamaRow) return null;

    // Busca propriedades SIMAF vinculadas ao cliente
    const { data: simafRows } = await supabase
        .from('simaf')
        .select('*')
        .eq('cliente_id', userId);

    const propriedades: IbamaProperty[] = (simafRows || []).map(row => ({
        id: row.id,
        proprietario: row.proprietario || '',
        nomeFazenda: row.fazenda || '',
        numeroCAR: row.n_car || '',
        estado: row.estado || '',
        municipio: row.cidade || '',
        vencimentoManejo: row.data_vencimento || '',
    }));

    return {
        id: ibamaRow.id,
        userId: ibamaRow.cliente_id,
        numeroCRIbama: ibamaRow.cr_ibama || '',
        vencimentoCR: ibamaRow.venc_cr_ibama || '',
        propriedades,
    };
}

export async function saveIbamaDoc(doc: IbamaDoc): Promise<boolean> {
    // Upsert do documento IBAMA principal
    const { error } = await supabase.from('ibama').upsert({
        id: doc.id,
        cliente_id: doc.userId,
        cr_ibama: doc.numeroCRIbama || null,
        venc_cr_ibama: doc.vencimentoCR || null,
    });
    if (error) { console.error('saveIbamaDoc:', error.message); return false; }
    return true;
}

// ─── IBAMA PROPERTIES (tabela: simaf) ───────────────────────

export async function createIbamaProperty(userId: string, prop: IbamaProperty): Promise<boolean> {
    const { error } = await supabase.from('simaf').insert({
        id: prop.id,
        cliente_id: userId,
        fazenda: prop.nomeFazenda,
        proprietario: prop.proprietario,
        cidade: prop.municipio,
        n_car: prop.numeroCAR,
        data_vencimento: prop.vencimentoManejo || null,
        observacoes: null,
    });
    if (error) { console.error('createIbamaProperty:', error.message); return false; }
    return true;
}

export async function updateIbamaProperty(prop: IbamaProperty): Promise<boolean> {
    const { error } = await supabase.from('simaf').update({
        fazenda: prop.nomeFazenda,
        proprietario: prop.proprietario,
        cidade: prop.municipio,
        n_car: prop.numeroCAR,
        data_vencimento: prop.vencimentoManejo || null,
    }).eq('id', prop.id);
    if (error) { console.error('updateIbamaProperty:', error.message); return false; }
    return true;
}

export async function deleteIbamaProperty(id: string): Promise<boolean> {
    const { error } = await supabase.from('simaf').delete().eq('id', id);
    if (error) { console.error('deleteIbamaProperty:', error.message); return false; }
    return true;
}

export async function fetchUserProfileById(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error || !data) {
        console.error('fetchUserProfileById:', error?.message);
        return null;
    }

    return {
        id: data.id,
        nome: data.nome,
        cpf: data.cpf,
        senhaGovBr: data.senha_gov_br || undefined,
        numeroCR: data.numero_cr || '',
        vencimentoCR: data.vencimento_cr || '',
        clubeFiliado: data.clube_filiado || undefined,
        telefone: data.telefone || '',
        role: data.role || 'user',
        atividadesCR: data.atividades_cr || [],
        nivelAtirador: data.nivel_atirador || undefined,
        observacoesGlobais: data.observacoes_globais || undefined,
    };
}

// ─── DESPACHANTE <-> CAC CONNECTIONS ──────────────────────────
// These calls hit the Supabase 'conexoes' and 'clientes' tables directly.

export async function searchUserByCpf(cpf: string) {
    const cleanCpf = cpf.replace(/\D/g, '');
    const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, cpf, role')
        .eq('cpf', cleanCpf)
        .maybeSingle();

    if (error || !data) {
        console.error('Error searching user:', error?.message);
        return null;
    }
    return data;
}

export async function createConnectionInvite(dispatcherId: string, cacId: string, initiatedBy: 'admin' | 'user'): Promise<boolean> {
    // Check if an active or pending connection already exists
    const { data: existing } = await supabase
        .from('conexoes')
        .select('id')
        .eq('dispatcher_id', dispatcherId)
        .eq('cac_id', cacId)
        .maybeSingle();

    if (existing) {
        console.error('Connection already exists or is pending');
        return false;
    }

    const status = initiatedBy === 'admin' ? 'pending_cac' : 'pending_dispatcher';

    const { error } = await supabase.from('conexoes').insert({
        id: `conn-${Date.now()}`,
        dispatcher_id: dispatcherId,
        cac_id: cacId,
        status: status
    });

    if (error) {
        console.error('Error sending invite:', error.message);
        return false;
    }
    return true;
}

export async function acceptConnectionInvite(connectionId: string): Promise<boolean> {
    const { error } = await supabase
        .from('conexoes')
        .update({ status: 'active' })
        .eq('id', connectionId);

    if (error) {
        console.error('Error accepting invite:', error.message);
        return false;
    }
    return true;
}

export async function deleteConnection(connectionId: string): Promise<boolean> {
    const { error } = await supabase
        .from('conexoes')
        .delete()
        .eq('id', connectionId);

    if (error) {
        console.error('Error deleting connection:', error.message);
        return false;
    }
    return true;
}

export async function fetchDispatcherConnections(dispatcherId: string) {
    // Fetch connections where dispatcher_id matches
    const { data: connectionsData, error: connError } = await supabase
        .from('conexoes')
        .select('*')
        .eq('dispatcher_id', dispatcherId);

    if (connError) {
        console.error('Error fetching dispatcher connections:', connError.message);
        return [];
    }

    if (!connectionsData || connectionsData.length === 0) return [];

    // Fetch details for all related CACs manually to mimic the JOIN
    const cacIds = connectionsData.map(c => c.cac_id);
    const { data: cacProfiles, error: profError } = await supabase
        .from('clientes')
        .select('id, nome, cpf')
        .in('id', cacIds);

    if (profError) {
        console.error('Error fetching profiles for connections:', profError.message);
    }

    const profileMap = new Map();
    cacProfiles?.forEach(p => profileMap.set(p.id, p));

    return connectionsData.map((conn: any) => {
        const profile = profileMap.get(conn.cac_id) || {};
        return {
            id: conn.id,
            dispatcherId: conn.dispatcher_id,
            cacId: conn.cac_id,
            status: conn.status,
            createdAt: conn.created_at,
            cacNome: profile.nome || 'Usuário Desconhecido',
            cacCpf: profile.cpf || ''
        };
    });
}

export async function fetchCacConnections(cacId: string) {
    // Fetch connections where cacId matches
    const { data: connectionsData, error: connError } = await supabase
        .from('conexoes')
        .select('*')
        .eq('cac_id', cacId);

    if (connError) {
        console.error('Error fetching CAC connections:', connError.message);
        return [];
    }

    if (!connectionsData || connectionsData.length === 0) return [];

    const dispatcherIds = connectionsData.map(c => c.dispatcher_id);
    const { data: dispProfiles, error: profError } = await supabase
        .from('clientes')
        .select('id, nome, cpf')
        .in('id', dispatcherIds);

    if (profError) {
        console.error('Error fetching profiles for dispatcher connections:', profError.message);
    }

    const profileMap = new Map();
    dispProfiles?.forEach(p => profileMap.set(p.id, p));

    return connectionsData.map((conn: any) => {
        const profile = profileMap.get(conn.dispatcher_id) || {};
        return {
            id: conn.id,
            dispatcherId: conn.dispatcher_id,
            cacId: conn.cac_id,
            status: conn.status,
            createdAt: conn.created_at,
            dispatcherNome: profile.nome || 'Despachante Desconhecido',
            dispatcherCpf: profile.cpf || ''
        };
    });
}
