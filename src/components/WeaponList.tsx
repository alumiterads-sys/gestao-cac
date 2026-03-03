import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import type { Weapon, TipoArma, Calibre, TipoAcervo } from '../types';
import { formatDateBR, isExpiringSoon, getClassificacaoCalibre } from '../utils';

const CALIBRES = ['.22 LR', '.380 ACP', '9mm', '.40 S&W', '.45 ACP', '.38 SPL', '.357 Mag', '12 GA', '5.56', '7.62', '.308 Win'];
const TIPOS_ARMA: TipoArma[] = ['Carabina/Fuzil', 'Revólver', 'Pistola', 'Pistolete', 'Espingarda'];
const TIPOS_ACERVO: TipoAcervo[] = ['Atirador', 'Caçador', 'Colecionador'];
const FABRICANTES = ['CBC', 'Colt', 'CZ', 'Glock', 'Imbel', 'Rossi', 'Smith & Wesson', 'Taurus', 'Winchester'];
const BLANK_WEAPON: Partial<Weapon> = { tipo: undefined, tipoFuncionamento: undefined, calibre: undefined, registroSistema: undefined, tipoAcervo: undefined, vencimentoCRAF: '', fabricante: undefined };

const getWeaponImage = (tipo?: string, modelo?: string, tipoFuncionamento?: string) => {
    const mod = modelo?.toLowerCase() || '';
    if (mod.includes('fuzil')) {
        if (tipoFuncionamento === 'Semi-Auto') return '/vetores/FUZIL SEMI AUTO.jpg';
        if (tipoFuncionamento === 'Repetição') return '/vetores/FUZIL DE REPETIÇÃO.jpg';
    }
    if (mod.includes('carabina')) return '/vetores/CARABINA PUMA.jpeg';
    if (mod.includes('rifle')) return '/vetores/RIFLE.png';

    if (tipo === 'Espingarda') return '/vetores/ESPINGARDA.png';
    if (tipo === 'Pistola') return '/vetores/PISTOLA.png';
    if (tipo === 'Pistolete') return '/vetores/PISTOLETE.png';

    return '/vetores/VETOR.png'; // Fallback genérico
};

interface ConfirmDialogProps { message: string; onConfirm: () => void; onCancel: () => void; }
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) =>
    ReactDOM.createPortal(
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.78)' }}
            onClick={e => e.stopPropagation()}
        >
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

interface WeaponFormProps {
    data: Partial<Weapon>;
    onChange: (field: keyof Weapon, value: string | undefined) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    onCancel: () => void;
    formId: string;
}

const WeaponForm: React.FC<WeaponFormProps> = ({
    data, onChange, onSubmit, submitLabel, onCancel, formId
}) => (
    <form onSubmit={onSubmit} className="mt-4 p-4 bg-black bg-opacity-30 border border-accent-primary rounded-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-color-light pb-4 mb-4">
            <div>
                <label className="text-sm font-bold block mb-1">Tipo de Funcionamento *</label>
                <select required value={data.tipoFuncionamento || ''} onChange={e => onChange('tipoFuncionamento', e.target.value)}>
                    <option value="" disabled>Selecione</option>
                    <option value="Repetição">Repetição</option>
                    <option value="Semi-Auto">Semi Auto</option>
                </select>
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Fabricante / Marca *</label>
                <select required value={data.fabricante && FABRICANTES.includes(data.fabricante) ? data.fabricante : (data.fabricante === 'Outro' ? 'Outro' : '')} onChange={e => {
                    if (e.target.value !== 'Outro') onChange('fabricante', e.target.value);
                    else onChange('fabricante', 'Outro');
                }}>
                    <option value="" disabled>Selecione</option>
                    {FABRICANTES.map(f => <option key={f} value={f}>{f}</option>)}
                    <option value="Outro">Outro / Digitar manualmente</option>
                </select>
                {(!FABRICANTES.includes(data.fabricante || '') && data.fabricante !== undefined) && (
                    <input type="text" className="mt-2 text-sm w-full" placeholder="Digite o fabricante" required value={data.fabricante || ''} onChange={e => onChange('fabricante', e.target.value)} />
                )}
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Modelo *</label>
                <input type="text" required value={data.modelo || ''} onChange={e => onChange('modelo', e.target.value)} />
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Tipo da Arma *</label>
                <select required value={data.tipo || ''} onChange={e => onChange('tipo', e.target.value)}>
                    <option value="" disabled>Selecione</option>
                    {TIPOS_ARMA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Calibre *</label>
                <select required value={data.calibre || ''} onChange={e => onChange('calibre', e.target.value)}>
                    <option value="" disabled>Selecione</option>
                    {CALIBRES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Nº de Série *</label>
                <input type="text" required value={data.numeroSerie || ''} onChange={e => onChange('numeroSerie', e.target.value)} />
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Acervo *</label>
                <select required value={data.tipoAcervo || ''} onChange={e => onChange('tipoAcervo', e.target.value)}>
                    <option value="" disabled>Selecione</option>
                    {TIPOS_ACERVO.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Vencimento CRAF *</label>
                <input type="date" required value={data.vencimentoCRAF || ''} onChange={e => onChange('vencimentoCRAF', e.target.value)} />
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Sistema de Registro *</label>
                <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`sis_${formId}`} checked={data.registroSistema === 'SIGMA'} onChange={() => onChange('registroSistema', 'SIGMA')} /> SIGMA
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`sis_${formId}`} checked={data.registroSistema === 'SINARM'} onChange={() => onChange('registroSistema', 'SINARM')} /> SINARM
                    </label>
                </div>
            </div>
            {data.registroSistema === 'SIGMA' && (
                <div>
                    <label className="text-sm font-bold block mb-1">Nº SIGMA</label>
                    <input type="text" value={data.numeroSigma || ''} onChange={e => onChange('numeroSigma', e.target.value)} />
                </div>
            )}
            {data.registroSistema === 'SINARM' && (
                <div>
                    <label className="text-sm font-bold block mb-1">Nº SINARM</label>
                    <input type="text" value={data.numeroSinarm || ''} onChange={e => onChange('numeroSinarm', e.target.value)} />
                </div>
            )}
        </div>

        <div className="flex gap-3 mt-5">
            <button type="submit" className="btn btn-primary flex-1 py-3">{submitLabel}</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        </div>
    </form>
);

interface WeaponListProps {
    weapons: Weapon[];
    onAdd: (w: Weapon) => void;
    onUpdate: (w: Weapon) => void;
    onDelete: (id: string) => void;
}

export const WeaponList: React.FC<WeaponListProps> = ({
    weapons, onAdd, onUpdate, onDelete
}) => {
    const [expandedWeaponId, setExpandedWeaponId] = useState<string | null>(null);
    const [isAddingWeapon, setIsAddingWeapon] = useState(false);
    const [newWeapon, setNewWeapon] = useState<Partial<Weapon>>(BLANK_WEAPON);
    const [editingWeaponId, setEditingWeaponId] = useState<string | null>(null);
    const [editWeapon, setEditWeapon] = useState<Partial<Weapon>>({});
    const [confirmDeleteWeapon, setConfirmDeleteWeapon] = useState<string | null>(null);

    const handleNewWeaponChange = useCallback((field: keyof Weapon, value: string | undefined) => {
        setNewWeapon(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleEditWeaponChange = useCallback((field: keyof Weapon, value: string | undefined) => {
        setEditWeapon(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleAddWeapon = (e: React.FormEvent) => {
        e.preventDefault();
        const w: Weapon = {
            id: crypto.randomUUID(),
            userId: '0', // Set in App.tsx typically, but keeping interface clean
            tipo: newWeapon.tipo as TipoArma,
            fabricante: newWeapon.fabricante || '',
            modelo: newWeapon.modelo || '',
            calibre: newWeapon.calibre as Calibre,
            numeroSerie: newWeapon.numeroSerie || '',
            registroSistema: newWeapon.registroSistema as 'SIGMA' | 'SINARM',
            numeroSigma: newWeapon.registroSistema === 'SIGMA' ? newWeapon.numeroSigma : undefined,
            numeroSinarm: newWeapon.registroSistema === 'SINARM' ? newWeapon.numeroSinarm : undefined,
            tipoFuncionamento: newWeapon.tipoFuncionamento as 'Repetição' | 'Semi-Auto',
            vencimentoCRAF: newWeapon.vencimentoCRAF || '',
            tipoAcervo: newWeapon.tipoAcervo as TipoAcervo,
            imageUrl: newWeapon.imageUrl
        };
        onAdd(w);
        setIsAddingWeapon(false);
        setNewWeapon(BLANK_WEAPON);
    };

    const handleSaveEditWeapon = (e: React.FormEvent) => {
        e.preventDefault();
        const original = weapons.find(w => w.id === editingWeaponId)!;
        const updated: Weapon = {
            ...original,
            tipo: editWeapon.tipo as TipoArma || original.tipo,
            fabricante: editWeapon.fabricante ?? original.fabricante,
            modelo: editWeapon.modelo ?? original.modelo,
            calibre: editWeapon.calibre as Calibre || original.calibre,
            numeroSerie: editWeapon.numeroSerie ?? original.numeroSerie,
            registroSistema: (editWeapon.registroSistema as 'SIGMA' | 'SINARM') || original.registroSistema,
            numeroSigma: editWeapon.registroSistema === 'SIGMA' ? editWeapon.numeroSigma : undefined,
            numeroSinarm: editWeapon.registroSistema === 'SINARM' ? editWeapon.numeroSinarm : undefined,
            tipoFuncionamento: editWeapon.tipoFuncionamento as 'Repetição' | 'Semi-Auto' || original.tipoFuncionamento,
            vencimentoCRAF: editWeapon.vencimentoCRAF ?? original.vencimentoCRAF,
            tipoAcervo: editWeapon.tipoAcervo as TipoAcervo || original.tipoAcervo,
            imageUrl: editWeapon.imageUrl ?? original.imageUrl
        };
        onUpdate(updated);
        setEditingWeaponId(null);
    };

    const doDeleteWeapon = () => {
        if (confirmDeleteWeapon) {
            onDelete(confirmDeleteWeapon);
            setConfirmDeleteWeapon(null);
            setExpandedWeaponId(null);
        }
    };

    return (
        <div className="p-4 animate-fade-in">
            {confirmDeleteWeapon && (
                <ConfirmDialog
                    message="⚠️ Tem certeza que deseja EXCLUIR esta arma do acervo? Essa ação não pode ser desfeita."
                    onConfirm={doDeleteWeapon}
                    onCancel={() => setConfirmDeleteWeapon(null)}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Gerenciar Acervo de Armas</h2>
                <button className="btn btn-primary text-sm"
                    onClick={() => { setIsAddingWeapon(v => !v); setNewWeapon({ ...BLANK_WEAPON }); }}>
                    {isAddingWeapon ? 'X Cancelar' : '+ Inserir Nova Arma'}
                </button>
            </div>

            {isAddingWeapon && (
                <div className="glass-panel p-5 mb-6 animate-fade-in border-accent-primary">
                    <h3 className="font-bold text-lg mb-2">Cadastro de Nova Arma</h3>
                    <WeaponForm
                        data={newWeapon}
                        onChange={handleNewWeaponChange}
                        onSubmit={handleAddWeapon}
                        submitLabel="Salvar Nova Arma"
                        onCancel={() => { setIsAddingWeapon(false); setNewWeapon({ ...BLANK_WEAPON }); }}
                        formId="new"
                    />
                </div>
            )}

            <div className="flex flex-col gap-4">
                {weapons.length === 0 && (
                    <div className="text-center p-8 text-muted border border-dashed border-color-light rounded-md mt-4">
                        <span className="material-icons text-4xl mb-2 opacity-50">security</span>
                        <p>Nenhuma arma cadastrada neste acervo.</p>
                        <p className="text-sm mt-2">Clique no botão acima para adicionar sua primeira arma.</p>
                    </div>
                )}
                {weapons.map(arma => {
                    const isExpanded = expandedWeaponId === arma.id;
                    const crafAlert = isExpiringSoon(arma.vencimentoCRAF, 60);
                    const isEditing = editingWeaponId === arma.id;
                    const classsificacao = getClassificacaoCalibre(arma.calibre, arma.tipo, arma.modelo, arma.tipoFuncionamento);

                    return (
                        <div key={arma.id} className={`glass-panel overflow-hidden transition-all duration-300 ${isExpanded ? 'border-accent-primary' : ''}`}>
                            <div className={`p-4 cursor-pointer flex justify-between items-center flex-wrap gap-4 ${isExpanded ? 'bg-black bg-opacity-20' : ''}`}
                                onClick={() => { setExpandedWeaponId(prev => prev === arma.id ? null : arma.id); setEditingWeaponId(null); }}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div
                                        className="rounded overflow-hidden flex-shrink-0 flex items-center w-[100px] h-[100px] justify-center bg-white border border-color-light"
                                        style={{ width: '100px', height: '100px', minWidth: '100px', minHeight: '100px', padding: '2px' }}
                                    >
                                        <img src={getWeaponImage(arma.tipo, arma.modelo, arma.tipoFuncionamento)} alt="Arma"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg leading-tight flex items-center gap-2 flex-wrap">
                                            {arma.tipo} — {arma.fabricante} {arma.modelo} ({arma.calibre})
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${classsificacao === 'Permitido' ? 'border-success text-success' : 'border-danger text-danger'}`}>
                                                USO {classsificacao.toUpperCase()}
                                            </span>
                                        </h4>
                                        <p className="text-sm text-muted">ACERVO: {arma.tipoAcervo} | {arma.registroSistema}: {arma.numeroSigma || arma.numeroSinarm}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${crafAlert ? 'badge-danger' : 'badge-success'}`}>
                                        CRAF: {formatDateBR(arma.vencimentoCRAF)} {crafAlert ? '(Vence Logo!)' : ''}
                                    </span>
                                    <span className="text-muted text-lg">{isExpanded ? '▼' : '▶'}</span>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-color-light animate-fade-in p-4 bg-black bg-opacity-20">
                                    <div className="flex justify-end gap-2 mb-3">
                                        <button className="btn btn-secondary text-sm"
                                            onClick={e => {
                                                e.stopPropagation();
                                                if (isEditing) { setEditingWeaponId(null); }
                                                else { setEditingWeaponId(arma.id); setEditWeapon({ ...arma }); }
                                            }}>
                                            {isEditing ? 'Cancelar Edição' : '✏️ Editar Arma'}
                                        </button>
                                        <button className="btn btn-secondary text-sm text-danger border-danger"
                                            onClick={e => { e.stopPropagation(); setConfirmDeleteWeapon(arma.id); }}>
                                            🗑 Excluir Arma
                                        </button>
                                    </div>

                                    {isEditing ? (
                                        <WeaponForm
                                            data={editWeapon}
                                            onChange={handleEditWeaponChange}
                                            onSubmit={handleSaveEditWeapon}
                                            submitLabel="Salvar Alterações"
                                            onCancel={() => { setEditingWeaponId(null); }}
                                            formId={`edit-${arma.id}`}
                                        />
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-color-light">
                                            <div><span className="text-xs text-muted block">Série</span><span className="font-bold">{arma.numeroSerie}</span></div>
                                            <div><span className="text-xs text-muted block">Funcionamento</span><span className="font-bold">{arma.tipoFuncionamento}</span></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
