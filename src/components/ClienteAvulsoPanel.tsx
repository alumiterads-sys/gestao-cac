import React, { useState, useEffect } from 'react';
import type { ClienteAvulso, AvulsoCraf, AvulsoGuia } from '../types';
import {
    fetchAvulsoCrafs, createAvulsoCraf, deleteAvulsoCraf,
    fetchAvulsoGuias, createAvulsoGuia, deleteAvulsoGuia,
    fetchAvulsoSimaf, saveAvulsoSimaf, updateClienteAvulso
} from '../api';
import { formatDateBR, isExpiringSoon, getDaysRemaining } from '../utils';

interface ClienteAvulsoPanelProps {
    cliente: ClienteAvulso;
    onClose: () => void;
    onUpdated: () => void;
    embeddedMode?: boolean;
}

export const ClienteAvulsoPanel: React.FC<ClienteAvulsoPanelProps> = ({ cliente, onClose, onUpdated, embeddedMode = false }) => {
    const [activeTab, setActiveTab] = useState<'perfil' | 'armas' | 'guias' | 'simaf'>('perfil');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Perfil
    const [nome, setNome] = useState(cliente.nome);
    const [cpf, setCpf] = useState(cliente.cpf || '');
    const [telefone, setTelefone] = useState(cliente.telefone || '');
    const [senha, setSenha] = useState(cliente.senha_gov_br || '');

    // Armas
    const [crafs, setCrafs] = useState<AvulsoCraf[]>([]);
    const [showAddArma, setShowAddArma] = useState(false);
    const [arTipo, setArTipo] = useState('');
    const [arFabricante, setArFabricante] = useState('');
    const [arModelo, setArModelo] = useState('');
    const [arCalibre, setArCalibre] = useState('');
    const [arNSerie, setArNSerie] = useState('');
    const [arNSigma, setArNSigma] = useState('');
    const [arFuncionamento, setArFuncionamento] = useState('Semi-Auto');
    const [arVencCraf, setArVencCraf] = useState('');
    const [arAcervo, setArAcervo] = useState('Atirador');

    // Guias
    const [guias, setGuias] = useState<AvulsoGuia[]>([]);
    const [showAddGuia, setShowAddGuia] = useState(false);
    const [gtNumero, setGtNumero] = useState('');
    const [gtEmissao, setGtEmissao] = useState('');
    const [gtVencimento, setGtVencimento] = useState('');
    const [gtOrigem, setGtOrigem] = useState('');
    const [gtDestino, setGtDestino] = useState('');

    // SIMAF
    const [simafCr, setSimafCr] = useState('');
    const [simafVenc, setSimafVenc] = useState('');

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const loadData = async () => {
        setIsLoading(true);
        const [crafsData, guiasData, simafData] = await Promise.all([
            fetchAvulsoCrafs(cliente.id),
            fetchAvulsoGuias(cliente.id),
            fetchAvulsoSimaf(cliente.id)
        ]);
        setCrafs(crafsData);
        setGuias(guiasData);
        if (simafData) {
            setSimafCr(simafData.cr_ibama || '');
            setSimafVenc(simafData.venc_cr_ibama || '');
        } else {
            setSimafCr('');
            setSimafVenc('');
        }
        setIsLoading(false);
    };

    useEffect(() => { loadData(); }, [cliente.id]);

    const handleSavePerfil = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const ok = await updateClienteAvulso(cliente.id, { nome, cpf, telefone, senha_gov_br: senha });
        if (ok) { showMessage('Dados salvos com sucesso!', 'success'); onUpdated(); }
        else showMessage('Erro ao salvar dados.', 'error');
        setIsLoading(false);
    };

    const handleAddArma = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const result = await createAvulsoCraf({
            avulso_id: cliente.id, tipo: arTipo, fabricante: arFabricante, modelo_arma: arModelo,
            calibre: arCalibre, n_serie: arNSerie, n_sigma: arNSigma, tipo_funcionamento: arFuncionamento,
            vencimento_craf: arVencCraf || undefined, acervo: arAcervo
        });
        if (result === true) {
            showMessage('Arma adicionada!', 'success');
            setShowAddArma(false);
            setArTipo(''); setArFabricante(''); setArModelo(''); setArCalibre(''); setArNSerie(''); setArNSigma(''); setArVencCraf('');
            loadData();
        } else {
            showMessage(`Erro ao adicionar arma: ${result}`, 'error');
        }
        setIsLoading(false);
    };

    const handleDeleteArma = async (id: string) => {
        if (!window.confirm('Excluir esta arma do cadastro?')) return;
        await deleteAvulsoCraf(id);
        loadData();
    };

    const handleAddGuia = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const ok = await createAvulsoGuia({
            avulso_id: cliente.id, n_guia: gtNumero, data_emissao: gtEmissao || undefined,
            vencimento_gt: gtVencimento || undefined, origem: gtOrigem, destino: gtDestino
        });
        if (ok) {
            showMessage('Guia adicionada!', 'success');
            setShowAddGuia(false);
            setGtNumero(''); setGtEmissao(''); setGtVencimento(''); setGtOrigem(''); setGtDestino('');
            loadData();
        } else {
            showMessage('Erro ao adicionar guia.', 'error');
        }
        setIsLoading(false);
    };

    const handleDeleteGuia = async (id: string) => {
        if (!window.confirm('Excluir esta guia?')) return;
        await deleteAvulsoGuia(id);
        loadData();
    };

    const handleSaveSimaf = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const ok = await saveAvulsoSimaf({ avulso_id: cliente.id, cr_ibama: simafCr, venc_cr_ibama: simafVenc || undefined });
        if (ok) { showMessage('SIMAF salvo!', 'success'); loadData(); }
        else showMessage('Erro ao salvar SIMAF.', 'error');
        setIsLoading(false);
    };

    const tabClass = (t: string) =>
        `px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === t ? 'border-accent-primary text-accent-primary' : 'border-transparent text-muted hover:text-white'}`;

    const content = (
        <div className="flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-color-light px-4">
                <button className={tabClass('perfil')} onClick={() => setActiveTab('perfil')}>
                    <span className="material-icons text-sm align-middle mr-1">person</span>Dados Pessoais
                </button>
                <button className={tabClass('armas')} onClick={() => setActiveTab('armas')}>
                    <span className="material-icons text-sm align-middle mr-1">military_tech</span>Armas ({crafs.length})
                </button>
                <button className={tabClass('guias')} onClick={() => setActiveTab('guias')}>
                    <span className="material-icons text-sm align-middle mr-1">description</span>Guias ({guias.length})
                </button>
                <button className={tabClass('simaf')} onClick={() => setActiveTab('simaf')}>
                    <span className="material-icons text-sm align-middle mr-1">eco</span>SIMAF
                </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-4">
                {message.text && (
                    <div className={`p-3 rounded-md border text-sm ${message.type === 'success' ? 'bg-success bg-opacity-20 text-success border-success' : 'bg-danger bg-opacity-20 text-danger border-danger'}`}>
                        {message.text}
                    </div>
                )}

                {/* PERFIL */}
                {activeTab === 'perfil' && (
                    <form onSubmit={handleSavePerfil} className="flex flex-col gap-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold block mb-1">Nome Completo *</label>
                                <input type="text" className="w-full" required value={nome} onChange={e => setNome(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-bold block mb-1">CPF</label>
                                <input type="text" className="w-full" value={cpf} onChange={e => setCpf(e.target.value.replace(/\D/g, ''))} placeholder="Apenas números" />
                            </div>
                            <div>
                                <label className="text-sm font-bold block mb-1">Telefone / WhatsApp</label>
                                <input type="text" className="w-full" value={telefone} onChange={e => setTelefone(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-bold block mb-1 text-warning">Senha Gov.br (Opcional)</label>
                                <input type="text" className="w-full" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Para gestão de processos" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                <span className="material-icons mr-1 text-sm">save</span>Salvar Dados
                            </button>
                        </div>
                    </form>
                )}

                {/* ARMAS */}
                {activeTab === 'armas' && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                        <div className="flex justify-end">
                            <button className="btn btn-secondary text-sm" onClick={() => setShowAddArma(!showAddArma)}>
                                {showAddArma ? 'Cancelar' : '➕ Adicionar Arma'}
                            </button>
                        </div>

                        {showAddArma && (
                            <form onSubmit={handleAddArma} className="glass-panel p-4 flex flex-col gap-4 border-l-4 border-l-accent-primary animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Tipo</label>
                                        <select className="w-full bg-black bg-opacity-50" value={arTipo} onChange={e => setArTipo(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            <option>Pistola</option><option>Revólver</option><option>Espingarda</option>
                                            <option>Carabina/Fuzil</option><option>Rifle</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Fabricante *</label>
                                        <input type="text" className="w-full" required value={arFabricante} onChange={e => setArFabricante(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Modelo *</label>
                                        <input type="text" className="w-full" required value={arModelo} onChange={e => setArModelo(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Calibre</label>
                                        <input type="text" className="w-full" value={arCalibre} onChange={e => setArCalibre(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Nº de Série</label>
                                        <input type="text" className="w-full" value={arNSerie} onChange={e => setArNSerie(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Nº SIGMA</label>
                                        <input type="text" className="w-full" value={arNSigma} onChange={e => setArNSigma(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Funcionamento</label>
                                        <select className="w-full bg-black bg-opacity-50" value={arFuncionamento} onChange={e => setArFuncionamento(e.target.value)}>
                                            <option>Semi-Auto</option><option>Repetição</option><option>Espingarda</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Acervo</label>
                                        <select className="w-full bg-black bg-opacity-50" value={arAcervo} onChange={e => setArAcervo(e.target.value)}>
                                            <option>Atirador</option><option>Caçador</option><option>Colecionador</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1 text-warning">Vencimento CRAF</label>
                                        <input type="date" className="w-full" value={arVencCraf} onChange={e => setArVencCraf(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" className="btn btn-primary" disabled={isLoading}>Salvar Arma</button>
                                </div>
                            </form>
                        )}

                        {isLoading ? (
                            <div className="flex justify-center p-8"><span className="loading-spinner"></span></div>
                        ) : crafs.length === 0 ? (
                            <div className="text-center p-8 text-muted border border-dashed border-color-light rounded-md">
                                <span className="material-icons text-4xl mb-2 opacity-50">military_tech</span>
                                <p>Nenhuma arma cadastrada.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {crafs.map(c => {
                                    const vencendo = c.vencimento_craf && isExpiringSoon(c.vencimento_craf, 60);
                                    return (
                                        <div key={c.id} className={`p-4 border rounded-md bg-black bg-opacity-20 flex justify-between items-center gap-4 ${vencendo ? 'border-danger border-opacity-60' : 'border-color-light'}`}>
                                            <div>
                                                <p className="font-bold">{c.fabricante} {c.modelo_arma}</p>
                                                <p className="text-xs text-muted">{c.tipo} · {c.calibre} · Série: {c.n_serie || '—'}</p>
                                                {c.vencimento_craf && (
                                                    <p className={`text-xs mt-1 flex items-center gap-1 ${vencendo ? 'text-danger font-bold' : 'text-muted'}`}>
                                                        <span className="material-icons text-[11px]">{vencendo ? 'warning' : 'event'}</span>
                                                        CRAF: {formatDateBR(c.vencimento_craf)}{vencendo ? ` · ${getDaysRemaining(c.vencimento_craf)}d restantes` : ''}
                                                    </p>
                                                )}
                                            </div>
                                            <button className="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white p-2" onClick={() => handleDeleteArma(c.id)}>
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* GUIAS */}
                {activeTab === 'guias' && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                        <div className="flex justify-end">
                            <button className="btn btn-secondary text-sm" onClick={() => setShowAddGuia(!showAddGuia)}>
                                {showAddGuia ? 'Cancelar' : '➕ Adicionar Guia'}
                            </button>
                        </div>

                        {showAddGuia && (
                            <form onSubmit={handleAddGuia} className="glass-panel p-4 flex flex-col gap-4 border-l-4 border-l-info animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Nº da Guia *</label>
                                        <input type="text" className="w-full" required value={gtNumero} onChange={e => setGtNumero(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Origem</label>
                                        <input type="text" className="w-full" value={gtOrigem} onChange={e => setGtOrigem(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Destino</label>
                                        <input type="text" className="w-full" value={gtDestino} onChange={e => setGtDestino(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Emissão</label>
                                        <input type="date" className="w-full" value={gtEmissao} onChange={e => setGtEmissao(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1 text-warning">Vencimento</label>
                                        <input type="date" className="w-full" value={gtVencimento} onChange={e => setGtVencimento(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" className="btn btn-primary" disabled={isLoading}>Salvar Guia</button>
                                </div>
                            </form>
                        )}

                        {isLoading ? (
                            <div className="flex justify-center p-8"><span className="loading-spinner"></span></div>
                        ) : guias.length === 0 ? (
                            <div className="text-center p-8 text-muted border border-dashed border-color-light rounded-md">
                                <span className="material-icons text-4xl mb-2 opacity-50">description</span>
                                <p>Nenhuma Guia de Tráfego registrada.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {guias.map(g => {
                                    const vencendo = g.vencimento_gt && isExpiringSoon(g.vencimento_gt, 30);
                                    return (
                                        <div key={g.id} className={`p-4 border rounded-md bg-black bg-opacity-20 flex justify-between items-center gap-4 ${vencendo ? 'border-warning border-opacity-60' : 'border-color-light'}`}>
                                            <div>
                                                <p className="font-bold">Guia Nº {g.n_guia}</p>
                                                <p className="text-xs text-muted">{g.origem || '—'} → {g.destino || '—'}</p>
                                                {g.vencimento_gt && (
                                                    <p className={`text-xs mt-1 flex items-center gap-1 ${vencendo ? 'text-warning font-bold' : 'text-muted'}`}>
                                                        <span className="material-icons text-[11px]">event</span>
                                                        Vence: {formatDateBR(g.vencimento_gt)}{vencendo ? ` · ${getDaysRemaining(g.vencimento_gt)}d` : ''}
                                                    </p>
                                                )}
                                            </div>
                                            <button className="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white p-2" onClick={() => handleDeleteGuia(g.id)}>
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* SIMAF */}
                {activeTab === 'simaf' && (
                    <form onSubmit={handleSaveSimaf} className="flex flex-col gap-4 animate-fade-in">
                        <div className="glass-panel p-4 border-l-4 border-l-success">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-success">
                                <span className="material-icons">eco</span>Dados SIMAF / IBAMA
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold block mb-1">Nº CR IBAMA</label>
                                    <input type="text" className="w-full" value={simafCr} onChange={e => setSimafCr(e.target.value)} placeholder="Número do CR IBAMA" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold block mb-1 text-warning">Vencimento CR IBAMA</label>
                                    <input type="date" className="w-full" value={simafVenc} onChange={e => setSimafVenc(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    <span className="material-icons mr-1 text-sm">save</span>Salvar SIMAF
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );

    if (embeddedMode) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-background border border-accent-primary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-background bg-opacity-95 backdrop-blur z-10 p-4 border-b border-color-light flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-icons text-warning">person_pin</span>
                            {cliente.nome}
                        </h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning bg-opacity-20 text-warning border border-warning">Sem App</span>
                    </div>
                    <button onClick={onClose} className="btn btn-outline border-transparent hover:bg-color-light p-2 rounded-full">
                        <span className="material-icons">close</span>
                    </button>
                </div>
                {content}
            </div>
        </div>
    );
};
