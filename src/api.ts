// ============================================================
// api.ts — Dados CAC via Supabase
// Armas → tabela crafs | Guias → tabela guias | IBAMA → tabela ibama + simaf
// O campo cliente_id referencia clientes.id
// ============================================================

import { supabase } from './supabase';
import type { Weapon, TrafficGuide, IbamaDoc, IbamaProperty, UserProfile, ServicoPreco, OrdemServico, ClienteAvulso, AvulsoCraf, AvulsoGuia, AvulsoSimaf } from './types';

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

export async function createWeapon(weapon: Weapon): Promise<string | true> {
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
    if (error) { console.error('createWeapon:', error.message); return error.message; }
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

export async function updateGuide(guide: TrafficGuide): Promise<boolean> {
    const { error } = await supabase.from('guias').update({
        arma_id: guide.weaponId || null,
        tipo_guia: guide.tipoGuia,
        data_vencimento: guide.vencimentoGT || null,
        destino: guide.destino || null,
        observacoes: guide.observacoes || null,
    }).eq('id', guide.id);
    if (error) { console.error('updateGuide:', error.message); return false; }
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
        ativo: data.ativo !== false, // Defaults to true if null
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

// ─── SERVIÇOS E PREÇOS (tabela: servicos_precos) ────────────────

export async function fetchServicosPrecos(dispatcherId: string): Promise<ServicoPreco[]> {
    const { data, error } = await supabase
        .from('servicos_precos')
        .select('*')
        .eq('dispatcher_id', dispatcherId)
        .order('created_at', { ascending: false });

    if (error) { console.error('fetchServicosPrecos:', error.message); return []; }
    return data || [];
}

export async function createServicoPreco(servico: Omit<ServicoPreco, 'id' | 'created_at'>): Promise<boolean> {
    const { error } = await supabase.from('servicos_precos').insert(servico);
    if (error) { console.error('createServicoPreco:', error.message); return false; }
    return true;
}

export async function updateServicoPreco(id: string, servico: Partial<Omit<ServicoPreco, 'id' | 'created_at' | 'dispatcher_id'>>): Promise<boolean> {
    const { error } = await supabase.from('servicos_precos').update(servico).eq('id', id);
    if (error) { console.error('updateServicoPreco:', error.message); return false; }
    return true;
}

export async function deleteServicoPreco(id: string): Promise<boolean> {
    const { error } = await supabase.from('servicos_precos').delete().eq('id', id);
    if (error) { console.error('deleteServicoPreco:', error.message); return false; }
    return true;
}


// ─── ORDENS DE SERVIÇO (tabela: ordens_servico) ─────────────────

export async function fetchOrdensServico(dispatcherId: string): Promise<OrdemServico[]> {
    const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('dispatcher_id', dispatcherId)
        .order('created_at', { ascending: false });

    if (error) { console.error('fetchOrdensServico:', error.message); return []; }

    if (!data || data.length === 0) return [];

    // Manually join local client names
    const cacIds = [...new Set(data.filter(os => os.cac_id).map(os => os.cac_id))];
    const avulsoIds = [...new Set(data.filter(os => os.cliente_avulso_id).map(os => os.cliente_avulso_id))];

    const promises = [];
    if (cacIds.length > 0) {
        promises.push(supabase.from('clientes').select('id, nome').in('id', cacIds));
    } else {
        promises.push(Promise.resolve({ data: [] }));
    }

    if (avulsoIds.length > 0) {
        promises.push(supabase.from('clientes_avulsos').select('id, nome').in('id', avulsoIds));
    } else {
        promises.push(Promise.resolve({ data: [] }));
    }

    const [cacProfilesResult, avulsosResult] = await Promise.all(promises);

    const profileMap = new Map();
    cacProfilesResult.data?.forEach(p => profileMap.set(p.id, p.nome));
    avulsosResult.data?.forEach(p => profileMap.set(p.id, p.nome + ' (Manual)'));

    return data.map(os => {
        const targetId = os.cac_id || os.cliente_avulso_id;
        return {
            ...os,
            cac_nome: profileMap.get(targetId) || 'Cliente Desconhecido'
        };
    });
}

export async function createOrdemServico(os: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at' | 'cac_nome'>): Promise<boolean> {
    const { error } = await supabase.from('ordens_servico').insert(os);
    if (error) { console.error('createOrdemServico:', error.message); return false; }
    return true;
}

export async function updateOrdemServico(id: string, osUpdate: Partial<Omit<OrdemServico, 'id' | 'created_at' | 'dispatcher_id' | 'cac_nome'>>): Promise<boolean> {
    const { error } = await supabase.from('ordens_servico').update({
        ...osUpdate,
        updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) { console.error('updateOrdemServico:', error.message); return false; }
    return true;
}

export async function deleteOrdemServico(id: string): Promise<boolean> {
    const { error } = await supabase.from('ordens_servico').delete().eq('id', id);
    if (error) { console.error('deleteOrdemServico:', error.message); return false; }
    return true;
}

// ─── DASHBOARD DESPACHANTE (Busca em Massa) ────────────────

export async function fetchClientsDashboardData(cacIds: string[]) {
    if (cacIds.length === 0) return { profiles: [], weapons: [], guides: [], ibamaDocs: [] };

    const [
        { data: profiles },
        { data: weapons },
        { data: guides },
        { data: ibamaDocs }
    ] = await Promise.all([
        supabase.from('clientes').select('id, nome, numero_cr, vencimento_cr').in('id', cacIds),
        supabase.from('crafs').select('id, cliente_id, fabricante, modelo_arma, vencimento_craf').in('cliente_id', cacIds),
        supabase.from('guias').select('id, cliente_id, arma_id, vencimento_gt:data_vencimento').in('cliente_id', cacIds),
        supabase.from('ibama').select('id, cliente_id, cr_ibama, venc_cr_ibama').in('cliente_id', cacIds)
    ]);

    return {
        profiles: profiles || [],
        weapons: weapons || [],
        guides: guides || [],
        ibamaDocs: ibamaDocs || []
    };
}

// ─── CLIENTES AVULSOS (Offline) ─────────────────────────────────

export async function fetchClientesAvulsos(dispatcherId: string): Promise<ClienteAvulso[]> {
    const { data, error } = await supabase
        .from('clientes_avulsos')
        .select('*')
        .eq('dispatcher_id', dispatcherId)
        .order('nome', { ascending: true });

    if (error) { console.error('fetchClientesAvulsos:', error.message); return []; }
    return data || [];
}

export async function createClienteAvulso(cliente: Omit<ClienteAvulso, 'id' | 'created_at'>): Promise<boolean> {
    const { error } = await supabase.from('clientes_avulsos').insert(cliente);
    if (error) { console.error('createClienteAvulso:', error.message); return false; }
    return true;
}

export async function deleteClienteAvulso(id: string): Promise<boolean> {
    const { error } = await supabase.from('clientes_avulsos').delete().eq('id', id);
    if (error) { console.error('deleteClienteAvulso:', error.message); return false; }
    return true;
}

// ─── DOCUMENTOS DE CLIENTES "SEM APP" ──────────────────────

// Armas
export async function fetchAvulsoCrafs(avulsoId: string): Promise<AvulsoCraf[]> {
    const { data, error } = await supabase.from('avulso_crafs').select('*').eq('avulso_id', avulsoId).order('created_at', { ascending: false });
    if (error) { console.error('fetchAvulsoCrafs:', error.message); return []; }
    return data || [];
}

export async function createAvulsoCraf(craf: Omit<AvulsoCraf, 'id' | 'created_at'>): Promise<string | true> {
    const { error } = await supabase.from('avulso_crafs').insert(craf);
    if (error) { console.error('createAvulsoCraf:', error.message); return error.message; }
    return true;
}

export async function deleteAvulsoCraf(id: string): Promise<boolean> {
    const { error } = await supabase.from('avulso_crafs').delete().eq('id', id);
    if (error) { console.error('deleteAvulsoCraf:', error.message); return false; }
    return true;
}

// Guias de Tráfego
export async function fetchAvulsoGuias(avulsoId: string): Promise<AvulsoGuia[]> {
    const { data, error } = await supabase.from('avulso_guias').select('*').eq('avulso_id', avulsoId).order('created_at', { ascending: false });
    if (error) { console.error('fetchAvulsoGuias:', error.message); return []; }
    return data || [];
}

export async function createAvulsoGuia(guia: Omit<AvulsoGuia, 'id' | 'created_at'>): Promise<boolean> {
    const { error } = await supabase.from('avulso_guias').insert(guia);
    if (error) { console.error('createAvulsoGuia:', error.message); return false; }
    return true;
}

export async function deleteAvulsoGuia(id: string): Promise<boolean> {
    const { error } = await supabase.from('avulso_guias').delete().eq('id', id);
    if (error) { console.error('deleteAvulsoGuia:', error.message); return false; }
    return true;
}

// SIMAF / IBAMA
export async function fetchAvulsoSimaf(avulsoId: string): Promise<AvulsoSimaf | null> {
    const { data, error } = await supabase.from('avulso_simaf').select('*').eq('avulso_id', avulsoId).maybeSingle();
    if (error) { console.error('fetchAvulsoSimaf:', error.message); return null; }
    return data || null;
}

export async function saveAvulsoSimaf(simaf: Omit<AvulsoSimaf, 'id' | 'created_at'>): Promise<boolean> {
    const { error } = await supabase.from('avulso_simaf').upsert(simaf, { onConflict: 'avulso_id' });
    if (error) { console.error('saveAvulsoSimaf:', error.message); return false; }
    return true;
}

// Update profile of a cliente_avulso
export async function updateClienteAvulso(id: string, data: Partial<Omit<ClienteAvulso, 'id' | 'created_at' | 'dispatcher_id'>>): Promise<boolean> {
    const { error } = await supabase.from('clientes_avulsos').update(data).eq('id', id);
    if (error) { console.error('updateClienteAvulso:', error.message); return false; }
    return true;
}
