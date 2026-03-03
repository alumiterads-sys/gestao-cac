import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { IbamaDoc, IbamaProperty } from '../types';
import { formatDateBR, isExpiringSoon, getDaysRemaining, addMonthsToDate } from '../utils';

interface IbamaViewProps {
    ibamaDoc: IbamaDoc;
    onUpdateDoc: (doc: IbamaDoc) => void;
    onAddProperty: (prop: IbamaProperty) => void;
    onUpdateProperty: (prop: IbamaProperty) => void;
    onDeleteProperty: (id: string) => void;
}

// ─── Confirm Dialog via Portal ──────────────────────────────────
const ConfirmDialog: React.FC<{ message: string; onConfirm: () => void; onCancel: () => void }> = ({ message, onConfirm, onCancel }) =>
    ReactDOM.createPortal(
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.78)' }}
            onClick={e => e.stopPropagation()}
        >
            <div className="glass-panel animate-fade-in border-danger" style={{ maxWidth: '30rem', width: '90%', padding: '2rem' }}>
                <p style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '1.8rem', lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <button className="btn btn-secondary text-danger border-danger" style={{ minWidth: '140px' }} onClick={onConfirm}>✅ Sim, excluir</button>
                    <button className="btn btn-primary" style={{ minWidth: '140px' }} onClick={onCancel}>❌ Cancelar</button>
                </div>
            </div>
        </div>,
        document.body
    );

const BLANK_PROP = (): Partial<IbamaProperty> => ({
    vencimentoManejo: addMonthsToDate(new Date(), 6)
});

// ─── Shared property form (forçado fora do pai para não perder foco) ───
const PropertyForm = ({
    data, setter, onSubmit, submitLabel, onCancel
}: {
    data: Partial<IbamaProperty>;
    setter: (v: Partial<IbamaProperty>) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    onCancel: () => void;
}) => {
    const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
    const [municipios, setMunicipios] = useState<{ nome: string }[]>([]);

    React.useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(res => res.json())
            .then(data => setEstados(data))
            .catch(console.error);
    }, []);

    React.useEffect(() => {
        if (data.estado) {
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${data.estado}/municipios?orderBy=nome`)
                .then(res => res.json())
                .then(data => setMunicipios(data))
                .catch(console.error);
        } else {
            setMunicipios([]);
        }
    }, [data.estado]);

    return (
        <form onSubmit={onSubmit} className="mb-6 p-4 bg-black bg-opacity-30 border border-success rounded-md animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="text-sm font-bold block mb-1">Proprietário da Área *</label>
                    <input type="text" required value={data.proprietario || ''} onChange={e => setter({ ...data, proprietario: e.target.value })} /></div>
                <div><label className="text-sm font-bold block mb-1">Nome da Fazenda *</label>
                    <input type="text" required value={data.nomeFazenda || ''} onChange={e => setter({ ...data, nomeFazenda: e.target.value })} /></div>
                <div><label className="text-sm font-bold block mb-1">Nº do CAR *</label>
                    <input type="text" required value={data.numeroCAR || ''} onChange={e => setter({ ...data, numeroCAR: e.target.value })} /></div>
                <div><label className="text-sm font-bold block mb-1">Estado (UF) *</label>
                    <select required value={data.estado || ''} onChange={e => setter({ ...data, estado: e.target.value, municipio: '' })}>
                        <option value="" disabled>Selecione um Estado</option>
                        {estados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome} ({est.sigla})</option>)}
                    </select></div>
                <div><label className="text-sm font-bold block mb-1">Município *</label>
                    <select required value={data.municipio || ''} onChange={e => setter({ ...data, municipio: e.target.value })} disabled={!data.estado || municipios.length === 0}>
                        <option value="" disabled>{data.estado ? 'Selecione um Município' : 'Selecione o Estado primeiro'}</option>
                        {municipios.map(mun => <option key={mun.nome} value={mun.nome}>{mun.nome}</option>)}
                    </select></div>
                <div><label className="text-sm font-bold block mb-1">Vencimento da Autorização *</label>
                    <input type="date" required value={data.vencimentoManejo || ''} onChange={e => setter({ ...data, vencimentoManejo: e.target.value })} /></div>
            </div>
            <div className="mt-4 flex gap-3 justify-end">
                <button type="submit" className="btn btn-primary px-8">{submitLabel}</button>
                <button type="button" className="btn btn-secondary px-6" onClick={onCancel}>Cancelar</button>
            </div>
        </form>
    );
};

export const IbamaView: React.FC<IbamaViewProps> = ({
    ibamaDoc,
    onUpdateDoc,
    onAddProperty,
    onUpdateProperty,
    onDeleteProperty
}) => {
    // ── CR IBAMA ─────────────────────────────────────────────────
    const [isEditingCR, setIsEditingCR] = useState(false);
    const [editCRNumero, setEditCRNumero] = useState(ibamaDoc.numeroCRIbama);
    const [editCRValidade, setEditCRValidade] = useState(ibamaDoc.vencimentoCR || addMonthsToDate(new Date(), 3));

    // ── Add property ──────────────────────────────────────────────
    const [isAddingProperty, setIsAddingProperty] = useState(false);
    const [newProp, setNewProp] = useState<Partial<IbamaProperty>>(BLANK_PROP());

    // ── Edit property ─────────────────────────────────────────────
    const [editingPropId, setEditingPropId] = useState<string | null>(null);
    const [editProp, setEditProp] = useState<Partial<IbamaProperty>>({});

    // ── Confirm delete ────────────────────────────────────────────
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // ── Handlers ─────────────────────────────────────────────────
    const handleSaveCR = () => {
        onUpdateDoc({ ...ibamaDoc, numeroCRIbama: editCRNumero, vencimentoCR: editCRValidade });
        setIsEditingCR(false);
    };

    const handleAddProperty = (e: React.FormEvent) => {
        e.preventDefault();
        const np: IbamaProperty = {
            id: crypto.randomUUID(),
            proprietario: newProp.proprietario || '',
            nomeFazenda: newProp.nomeFazenda || '',
            numeroCAR: newProp.numeroCAR || '',
            estado: newProp.estado || '',
            municipio: newProp.municipio || '',
            vencimentoManejo: newProp.vencimentoManejo || ''
        };
        onAddProperty(np);
        setIsAddingProperty(false);
        setNewProp(BLANK_PROP());
    };

    const handleSaveEditProperty = (e: React.FormEvent) => {
        e.preventDefault();
        const original = ibamaDoc.propriedades.find(p => p.id === editingPropId)!;
        const updated: IbamaProperty = {
            ...original,
            proprietario: editProp.proprietario || original.proprietario,
            nomeFazenda: editProp.nomeFazenda || original.nomeFazenda,
            numeroCAR: editProp.numeroCAR || original.numeroCAR,
            estado: editProp.estado || original.estado,
            municipio: editProp.municipio || original.municipio,
            vencimentoManejo: editProp.vencimentoManejo || original.vencimentoManejo
        };
        onUpdateProperty(updated);
        setEditingPropId(null);
    };

    const doDeleteProperty = () => {
        if (confirmDeleteId) {
            onDeleteProperty(confirmDeleteId);
            setConfirmDeleteId(null);
        }
    };



    // ── JSX ───────────────────────────────────────────────────────
    return (
        <div className="p-4 animate-fade-in mt-6" id="modulo-ibama">
            {/* Confirm dialog */}
            {confirmDeleteId && (
                <ConfirmDialog
                    message="⚠️ Tem certeza que deseja EXCLUIR esta Propriedade de Manejo? Essa ação não pode ser desfeita."
                    onConfirm={doDeleteProperty}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}

            <h2 className="section-title text-success mb-6">AUTORIZAÇÕES DE MANEJO DO IBAMA</h2>

            <div className="glass-panel p-6 border-success border-opacity-30">

                {/* ── CR IBAMA ─── */}
                <div className="mb-6 p-4 border border-color-light rounded-md bg-black bg-opacity-20">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-lg">CR IBAMA</h4>
                    </div>

                    {!isEditingCR ? (
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xl"><strong>Número do CR:</strong> {ibamaDoc.numeroCRIbama || 'Não informado'}</p>
                                {ibamaDoc.vencimentoCR && (
                                    <p className={`text-sm mt-1 ${isExpiringSoon(ibamaDoc.vencimentoCR, 30) ? 'text-danger font-bold' : 'text-muted'}`}>
                                        Validade: {formatDateBR(ibamaDoc.vencimentoCR)}
                                    </p>
                                )}
                            </div>
                            <button className="btn btn-secondary text-sm" onClick={() => { setEditCRNumero(ibamaDoc.numeroCRIbama); setEditCRValidade(ibamaDoc.vencimentoCR || ''); setIsEditingCR(true); }}>✏️ Editar CR</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 animate-fade-in mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                                <div>
                                    <label className="text-sm font-bold block mb-1">Nº do CR IBAMA</label>
                                    <input type="text" value={editCRNumero} onChange={e => setEditCRNumero(e.target.value)} placeholder="nº do CR" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold block mb-1">Data de Vencimento</label>
                                    <input type="date" value={editCRValidade} onChange={e => setEditCRValidade(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-primary" onClick={handleSaveCR}>Salvar</button>
                                <button className="btn btn-secondary" onClick={() => setIsEditingCR(false)}>Cancelar</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── PROPRIEDADES ─── */}
                <div className="flex justify-between items-center mb-4 mt-8 pt-4 border-t border-color-light">
                    <h3 className="text-xl font-bold">Propriedades Cadastradas</h3>
                    <button
                        className="btn btn-secondary text-xs"
                        onClick={() => { setIsAddingProperty(v => !v); setEditingPropId(null); }}
                    >
                        {isAddingProperty ? 'X Cancelar' : '+ Nova Propriedade de Manejo'}
                    </button>
                </div>

                {isAddingProperty && (
                    <PropertyForm
                        data={newProp}
                        setter={setNewProp}
                        onSubmit={handleAddProperty}
                        submitLabel="Gravar Propriedade"
                        onCancel={() => { setIsAddingProperty(false); setNewProp(BLANK_PROP()); }}
                    />
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                    {ibamaDoc.propriedades.length === 0 ? (
                        <p className="text-muted w-full">Nenhuma propriedade/autorização de manejo vinculada.</p>
                    ) : (
                        ibamaDoc.propriedades.map(prop => {
                            const isAlert = isExpiringSoon(prop.vencimentoManejo, 10);
                            const dias = getDaysRemaining(prop.vencimentoManejo);
                            const isEditingThis = editingPropId === prop.id;
                            return (
                                <div key={prop.id} style={{
                                    padding: '1.25rem',
                                    borderRadius: '1.5rem',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    border: `2px solid ${isAlert ? 'var(--danger)' : 'rgba(255, 255, 255, 0.1)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg leading-tight">{prop.nomeFazenda}</h4>
                                        {isAlert && <span className="badge badge-danger text-xs whitespace-nowrap ml-2">Vence em {dias} dias</span>}
                                    </div>

                                    {isEditingThis ? (
                                        <PropertyForm
                                            data={editProp}
                                            setter={setEditProp}
                                            onSubmit={handleSaveEditProperty}
                                            submitLabel="💾 Salvar Alterações"
                                            onCancel={() => setEditingPropId(null)}
                                        />
                                    ) : (
                                        <>
                                            <div className="text-sm space-y-1 mb-3 flex-grow">
                                                <p><strong>Proprietário:</strong> {prop.proprietario}</p>
                                                <p><strong>Nº do CAR:</strong> {prop.numeroCAR}</p>
                                                <p><strong>Município:</strong> {prop.estado ? `${prop.estado} - ` : ''}{prop.municipio}</p>
                                            </div>
                                            <div className="mt-auto border-t border-color-light pt-3">
                                                <p className={`font-bold text-sm mb-3 ${isAlert ? 'text-danger' : 'text-success'}`}>
                                                    Vencimento: {formatDateBR(prop.vencimentoManejo)}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-secondary text-xs flex-1"
                                                        onClick={() => { setEditingPropId(prop.id); setEditProp({ ...prop }); setIsAddingProperty(false); }}>
                                                        ✏️ Editar
                                                    </button>
                                                    <button className="btn btn-secondary text-xs text-danger border-danger flex-1"
                                                        onClick={() => setConfirmDeleteId(prop.id)}>
                                                        🗑 Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
