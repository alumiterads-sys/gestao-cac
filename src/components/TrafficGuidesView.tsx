import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { TrafficGuide, Weapon, TipoGuia } from '../types';
import { formatDateBR, isExpiringSoon, getDaysRemaining } from '../utils';

const TIPOS_GUIA: TipoGuia[] = ['Caça', 'Caça Treino', 'Caça Manutenção', 'Tiro Desportivo', 'Tiro Desportivo Manutenção'];

const isCacaGuia = (tipo?: string) => tipo?.includes('Caça');

// ─── Confirm Dialog ───────────────────────────────────────────
interface ConfirmDialogProps { message: string; onConfirm: () => void; onCancel: () => void; }
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) =>
    ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.78)' }}
            onClick={e => e.stopPropagation()}>
            <div className="glass-panel animate-fade-in border-danger" style={{ maxWidth: '30rem', width: '90%', padding: '2rem' }}>
                <p style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '1.8rem', lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <button className="btn btn-secondary text-danger border-danger" style={{ minWidth: '140px' }} onClick={onConfirm}>Sim, excluir</button>
                    <button className="btn btn-primary" style={{ minWidth: '140px' }} onClick={onCancel}>Cancelar</button>
                </div>
            </div>
        </div>,
        document.body
    );

// ─── GuideForm inline ─────────────────────────────────────────
interface GuideFormProps {
    data: Partial<TrafficGuide>;
    onChange: (field: keyof TrafficGuide, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
    estados: { sigla: string; nome: string }[];
    municipios: { nome: string }[];
    estado: string;
    cidade: string;
    onEstadoChange: (v: string) => void;
    onCidadeChange: (v: string) => void;
}
const GuideForm: React.FC<GuideFormProps> = ({
    data, onChange, onSubmit, onCancel, submitLabel,
    estados, municipios, estado, cidade, onEstadoChange, onCidadeChange
}) => (
    <form onSubmit={onSubmit} className="mt-3 p-4 bg-black bg-opacity-30 border border-accent-primary rounded-md animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
                <label className="text-sm font-bold block mb-1">Tipo de Guia *</label>
                <select required value={data.tipoGuia || ''} onChange={e => { onChange('tipoGuia', e.target.value); onEstadoChange(''); onCidadeChange(''); }}>
                    {TIPOS_GUIA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Vencimento *</label>
                <input type="date" required value={data.vencimentoGT || ''} onChange={e => onChange('vencimentoGT', e.target.value)} />
            </div>
            {isCacaGuia(data.tipoGuia) ? (
                <>
                    <div>
                        <label className="text-sm font-bold block mb-1">Estado (UF) *</label>
                        <select required value={estado} onChange={e => onEstadoChange(e.target.value)}>
                            <option value="" disabled>Selecione o Estado</option>
                            {estados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome} ({est.sigla})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-1">Município (Destino) *</label>
                        <select required value={cidade} onChange={e => onCidadeChange(e.target.value)} disabled={!estado || municipios.length === 0}>
                            <option value="" disabled>{estado ? 'Selecione o Município' : 'Selecione o Estado primeiro'}</option>
                            {municipios.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
                        </select>
                    </div>
                </>
            ) : (
                <div>
                    <label className="text-sm font-bold block mb-1">Destino *</label>
                    <input type="text" required placeholder="Ex: Clube de Tiro São Paulo - SP" value={data.destino || ''} onChange={e => onChange('destino', e.target.value)} />
                </div>
            )}
            <div className="md:col-span-3">
                <label className="text-sm font-bold block mb-1">Observações</label>
                <input type="text" placeholder="Opcional" value={data.observacoes || ''} onChange={e => onChange('observacoes', e.target.value)} />
            </div>
        </div>
        <div className="flex gap-3 mt-3">
            <button type="submit" className="btn btn-primary flex-1">{submitLabel}</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        </div>
    </form>
);

// ─── Props ────────────────────────────────────────────────────
interface TrafficGuidesViewProps {
    guides: TrafficGuide[];
    weapons: Weapon[];
    onAdd: (g: TrafficGuide) => void;
    onDelete: (id: string) => void;
    onUpdate: (g: TrafficGuide) => void;
}

// ─── TrafficGuidesView ────────────────────────────────────────
export const TrafficGuidesView: React.FC<TrafficGuidesViewProps> = ({
    guides, weapons, onAdd, onDelete, onUpdate
}) => {
    const [addingGuideForWeapon, setAddingGuideForWeapon] = useState<string | null>(null);
    const [newGuide, setNewGuide] = useState<Partial<TrafficGuide>>({ tipoGuia: 'Tiro Desportivo', vencimentoGT: '', destino: '', observacoes: '' });

    const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
    const [editGuide, setEditGuide] = useState<Partial<TrafficGuide>>({});

    const [confirmDeleteGuide, setConfirmDeleteGuide] = useState<string | null>(null);

    // Estado/Cidade para formulário de adição
    const [addEstados, setAddEstados] = useState<{ sigla: string; nome: string }[]>([]);
    const [addMunicipios, setAddMunicipios] = useState<{ nome: string }[]>([]);
    const [addEstado, setAddEstado] = useState('');
    const [addCidade, setAddCidade] = useState('');

    // Estado/Cidade para formulário de edição
    const [editEstados, setEditEstados] = useState<{ sigla: string; nome: string }[]>([]);
    const [editMunicipios, setEditMunicipios] = useState<{ nome: string }[]>([]);
    const [editEstado, setEditEstado] = useState('');
    const [editCidade, setEditCidade] = useState('');

    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(r => r.json()).then(data => { setAddEstados(data); setEditEstados(data); }).catch(() => { });
    }, []);

    useEffect(() => {
        if (addEstado) {
            setAddCidade('');
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${addEstado}/municipios?orderBy=nome`)
                .then(r => r.json()).then(setAddMunicipios).catch(() => { });
        } else setAddMunicipios([]);
    }, [addEstado]);

    useEffect(() => {
        if (editEstado) {
            setEditCidade('');
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${editEstado}/municipios?orderBy=nome`)
                .then(r => r.json()).then(setEditMunicipios).catch(() => { });
        } else setEditMunicipios([]);
    }, [editEstado]);

    const resolveDestino = (tipo: string | undefined, estado: string, cidade: string, fallback: string) =>
        isCacaGuia(tipo) ? (cidade && estado ? `${cidade} - ${estado}` : fallback) : fallback;

    const handleSaveGuide = (e: React.FormEvent) => {
        e.preventDefault();
        const g: TrafficGuide = {
            id: crypto.randomUUID(),
            weaponId: addingGuideForWeapon!,
            tipoGuia: newGuide.tipoGuia as TipoGuia,
            vencimentoGT: newGuide.vencimentoGT || '',
            destino: resolveDestino(newGuide.tipoGuia, addEstado, addCidade, newGuide.destino || ''),
            observacoes: newGuide.observacoes || ''
        };
        onAdd(g);
        setAddingGuideForWeapon(null);
        setNewGuide({ tipoGuia: 'Tiro Desportivo', vencimentoGT: '', destino: '', observacoes: '' });
        setAddEstado(''); setAddCidade('');
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        const original = guides.find(g => g.id === editingGuideId)!;
        const updated: TrafficGuide = {
            ...original,
            tipoGuia: editGuide.tipoGuia as TipoGuia || original.tipoGuia,
            vencimentoGT: editGuide.vencimentoGT || original.vencimentoGT,
            destino: resolveDestino(editGuide.tipoGuia, editEstado, editCidade, editGuide.destino || original.destino),
            observacoes: editGuide.observacoes ?? original.observacoes,
        };
        onUpdate(updated);
        setEditingGuideId(null);
        setEditEstado(''); setEditCidade('');
    };

    const doDeleteGuide = () => {
        if (confirmDeleteGuide) { onDelete(confirmDeleteGuide); setConfirmDeleteGuide(null); }
    };

    const startEdit = (gt: TrafficGuide) => {
        setEditingGuideId(gt.id);
        setEditGuide({ ...gt });
        setEditEstado('');
        setEditCidade('');
        setAddingGuideForWeapon(null);
    };

    return (
        <div className="p-4 animate-fade-in">
            {confirmDeleteGuide && (
                <ConfirmDialog
                    message="⚠️ Deseja realmente EXCLUIR esta Guia de Tráfego? Essa ação não pode ser desfeita."
                    onConfirm={doDeleteGuide}
                    onCancel={() => setConfirmDeleteGuide(null)}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Gerenciar Guias de Tráfego (GT)</h2>
            </div>

            <div className="flex flex-col gap-6">
                {weapons.length === 0 && (
                    <div className="text-center p-8 text-muted border border-dashed border-color-light rounded-md">
                        <span className="material-icons text-4xl mb-2 opacity-50">description</span>
                        <p>Você precisa cadastrar armas primeiro para poder emitir guias de tráfego.</p>
                    </div>
                )}

                {weapons.map(arma => {
                    const armaGuides = guides.filter(g => g.weaponId === arma.id);
                    const isAddingGuide = addingGuideForWeapon === arma.id;

                    return (
                        <div key={arma.id} className="glass-panel overflow-hidden">
                            {/* Cabeçalho da Arma */}
                            <div className="p-4 bg-black bg-opacity-30 border-b border-color-light flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <h4 className="font-bold text-lg leading-tight flex items-center gap-2">
                                        <span className="material-icons text-accent-primary">security</span>
                                        {arma.tipo} — {arma.modelo} ({arma.calibre})
                                    </h4>
                                    <p className="text-sm text-muted ml-8">Série: {arma.numeroSerie}</p>
                                </div>
                                <button className="btn btn-secondary text-sm"
                                    onClick={() => { setAddingGuideForWeapon(isAddingGuide ? null : arma.id); setEditingGuideId(null); }}>
                                    {isAddingGuide ? 'X Cancelar' : '+ Nova Guia de Tráfego'}
                                </button>
                            </div>

                            <div className="p-4">
                                {/* Formulário de adição */}
                                {isAddingGuide && (
                                    <GuideForm
                                        data={newGuide}
                                        onChange={(field, value) => setNewGuide(p => ({ ...p, [field]: value }))}
                                        onSubmit={handleSaveGuide}
                                        onCancel={() => { setAddingGuideForWeapon(null); setAddEstado(''); setAddCidade(''); }}
                                        submitLabel="Salvar Guia"
                                        estados={addEstados}
                                        municipios={addMunicipios}
                                        estado={addEstado}
                                        cidade={addCidade}
                                        onEstadoChange={setAddEstado}
                                        onCidadeChange={setAddCidade}
                                    />
                                )}

                                {armaGuides.length === 0 && !isAddingGuide ? (
                                    <p className="text-muted text-sm my-2 italic ml-2">Nenhuma guia registrada para esta arma.</p>
                                ) : (
                                    /* Grid 3 cards por linha */
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginTop: isAddingGuide ? '1rem' : '0' }}>
                                        {armaGuides.map(gt => {
                                            const gtAlert = isExpiringSoon(gt.vencimentoGT, 30);
                                            const dias = getDaysRemaining(gt.vencimentoGT);
                                            const isEditingThis = editingGuideId === gt.id;

                                            return (
                                                <div key={gt.id} style={{
                                                    padding: '1.25rem',
                                                    borderRadius: '1.5rem',
                                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                                    border: `2px solid ${gtAlert ? 'var(--danger)' : 'rgba(255,255,255,0.1)'}`,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.5rem'
                                                }}>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <strong className="text-accent-primary leading-tight">{gt.tipoGuia}</strong>
                                                        {gtAlert && <span className="badge badge-danger text-xs whitespace-nowrap ml-2">Vence em {dias}d</span>}
                                                    </div>

                                                    {isEditingThis ? (
                                                        <GuideForm
                                                            data={editGuide}
                                                            onChange={(field, value) => setEditGuide(p => ({ ...p, [field]: value }))}
                                                            onSubmit={handleSaveEdit}
                                                            onCancel={() => { setEditingGuideId(null); setEditEstado(''); setEditCidade(''); }}
                                                            submitLabel="💾 Salvar Alterações"
                                                            estados={editEstados}
                                                            municipios={editMunicipios}
                                                            estado={editEstado}
                                                            cidade={editCidade}
                                                            onEstadoChange={setEditEstado}
                                                            onCidadeChange={setEditCidade}
                                                        />
                                                    ) : (
                                                        <>
                                                            <div className="text-sm space-y-1 flex-grow">
                                                                <p className="flex items-center gap-2">
                                                                    <span className="material-icons text-[1rem] text-muted">event</span>
                                                                    <span className={`font-bold ${gtAlert ? 'text-danger' : 'text-success'}`}>
                                                                        {formatDateBR(gt.vencimentoGT)}
                                                                    </span>
                                                                </p>
                                                                <p className="flex items-start gap-2">
                                                                    <span className="material-icons text-[1rem] text-muted">route</span>
                                                                    <span><strong>Destino:</strong> {gt.destino}</span>
                                                                </p>
                                                                {gt.observacoes && (
                                                                    <p className="flex items-start gap-2">
                                                                        <span className="material-icons text-[1rem] text-muted">info</span>
                                                                        <span><strong>Obs:</strong> {gt.observacoes}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {/* Botões */}
                                                            <div className="flex gap-2 mt-auto pt-3 border-t border-color-light">
                                                                <button className="btn btn-secondary text-xs flex-1"
                                                                    onClick={() => startEdit(gt)}>
                                                                    ✏️ Editar
                                                                </button>
                                                                <button className="btn btn-secondary text-xs flex-1 text-danger border-danger"
                                                                    onClick={() => setConfirmDeleteGuide(gt.id)}>
                                                                    🗑 Excluir
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
