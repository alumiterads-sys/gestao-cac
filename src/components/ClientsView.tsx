import React, { useState, useEffect } from 'react';
import type { UserProfile, DispatcherConnection, Weapon, TrafficGuide, IbamaDoc, ClienteAvulso } from '../types';
import {
    searchUserByCpf, createConnectionInvite, acceptConnectionInvite, deleteConnection, fetchDispatcherConnections,
    fetchUserProfileById, fetchWeapons, fetchGuides, fetchIbamaDoc,
    fetchClientesAvulsos, createClienteAvulso, deleteClienteAvulso
} from '../api';
import { Dashboard } from './Dashboard';

interface ClientsViewProps {
    user: UserProfile;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ user }) => {
    const [connections, setConnections] = useState<DispatcherConnection[]>([]);
    const [searchCpf, setSearchCpf] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Client Dashboard State
    const [viewingClient, setViewingClient] = useState<UserProfile | null>(null);
    const [clientWeapons, setClientWeapons] = useState<Weapon[]>([]);
    const [clientGuides, setClientGuides] = useState<TrafficGuide[]>([]);
    const [clientIbamaDoc, setClientIbamaDoc] = useState<IbamaDoc | null>(null);
    const [isLoadingClient, setIsLoadingClient] = useState(false);

    // Unified Add Client State
    const [clientesAvulsos, setClientesAvulsos] = useState<ClienteAvulso[]>([]);
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [clientType, setClientType] = useState<'app' | 'offline'>('app');

    // Avulso Form State
    const [avulsoNome, setAvulsoNome] = useState('');
    const [avulsoCpf, setAvulsoCpf] = useState('');
    const [avulsoPhone, setAvulsoPhone] = useState('');
    const [avulsoSenha, setAvulsoSenha] = useState('');

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

        if (searchCpf.length < 3) {
            showMessage('Digite um CPF válido.', 'error');
            return;
        }

        setIsSearching(true);
        const result = await searchUserByCpf(searchCpf);

        if (!result) {
            showMessage('Nenhum usuário encontrado com este CPF.', 'error');
        } else if (result.id === user.id) {
            showMessage('Você não pode enviar um convite para você mesmo.', 'error');
        } else if (result.role === 'admin') {
            showMessage('Este usuário é um Despachante. Convites são apenas para CACs (Usuários).', 'error');
        } else {
            setSearchResult(result);
        }
        setIsSearching(false);
    };

    const handleInvite = async () => {
        if (!searchResult) return;
        setIsSearching(true);
        const success = await createConnectionInvite(user.id, searchResult.id, 'admin');
        if (success) {
            showMessage(`Convite enviado para ${searchResult.nome}. aguardando aprovação.`, 'success');
            setSearchCpf('');
            setSearchResult(null);
            loadConnections();
        } else {
            showMessage('Erro ao enviar convite. Talvez já exista um vínculo ou convite pendente.', 'error');
        }
        setIsSearching(false);
    };

    const handleAccept = async (connId: string) => {
        const success = await acceptConnectionInvite(connId);
        if (success) {
            showMessage('Convite do cliente aprovado!', 'success');
            loadConnections();
        } else {
            showMessage('Erro ao aprovar o convite.', 'error');
        }
    };

    const handleRejectRemove = async (connId: string, isRemove: boolean) => {
        if (isRemove && !window.confirm('Tem certeza que deseja remover este cliente? Você não terá mais acesso aos documentos dele.')) {
            return;
        }

        const success = await deleteConnection(connId);
        if (success) {
            showMessage(isRemove ? 'Cliente removido com sucesso.' : 'Convite recusado.', 'success');
            loadConnections();
        } else {
            showMessage(isRemove ? 'Erro ao remover cliente.' : 'Erro ao recusar convite.', 'error');
        }
    };

    const handleViewClient = async (cacId: string) => {
        setIsLoadingClient(true);
        setViewingClient(null); // Open modal in loading state

        const [profile, weapons, guides, ibama] = await Promise.all([
            fetchUserProfileById(cacId),
            fetchWeapons(cacId),
            fetchGuides(cacId),
            fetchIbamaDoc(cacId)
        ]);

        if (profile) {
            setViewingClient(profile);
            setClientWeapons(weapons);
            setClientGuides(guides);
            setClientIbamaDoc(ibama);
        } else {
            showMessage('Erro ao carregar dados do cliente. Ele pode ter sido excluído.', 'error');
            setViewingClient(null);
        }
        setIsLoadingClient(false);
    };

    const closeClientModal = () => {
        setViewingClient(null);
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
            showMessage('Cliente manual adicionado com sucesso!', 'success');
            setAvulsoNome('');
            setAvulsoCpf('');
            setAvulsoPhone('');
            setAvulsoSenha('');
            setIsAddingClient(false);
            loadConnections();
        } else {
            showMessage('Erro ao adicionar cliente manual.', 'error');
        }
        setIsLoading(false);
    };

    const handleDeleteAvulso = async (id: string) => {
        if (!window.confirm('Excluir este cliente manual permanentemente?')) return;
        setIsLoading(true);
        await deleteClienteAvulso(id);
        loadConnections();
    };

    const pendingFromCac = connections.filter(c => c.status === 'pending_dispatcher');
    const pendingToCac = connections.filter(c => c.status === 'pending_cac');
    const activeClients = connections.filter(c => c.status === 'active');

    const unifiedClients = [
        ...activeClients.map(c => ({
            id: c.id,
            cacId: c.cacId,
            type: 'app',
            nome: c.cacNome || 'Sem Nome',
            cpf: c.cacCpf,
            date: c.createdAt,
            telefone: '',
            senha: ''
        })),
        ...clientesAvulsos.map(av => ({
            id: av.id,
            cacId: av.id,
            type: 'offline',
            nome: av.nome || 'Sem Nome',
            cpf: av.cpf,
            date: av.created_at,
            telefone: av.telefone,
            senha: av.senha_gov_br
        }))
    ].sort((a, b) => a.nome.localeCompare(b.nome));

    return (
        <div className="flex flex-col gap-6 animate-fade-in relative">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Gerenciamento de Clientes (CACs)</h2>
            </div>

            {message.text && (
                <div className={`p-3 rounded-md border ${message.type === 'success' ? 'bg-success bg-opacity-20 text-success border-success' : 'bg-danger bg-opacity-20 text-danger border-danger'}`}>
                    {message.text}
                </div>
            )}

            {/* BUSCAR E CONVIDAR CLIENTE */}
            <div className="glass-panel p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="font-bold text-accent-primary flex items-center gap-2">
                            <span className="material-icons text-xl">person_add</span>
                            Adicionar Cliente
                        </h3>
                        <p className="text-sm text-muted">
                            Cadastre um cliente Offline (Manual) ou envie um convite para o App G-CAC.
                        </p>
                    </div>
                    <button
                        className="btn btn-secondary text-sm whitespace-nowrap"
                        onClick={() => {
                            setIsAddingClient(!isAddingClient);
                            setSearchResult(null);
                            setSearchCpf('');
                        }}
                    >
                        {isAddingClient ? 'Cancelar' : '➕ Cadastrar / Convidar Cliente'}
                    </button>
                </div>

                {isAddingClient && (
                    <div className="animate-fade-in border-t border-color-light pt-6">
                        <div className="flex gap-4 mb-6">
                            <button
                                className={`flex-1 py-3 px-4 rounded-md border text-sm font-bold transition-colors ${clientType === 'app' ? 'bg-accent-primary bg-opacity-20 border-accent-primary text-accent-primary' : 'bg-black bg-opacity-30 border-color-light text-muted hover:text-white'}`}
                                onClick={() => setClientType('app')}
                            >
                                <span className="material-icons align-middle mr-2">smartphone</span>
                                Usuário App G-CAC
                            </button>
                            <button
                                className={`flex-1 py-3 px-4 rounded-md border text-sm font-bold transition-colors ${clientType === 'offline' ? 'bg-warning bg-opacity-20 border-warning text-warning' : 'bg-black bg-opacity-30 border-color-light text-muted hover:text-white'}`}
                                onClick={() => setClientType('offline')}
                            >
                                <span className="material-icons align-middle mr-2">edit_document</span>
                                Cliente Manual (Offline)
                            </button>
                        </div>

                        {clientType === 'app' ? (
                            <div className="animate-fade-in flex flex-col gap-4">
                                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="text-sm font-bold block mb-1">Buscar por CPF do CAC</label>
                                        <input
                                            type="text"
                                            className="w-full"
                                            placeholder="Digite apenas números..."
                                            value={searchCpf}
                                            onChange={(e) => setSearchCpf(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-secondary h-[42px]" disabled={isSearching || searchCpf.length < 3}>
                                        {isSearching ? 'Buscando...' : 'Pesquisar'}
                                    </button>
                                </form>

                                {searchResult && (
                                    <div className="p-4 border border-color-light rounded-md bg-black bg-opacity-30 flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
                                        <div>
                                            <p className="font-bold">{searchResult.nome}</p>
                                            <p className="text-sm text-muted">CPF Final: {searchResult.cpf.slice(-2)}</p>
                                        </div>
                                        <button
                                            onClick={handleInvite}
                                            className="btn btn-primary"
                                            disabled={isSearching}
                                        >
                                            <span className="material-icons text-sm mr-1">send</span>
                                            Enviar Pedido de Acesso
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleCreateAvulso} className="bg-black bg-opacity-30 p-4 border border-color-light rounded-md flex flex-col gap-4 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Nome Completo *</label>
                                        <input type="text" className="w-full" required value={avulsoNome} onChange={e => setAvulsoNome(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1">CPF (Recomendado)</label>
                                        <input type="text" className="w-full" value={avulsoCpf} onChange={e => setAvulsoCpf(e.target.value.replace(/\D/g, ''))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold block mb-1">Telefone / WhatsApp</label>
                                        <input type="text" className="w-full" value={avulsoPhone} onChange={e => setAvulsoPhone(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold block mb-1 text-warning">Senha Gov.br (Opcional)</label>
                                        <input type="text" className="w-full" placeholder="Para gestão de processos" value={avulsoSenha} onChange={e => setAvulsoSenha(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                        <span className="material-icons mr-1 text-sm">save</span>
                                        Salvar Cliente Manual
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* CONVITES RECEBIDOS */}
            {pendingFromCac.length > 0 && (
                <div className="glass-panel p-6 border-warning border-opacity-50">
                    <h3 className="font-bold text-warning mb-4 flex items-center gap-2">
                        <span className="material-icons text-xl">notifications_active</span>
                        Solicitações Recebidas ({pendingFromCac.length})
                    </h3>
                    <p className="text-sm text-muted mb-4">
                        Estes CACs enviaram um convite para você gerenciar o acervo deles.
                    </p>
                    <div className="flex flex-col gap-3">
                        {pendingFromCac.map(conn => (
                            <div key={conn.id} className="p-4 bg-black bg-opacity-20 border border-color-light rounded-md flex justify-between items-center flex-col md:flex-row gap-4">
                                <div>
                                    <p className="font-bold">{conn.cacNome}</p>
                                    <p className="text-sm text-muted">Aguardando sua aprovação</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white" onClick={() => handleRejectRemove(conn.id, false)}>
                                        Recusar
                                    </button>
                                    <button className="btn btn-primary" onClick={() => handleAccept(conn.id)}>
                                        Aprovar Acesso
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CLIENTES ATIVOS E MANUAIS UNIFICADOS */}
            <div className="glass-panel p-6">
                <h3 className="font-bold text-success mb-4 flex items-center gap-2">
                    <span className="material-icons text-xl">people</span>
                    Carteira de Clientes ({unifiedClients.length})
                </h3>

                {isLoading ? (
                    <div className="flex justify-center p-8"><span className="loading-spinner"></span></div>
                ) : unifiedClients.length === 0 ? (
                    <div className="text-center p-8 text-muted border border-dashed border-color-light rounded-md">
                        <span className="material-icons text-4xl mb-2 opacity-50">group_off</span>
                        <p>Você ainda não possui clientes vinculados ou cadastrados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {unifiedClients.map(client => (
                            <div key={`${client.type}-${client.id}`} className={`p-4 border bg-black bg-opacity-20 rounded-md flex flex-col md:flex-row justify-between items-center gap-4 transition-colors ${client.type === 'app' ? 'border-color-light hover:border-accent-primary' : 'border-color-light border-dashed hover:border-warning'}`}>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${client.type === 'app' ? 'bg-accent-primary bg-opacity-20 text-accent-primary' : 'bg-warning bg-opacity-20 text-warning'}`}>
                                        {client.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold">{client.nome}</p>
                                            {client.type === 'app' ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success bg-opacity-20 text-success border border-success">APP GCAC</span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning bg-opacity-20 text-warning border border-warning">OFFLINE</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted mt-0.5">
                                            {client.cpf && `CPF: ${client.cpf} • `}
                                            {client.type === 'app' ? `Vínculo desde: ${new Date(client.date).toLocaleDateString()}` : (client.telefone ? `Tel: ${client.telefone}` : `Registro Manual`)}
                                        </p>
                                        {client.senha && (
                                            <p className="text-[11px] text-info flex items-center gap-1 mt-1 font-mono">
                                                <span className="material-icons text-[12px]">password</span>
                                                Gov.br Salvo
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto justify-end">
                                    {client.type === 'app' ? (
                                        <>
                                            <button
                                                className="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white flex-1 md:flex-none justify-center px-3"
                                                onClick={() => handleRejectRemove(client.id, true)}
                                                title="Remover Acesso"
                                            >
                                                <span className="material-icons text-sm">link_off</span>
                                            </button>
                                            <button
                                                className="btn btn-secondary flex-1 md:flex-none justify-center text-sm"
                                                onClick={() => handleViewClient(client.cacId)}
                                            >
                                                <span className="material-icons text-sm mr-1">dashboard</span>
                                                Painel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white flex justify-center px-4"
                                            onClick={() => handleDeleteAvulso(client.id)}
                                            title="Excluir Definitivamente"
                                        >
                                            <span className="material-icons text-sm mr-1">delete</span>
                                            Excluir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CONVITES ENVIADOS (PENDENTES) */}
            {pendingToCac.length > 0 && (
                <div className="glass-panel p-6 opacity-70">
                    <h3 className="font-bold text-muted mb-4 flex items-center gap-2">
                        <span className="material-icons text-xl">schedule</span>
                        Aguardando Aprovação do Cliente ({pendingToCac.length})
                    </h3>
                    <div className="flex flex-col gap-2">
                        {pendingToCac.map(conn => (
                            <div key={conn.id} className="p-3 bg-black bg-opacity-20 border border-color-light rounded-md flex justify-between items-center">
                                <p className="text-sm font-bold">{conn.cacNome}</p>
                                <button className="text-xs text-danger underline hover:text-white bg-transparent border-none cursor-pointer" onClick={() => handleRejectRemove(conn.id, false)}>
                                    Cancelar Pedido
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL: VISUALIZAR PAINEL DO CLIENTE (LEITURA) */}
            {(isLoadingClient || viewingClient) && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={closeClientModal}
                >
                    <div
                        className="bg-background border border-accent-primary rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-background bg-opacity-95 backdrop-blur z-10 p-4 border-b border-color-light flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <span className="material-icons text-accent-primary">visibility</span>
                                    Painel do Cliente
                                </h2>
                                {viewingClient && <p className="text-sm text-muted">Acessando dados de: <strong className="text-white">{viewingClient.nome}</strong> (Modo Leitura)</p>}
                            </div>
                            <button onClick={closeClientModal} className="btn btn-outline border-transparent hover:bg-color-light p-2 rounded-full">
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {isLoadingClient ? (
                                <div className="flex flex-col items-center justify-center p-12 gap-4">
                                    <span className="loading-spinner w-12 h-12"></span>
                                    <p className="text-muted">Carregando dados do cliente...</p>
                                </div>
                            ) : viewingClient ? (
                                <div className="flex flex-col gap-6 pointer-events-none user-select-none filter grayscale-0">
                                    {/* We reuse the Dashboard component but in a read-only context */}
                                    {/* CSS overrides pointer-events-none above, but we also pass it below */}
                                    <div className="pointer-events-auto">
                                        <div className="bg-warning bg-opacity-10 border border-warning text-warning p-3 rounded-md mb-6 flex items-start gap-3">
                                            <span className="material-icons mt-0.5">info</span>
                                            <p className="text-sm">Você está visualizando os dados deste cliente em <strong>modo somente leitura</strong>. As edições diretas devem ser feitas pelo próprio CAC ou você precisará solicitar que ele altere.</p>
                                        </div>
                                        <Dashboard
                                            user={viewingClient}
                                            weapons={clientWeapons}
                                            guides={clientGuides}
                                            ibamaDoc={clientIbamaDoc ?? undefined}
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
