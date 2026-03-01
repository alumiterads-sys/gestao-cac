import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { TrafficGuide, Weapon, TipoGuia } from '../types';
import { formatDateBR, isExpiringSoon } from '../utils';

const TIPOS_GUIA: TipoGuia[] = ['Caça', 'Caça Treino', 'Caça Manutenção', 'Tiro Desportivo', 'Tiro Desportivo Manutenção'];

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

interface TrafficGuidesViewProps {
    guides: TrafficGuide[];
    weapons: Weapon[];
    onAdd: (g: TrafficGuide) => void;
    onDelete: (id: string) => void;
}

export const TrafficGuidesView: React.FC<TrafficGuidesViewProps> = ({
    guides, weapons, onAdd, onDelete
}) => {
    const [addingGuideForWeapon, setAddingGuideForWeapon] = useState<string | null>(null);
    const [newGuide, setNewGuide] = useState<Partial<TrafficGuide>>({ tipoGuia: 'Tiro Desportivo', vencimentoGT: '', destino: '', observacoes: '' });
    const [confirmDeleteGuide, setConfirmDeleteGuide] = useState<string | null>(null);

    const handleSaveGuide = (e: React.FormEvent) => {
        e.preventDefault();
        const g: TrafficGuide = {
            id: `gt-${Date.now()}`,
            weaponId: addingGuideForWeapon!,
            tipoGuia: newGuide.tipoGuia as TipoGuia,
            vencimentoGT: newGuide.vencimentoGT || '',
            destino: newGuide.destino || '',
            observacoes: newGuide.observacoes || ''
        };
        onAdd(g);
        setAddingGuideForWeapon(null);
        setNewGuide({ tipoGuia: 'Tiro Desportivo', vencimentoGT: '', destino: '', observacoes: '' });
    };

    const doDeleteGuide = () => {
        if (confirmDeleteGuide) {
            onDelete(confirmDeleteGuide);
            setConfirmDeleteGuide(null);
        }
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
                            <div className="p-4 bg-black bg-opacity-30 border-b border-color-light flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <h4 className="font-bold text-lg leading-tight flex items-center gap-2">
                                        <span className="material-icons text-accent-primary">security</span>
                                        {arma.tipo} — {arma.modelo} ({arma.calibre})
                                    </h4>
                                    <p className="text-sm text-muted ml-8">Série: {arma.numeroSerie}</p>
                                </div>
                                <button className="btn btn-secondary text-sm"
                                    onClick={(e) => { e.stopPropagation(); setAddingGuideForWeapon(isAddingGuide ? null : arma.id); }}>
                                    {isAddingGuide ? 'X Cancelar Guia' : '+ Nova Guia de Tráfego'}
                                </button>
                            </div>

                            <div className="p-4">
                                {isAddingGuide && (
                                    <form onSubmit={handleSaveGuide} className="mb-6 p-4 bg-black bg-opacity-30 border border-accent-primary rounded-md animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="text-sm font-bold block mb-1">Tipo de Guia *</label>
                                                <select required value={newGuide.tipoGuia} onChange={e => setNewGuide(p => ({ ...p, tipoGuia: e.target.value as TipoGuia }))}>
                                                    {TIPOS_GUIA.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold block mb-1">Vencimento *</label>
                                                <input type="date" required value={newGuide.vencimentoGT} onChange={e => setNewGuide(p => ({ ...p, vencimentoGT: e.target.value }))} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-sm font-bold block mb-1">Destino *</label>
                                                <input type="text" required placeholder="Ex: Clube de Tiro São Paulo - SP" value={newGuide.destino} onChange={e => setNewGuide(p => ({ ...p, destino: e.target.value }))} />
                                            </div>
                                            <div className="md:col-span-4">
                                                <label className="text-sm font-bold block mb-1">Observações</label>
                                                <input type="text" placeholder="Opcional" value={newGuide.observacoes} onChange={e => setNewGuide(p => ({ ...p, observacoes: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button type="submit" className="btn btn-primary px-8">Salvar Guia</button>
                                        </div>
                                    </form>
                                )}

                                {armaGuides.length === 0 && !isAddingGuide ? (
                                    <p className="text-muted text-sm my-2 italic ml-2">Nenhuma guia registrada para esta arma.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {armaGuides.map((gt) => {
                                            const gtAlert = isExpiringSoon(gt.vencimentoGT, 15);
                                            // Zebra striping implemented via CSS child selectors or iterating logic
                                            return (
                                                <div key={gt.id} className={`p-4 border rounded-md relative overflow-hidden transition-colors duration-200
                                                    ${gtAlert ? 'border-danger bg-danger bg-opacity-10' : 'border-color-light bg-black bg-opacity-20 hover:bg-opacity-40'}
                                                `}>
                                                    <div className="flex justify-between flex-wrap gap-2 mb-3">
                                                        <strong className="text-lg text-accent-primary">{gt.tipoGuia}</strong>
                                                        <span className={`badge ${gtAlert ? 'badge-danger font-bold animate-pulse' : 'badge-success'}`}>
                                                            Vence: {formatDateBR(gt.vencimentoGT)}
                                                        </span>
                                                    </div>

                                                    <div className="text-sm space-y-2 text-gray-300">
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

                                                    <button
                                                        className="absolute top-2 right-2 text-muted hover:text-danger hover:bg-danger hover:bg-opacity-20 p-1 rounded transition-colors"
                                                        title="Excluir Guia"
                                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteGuide(gt.id); }}
                                                    >
                                                        <span className="material-icons text-sm">delete</span>
                                                    </button>
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
