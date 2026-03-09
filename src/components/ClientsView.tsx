import React, { useState, useEffect } from 'react';
import type { UserProfile, DispatcherConnection, Weapon, TrafficGuide, IbamaDoc, ClienteAvulso } from '../types';
import {
    searchUserByCpf, createConnectionInvite, acceptConnectionInvite, deleteConnection, fetchDispatcherConnections,
    fetchUserProfileById, fetchWeapons, fetchGuides, fetchIbamaDoc,
    fetchClientesAvulsos, createClienteAvulso, deleteClienteAvulso, updateClienteAvulso
} from '../api';
import { Dashboard } from './Dashboard';
import { ClienteAvulsoPanel } from './ClienteAvulsoPanel';

interface ClientsViewProps {
    user: UserProfile;
}

type UnifiedClient = {
    id: string;
    cacId: string;
    type: 'app' | 'offline';
    nome: string;
    cpf: string;
    date: string;
    telefone: string;
    senha: string;
    connId: string; // connection id (for app) or same as id (for offline)
};

export const ClientsView: React.FC<ClientsViewProps> = ({ user }) => {
    const [connections, setConnections] = useState<DispatcherConnection[]>([]);
    const [searchCpf, setSearchCpf] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Client Dashboard State (App)
    const [viewingClient, setViewingClient] = useState<UserProfile | null>(null);
    const [clientWeapons, setClientWeapons] = useState<Weapon[]>([]);
    const [clientGuides, setClientGuides] = useState<TrafficGuide[]>([]);
    const [clientIbamaDoc, setClientIbamaDoc] = useState<IbamaDoc | null>(null);
    const [isLoadingClient, setIsLoadingClient] = useState(false);

    // Modal state
    const [selectedClient, setSelectedClient] = useState<UnifiedClient | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

    // Avulso panel state
    const [viewingAvulso, setViewingAvulso] = useState<ClienteAvulso | null>(null);

    // Add Client State
    const [clientesAvulsos, setClientesAvulsos] = useState<ClienteAvulso[]>([]);
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [clientType, setClientType] = useState<'app' | 'offline'>('app');

    // Avulso Form State (create)
    const [avulsoNome, setAvulsoNome] = useState('');
    const [avulsoCpf, setAvulsoCpf] = useState('');
    const [avulsoPhone, setAvulsoPhone] = useState('');
    const [avulsoSenha, setAvulsoSenha] = useState('');

    // Edit avulso inline state
    const [editNome, setEditNome] = useState('');
    const [editCpf, setEditCpf] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editSenha, setEditSenha] = useState('');

    const loadConnections = async () => {
        setIsLoading(true);
        const [connData, avulsosData] = await Promise.all([
            fetchDispatcherConnections(user.id),
            fetchClientesAvulsos(user.id)
        ]);
        setConnections(connData);
        setClientesAvulsos(avulsosData);
        setIsLoading(false);
    };

    useEffect(() => {
        loadConnections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setSearchResult(null);
        if (searchCpf.length < 3) { showMessage('Digite um CPF válido.', 'error'); return; }
        setIsSearching(true);
        const result = await searchUserByCpf(searchCpf);
        if (!result) showMessage('Nenhum usuário encontrado com este CPF.', 'error');
        else if (result.id === user.id) showMessage('Você não pode enviar um convite para você mesmo.', 'error');
        else if (result.role === 'admin') showMessage('Este usuário é um Despachante.', 'error');
        else setSearchResult(result);
        setIsSearching(false);
    };

    const handleInvite = async () => {
        if (!searchResult) return;
        setIsSearching(true);
        const success = await createConnectionInvite(user.id, searchResult.id, 'admin');
        if (success) {
            showMessage(`Convite enviado para ${searchResult.nome}.`, 'success');
            setSearchCpf(''); setSearchResult(null); loadConnections();
        } else {
            showMessage('Erro ao enviar convite. Talvez já exista um vínculo.', 'error');
        }
        setIsSearching(false);
    };

    const handleAccept = async (connId: string) => {
        const success = await acceptConnectionInvite(connId);
        if (success) { showMessage('Convite aprovado!', 'success'); loadConnections(); }
        else showMessage('Erro ao aprovar o convite.', 'error');
    };

    const handleRejectRemove = async (connId: string, isRemove: boolean) => {
        if (isRemove && !window.confirm('Tem certeza que deseja remover este cliente?')) return;
        const success = await deleteConnection(connId);
        if (success) {
            showMessage(isRemove ? 'Cliente removido.' : 'Convite recusado.', 'success');
            loadConnections();
            setSelectedClient(null);
        } else {
            showMessage('Erro ao remover.', 'error');
        }
    };

    const handleOpenClient = async (client: UnifiedClient) => {
        setSelectedClient(client);
        setModalMode('view');
        if (client.type === 'app') {
            setIsLoadingClient(true);
            setViewingClient(null);
            const [profile, weapons, guides, ibama] = await Promise.all([
                fetchUserProfileById(client.cacId),
                fetchWeapons(client.cacId),
                fetchGuides(client.cacId),
                fetchIbamaDoc(client.cacId)
            ]);
            if (profile) {
                setViewingClient(profile);
                setClientWeapons(weapons);
                setClientGuides(guides);
                setClientIbamaDoc(ibama);
            } else {
                showMessage('Erro ao carregar dados do cliente.', 'error');
                setSelectedClient(null);
            }
            setIsLoadingClient(false);
        } else {
            // For avulso, set the ClienteAvulso object for the sub-panel
            const av = clientesAvulsos.find(a => a.id === client.id) || null;
            setViewingAvulso(av);
            // Pre-fill edit fields
            setEditNome(client.nome);
            setEditCpf(client.cpf);
            setEditPhone(client.telefone);
            setEditSenha(client.senha);
        }
    };

    const handleCloseModal = () => {
        setSelectedClient(null);
        setViewingClient(null);
        setViewingAvulso(null);
        setModalMode('view');
    };

    const handleCreateAvulso = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await createClienteAvulso({
            dispatcher_id: user.id,
            nome: avulsoNome,
            cpf: avulsoCpf,
            telefone: avulsoPhone,
            senha_gov_br: avulsoSenha
        });
        if (success) {
            showMessage('Cliente manual adicionado!', 'success');
            setAvulsoNome(''); setAvulsoCpf(''); setAvulsoPhone(''); setAvulsoSenha('');
            setIsAddingClient(false);
            loadConnections();
        } else {
            showMessage('Erro ao adicionar cliente manual.', 'error');
        }
        setIsLoading(false);
    };

    const handleDeleteAvulso = async (id: string) => {
        if (!window.confirm('Excluir este cliente permanentemente?')) return;
        await deleteClienteAvulso(id);
        handleCloseModal();
        loadConnections();
    };

    const handleSaveEditAvulso = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        const success = await updateClienteAvulso(selectedClient.id, {
            nome: editNome,
            cpf: editCpf,
            telefone: editPhone,
            senha_gov_br: editSenha
        });
        if (success) {
            showMessage('Dados atualizados!', 'success');
            loadConnections();
            setModalMode('view');
            // Update local state
            setSelectedClient(prev => prev ? { ...prev, nome: editNome, cpf: editCpf, telefone: editPhone, senha: editSenha } : null);
        } else {
            showMessage('Erro ao salvar alterações.', 'error');
        }
    };

    const pendingFromCac = connections.filter(c => c.status === 'pending_dispatcher');
    const pendingToCac = connections.filter(c => c.status === 'pending_cac');
    const activeClients = connections.filter(c => c.status === 'active');

    const unifiedClients: UnifiedClient[] = [
        ...activeClients.map(c => ({
            id: c.id,
            cacId: c.cacId,
            connId: c.id,
            type: 'app' as const,
            nome: c.cacNome || 'Sem Nome',
            cpf: c.cacCpf || '',
            date: c.createdAt,
            telefone: '',
            senha: ''
        })),
        ...clientesAvulsos.map(av => ({
            id: av.id,
            cacId: av.id,
            connId: av.id,
            type: 'offline' as const,
            nome: av.nome || 'Sem Nome',
            cpf: av.cpf || '',
            date: av.created_at,
            telefone: av.telefone || '',
            senha: av.senha_gov_br || ''
        }))
    ].sort((a, b) => a.nome.localeCompare(b.nome));

    return (
        <div className="flex flex-col gap-6 animate-fade-in relative">

            {/* MENSAGEM */}
            {message.text && (
                <div className={`p-3 rounded-md border text-sm ${message.type === 'success' ? 'bg-success bg-opacity-20 text-success border-success' : 'bg-danger bg-opacity-20 text-danger border-danger'}`}>
                    {message.text}
                </div>
            )}

            {/* ADICIONAR CLIENTE */}
            <div className="glass-panel p-5">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-accent-primary flex items-center gap-2 text-sm">
                        <span className="material-icons text-lg">person_add</span>
                        Adicionar Cliente
                    </h3>
                    <button
                        className="btn btn-secondary text-sm"
                        onClick={() => { setIsAddingClient(!isAddingClient); setSearchResult(null); setSearchCpf(''); }}
                    >
                        {isAddingClient ? 'Cancelar' : '➕ Cadastrar / Convidar'}
                    </button>
                </div>

                {isAddingClient && (
                    <div className="animate-fade-in border-t border-color-light pt-4 mt-4">
                        <div className="flex gap-3 mb-4">
                            <button
                                className={`flex-1 py-2 px-3 rounded-md border text-sm font-bold transition-colors ${clientType === 'app' ? 'bg-accent-primary bg-opacity-20 border-accent-primary text-accent-primary' : 'bg-black bg-opacity-30 border-color-light text-muted'}`}
                                onClick={() => setClientType('app')}
                            >
                                <span className="material-icons align-middle mr-1 text-sm">smartphone</span>
                                Usuário App G-CAC
                            </button>
                            <button
                                className={`flex-1 py-2 px-3 rounded-md border text-sm font-bold transition-colors ${clientType === 'offline' ? 'bg-warning bg-opacity-20 border-warning text-warning' : 'bg-black bg-opacity-30 border-color-light text-muted'}`}
                                onClick={() => setClientType('offline')}
                            >
                                <span className="material-icons align-middle mr-1 text-sm">edit_document</span>
                                Cliente Sem App
                            </button>
                        </div>

                        {clientType === 'app' ? (
                            <div className="flex flex-col gap-3">
                                <form onSubmit={handleSearch} className="flex gap-3 items-end">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold block mb-1">Buscar por CPF do CAC</label>
                                        <input type="text" className="w-full" placeholder="Digite apenas números..."
                                            value={searchCpf} onChange={e => setSearchCpf(e.target.value.replace(/\D/g, ''))} />
                                    </div>
                                    <button type="submit" className="btn btn-secondary h-[38px] text-sm" disabled={isSearching || searchCpf.length < 3}>
                                        {isSearching ? '...' : 'Pesquisar'}
                                    </button>
                                </form>
                                {searchResult && (
                                    <div className="p-3 border border-color-light rounded-md bg-black bg-opacity-30 flex justify-between items-center gap-3 animate-fade-in">
                                        <div>
                                            <p className="font-bold text-sm">{searchResult.nome}</p>
                                            <p className="text-xs text-muted">CPF: ***{searchResult.cpf.slice(-4)}</p>
                                        </div>
                                        <button onClick={handleInvite} className="btn btn-primary text-sm" disabled={isSearching}>
                                            <span className="material-icons text-sm mr-1">send</span>
                                            Convidar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleCreateAvulso} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold block mb-1">Nome Completo *</label>
                                    <input type="text" className="w-full" required value={avulsoNome} onChange={e => setAvulsoNome(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold block mb-1">CPF</label>
                                    <input type="text" className="w-full" value={avulsoCpf} onChange={e => setAvulsoCpf(e.target.value.replace(/\D/g, ''))} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold block mb-1">Telefone / WhatsApp</label>
                                    <input type="text" className="w-full" value={avulsoPhone} onChange={e => setAvulsoPhone(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold block mb-1 text-warning">Senha Gov.br (Opcional)</label>
                                    <input type="text" className="w-full" value={avulsoSenha} onChange={e => setAvulsoSenha(e.target.value)} />
                                </div>
                                <div className="md:col-span-2 flex justify-end mt-1">
                                    <button type="submit" className="btn btn-primary text-sm" disabled={isLoading}>
                                        <span className="material-icons mr-1 text-sm">save</span>
                                        Salvar Cliente
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* CONVITES RECEBIDOS */}
            {pendingFromCac.length > 0 && (
                <div className="glass-panel p-5 border-warning border-opacity-50">
                    <h3 className="font-bold text-warning mb-3 flex items-center gap-2 text-sm">
                        <span className="material-icons text-lg">notifications_active</span>
                        Solicitações Recebidas ({pendingFromCac.length})
                    </h3>
                    <div className="flex flex-col gap-2">
                        {pendingFromCac.map(conn => (
                            <div key={conn.id} className="p-3 bg-black bg-opacity-20 border border-color-light rounded-md flex justify-between items-center gap-3">
                                <p className="font-bold text-sm">{conn.cacNome}</p>
                                <div className="flex gap-2">
                                    <button className="btn btn-outline text-danger border-danger text-xs px-3" onClick={() => handleRejectRemove(conn.id, false)}>Recusar</button>
                                    <button className="btn btn-primary text-xs px-3" onClick={() => handleAccept(conn.id)}>Aprovar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LISTA DE CLIENTES */}
            <div className="glass-panel p-5">
                <h3 className="font-bold text-success mb-3 flex items-center gap-2 text-sm">
                    <span className="material-icons text-lg">people</span>
                    Carteira de Clientes ({unifiedClients.length})
                </h3>

                {isLoading ? (
                    <div className="flex justify-center p-6"><span className="loading-spinner"></span></div>
                ) : unifiedClients.length === 0 ? (
                    <div className="text-center p-8 text-muted border border-dashed border-color-light rounded-md">
                        <span className="material-icons text-3xl mb-2 opacity-50">group_off</span>
                        <p className="text-sm">Nenhum cliente cadastrado.</p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-color-light">
                        {unifiedClients.map(client => (
                            <button
                                key={`${client.type}-${client.id}`}
                                className="flex items-center gap-3 py-2.5 px-2 hover:bg-white hover:bg-opacity-5 transition-colors rounded-md text-left w-full group"
                                onClick={() => handleOpenClient(client)}
                            >
                                {/* Avatar inicial */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${client.type === 'app' ? 'bg-accent-primary bg-opacity-20 text-accent-primary' : 'bg-warning bg-opacity-20 text-warning'}`}>
                                    {client.nome.charAt(0).toUpperCase()}
                                </div>

                                {/* Nome e info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate group-hover:text-accent-primary transition-colors">{client.nome}</p>
                                    <p className="text-xs text-muted truncate">
                                        {client.cpf ? `CPF: ${client.cpf}` : ''}
                                        {client.telefone ? ` · ${client.telefone}` : ''}
                                    </p>
                                </div>

                                {/* Badge tipo */}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex-shrink-0 ${client.type === 'app' ? 'border-success text-success' : 'border-warning text-warning'}`}>
                                    {client.type === 'app' ? 'App' : 'Manual'}
                                </span>

                                {/* Seta */}
                                <span className="material-icons text-muted text-sm flex-shrink-0 group-hover:text-accent-primary transition-colors">chevron_right</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* CONVITES ENVIADOS */}
            {pendingToCac.length > 0 && (
                <div className="glass-panel p-5 opacity-70">
                    <h3 className="font-bold text-muted mb-3 flex items-center gap-2 text-sm">
                        <span className="material-icons text-lg">schedule</span>
                        Aguardando Aprovação ({pendingToCac.length})
                    </h3>
                    <div className="flex flex-col gap-2">
                        {pendingToCac.map(conn => (
                            <div key={conn.id} className="flex justify-between items-center py-2 border-b border-color-light last:border-0">
                                <p className="text-sm font-bold">{conn.cacNome}</p>
                                <button className="text-xs text-danger underline bg-transparent border-none cursor-pointer hover:text-white" onClick={() => handleRejectRemove(conn.id, false)}>
                                    Cancelar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL UNIFICADO DE DETALHES DO CLIENTE */}
            {selectedClient && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-background border border-color-light rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-background bg-opacity-95 backdrop-blur z-10 p-4 border-b border-color-light flex justify-between items-center gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 ${selectedClient.type === 'app' ? 'bg-accent-primary bg-opacity-20 text-accent-primary' : 'bg-warning bg-opacity-20 text-warning'}`}>
                                    {selectedClient.nome.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold truncate">{selectedClient.nome}</h2>
                                    <p className="text-xs text-muted">
                                        {selectedClient.type === 'app' ? 'Cliente App G-CAC' : 'Cliente Manual (Sem App)'}
                                        {selectedClient.cpf && ` · CPF: ${selectedClient.cpf}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Botão Editar (só para Avulso) */}
                                {selectedClient.type === 'offline' && (
                                    <button
                                        className={`btn text-sm ${modalMode === 'edit' ? 'btn-secondary border-warning text-warning' : 'btn-secondary'}`}
                                        onClick={() => setModalMode(m => m === 'edit' ? 'view' : 'edit')}
                                    >
                                        <span className="material-icons text-sm mr-1">{modalMode === 'edit' ? 'close' : 'edit'}</span>
                                        {modalMode === 'edit' ? 'Cancelar' : 'Editar Dados'}
                                    </button>
                                )}
                                {/* Botão Excluir */}
                                {selectedClient.type === 'offline' ? (
                                    <button
                                        className="btn btn-outline text-danger border-danger text-sm px-3"
                                        onClick={() => handleDeleteAvulso(selectedClient.id)}
                                    >
                                        <span className="material-icons text-sm mr-1">delete</span>
                                        Excluir
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-outline text-danger border-danger text-sm px-3"
                                        onClick={() => handleRejectRemove(selectedClient.connId, true)}
                                        title="Remover Acesso"
                                    >
                                        <span className="material-icons text-sm mr-1">link_off</span>
                                        Remover
                                    </button>
                                )}
                                <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 flex-1">
                            {/* CLIENTE APP */}
                            {selectedClient.type === 'app' && (
                                <>
                                    {isLoadingClient ? (
                                        <div className="flex flex-col items-center justify-center p-12 gap-3">
                                            <span className="loading-spinner w-10 h-10"></span>
                                            <p className="text-muted text-sm">Carregando dados do cliente...</p>
                                        </div>
                                    ) : viewingClient ? (
                                        <div>
                                            <div className="bg-info bg-opacity-10 border border-info border-opacity-30 text-info p-3 rounded-md mb-5 flex items-start gap-2 text-sm">
                                                <span className="material-icons text-sm mt-0.5">info</span>
                                                <p>Visualização em <strong>modo leitura</strong>. As edições diretas devem ser feitas pelo próprio CAC.</p>
                                            </div>
                                            <Dashboard
                                                user={viewingClient}
                                                weapons={clientWeapons}
                                                guides={clientGuides}
                                                ibamaDoc={clientIbamaDoc ?? undefined}
                                            />
                                        </div>
                                    ) : null}
                                </>
                            )}

                            {/* CLIENTE AVULSO */}
                            {selectedClient.type === 'offline' && (
                                <>
                                    {/* EDITAR DADOS CADASTRAIS */}
                                    {modalMode === 'edit' ? (
                                        <form onSubmit={handleSaveEditAvulso} className="glass-panel p-5 mb-5 border-warning border-opacity-50 animate-fade-in">
                                            <h4 className="font-bold text-warning mb-4 flex items-center gap-2">
                                                <span className="material-icons text-sm">edit</span>
                                                Editando Dados Cadastrais
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">Nome Completo *</label>
                                                    <input type="text" className="w-full" required value={editNome} onChange={e => setEditNome(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">CPF</label>
                                                    <input type="text" className="w-full" value={editCpf} onChange={e => setEditCpf(e.target.value.replace(/\D/g, ''))} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">Telefone / WhatsApp</label>
                                                    <input type="text" className="w-full" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold block mb-1 text-warning">Senha Gov.br</label>
                                                    <input type="text" className="w-full" value={editSenha} onChange={e => setEditSenha(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="flex justify-end mt-4">
                                                <button type="submit" className="btn btn-primary text-sm">
                                                    <span className="material-icons mr-1 text-sm">save</span>
                                                    Salvar Alterações
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        /* INFO RESUMIDA */
                                        <div className="glass-panel p-4 mb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <p className="text-xs text-muted">CPF</p>
                                                <p className="font-bold text-sm">{selectedClient.cpf || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted">Telefone</p>
                                                <p className="font-bold text-sm">{selectedClient.telefone || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted">Senha Gov.br</p>
                                                <p className="font-bold text-sm font-mono">{selectedClient.senha || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted">Cadastrado em</p>
                                                <p className="font-bold text-sm">{new Date(selectedClient.date).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* PAINEL COMPLETO DO AVULSO (armas, guias, SIMAF) */}
                                    {viewingAvulso && (
                                        <ClienteAvulsoPanel
                                            cliente={viewingAvulso}
                                            onClose={handleCloseModal}
                                            onUpdated={() => { loadConnections(); }}
                                            embeddedMode={true}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
