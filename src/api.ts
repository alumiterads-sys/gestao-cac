// ============================================================
// api.ts — Dados CAC via Supabase
// Armas → tabela crafs | Guias → tabela guias | IBAMA → tabela ibama + simaf
// O campo cliente_id referencia clientes.id
// ============================================================

import { supabase } from './supabase';
import type { Weapon, TrafficGuide, IbamaDoc, IbamaProperty } from './types';

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
