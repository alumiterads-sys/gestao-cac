import React, { useState, useEffect } from 'react';
import type { UserProfile, DispatcherConnection } from '../types';
import { searchUserByCpf, createConnectionInvite, acceptConnectionInvite, deleteConnection, fetchCacConnections } from '../api';

interface DispatchersViewProps {
    user: UserProfile;
}

export const DispatchersView: React.FC<DispatchersViewProps> = ({ user }) => {
    const [connections, setConnections] = useState<DispatcherConnection[]>([]);
    const [searchCpf, setSearchCpf] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const loadConnections = async () => {
        setIsLoading(true);
        const data = await fetchCacConnections(user.id);
        setConnections(data);
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

        if (searchCpf.length < 11) {
            showMessage('Digite um CPF válido.', 'error');
            return;
        }

        setIsSearching(true);
        const result = await searchUserByCpf(searchCpf);

        if (!result) {
            showMessage('Nenhum despachante encontrado com este CPF.', 'error');
        } else if (result.id === user.id) {
            showMessage('Você não pode enviar um convite para você mesmo.', 'error');
        } else if (result.role !== 'admin') {
            showMessage('O usuário encontrado não está registrado como Despachante.', 'error');
        } else {
            setSearchResult(result);
        }
        setIsSearching(false);
    };

    const handleInvite = async () => {
        if (!searchResult) return;
        setIsSearching(true);
        const success = await createConnectionInvite(searchResult.id, user.id, 'user');
        if (success) {
            showMessage(`Convite enviado para o despachante ${searchResult.nome}. aguardando aprovação.`, 'success');
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
            showMessage('Despachante aprovado! Ele agora tem acesso aos seus documentos.', 'success');
            loadConnections();
        } else {
            showMessage('Erro ao aprovar o convite.', 'error');
        }
    };

    const handleRejectRemove = async (connId: string, isRemove: boolean) => {
        if (isRemove && !window.confirm('Tem certeza que deseja remover este despachante? Ele não terá mais acesso aos seus dados.')) {
            return;
        }

        const success = await deleteConnection(connId);
        if (success) {
            showMessage(isRemove ? 'Despachante descadastrado com sucesso.' : 'Convite recusado.', 'success');
            loadConnections();
        } else {
            showMessage(isRemove ? 'Erro ao remover despachante.' : 'Erro ao recusar convite.', 'error');
        }
    };

    const pendingFromDispatcher = connections.filter(c => c.status === 'pending_cac');
    const pendingToDispatcher = connections.filter(c => c.status === 'pending_dispatcher');
    const activeDispatchers = connections.filter(c => c.status === 'active');

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Meus Despachantes</h2>
            </div>

            {message.text && (
                <div className={`p-3 rounded-md border ${message.type === 'success' ? 'bg-success bg-opacity-20 text-success border-success' : 'bg-danger bg-opacity-20 text-danger border-danger'}`}>
                    {message.text}
                </div>
            )}

            {/* CONVITES RECEBIDOS */}
            {pendingFromDispatcher.length > 0 && (
                <div className="glass-panel p-6 border-warning border-opacity-50">
                    <h3 className="font-bold text-warning mb-4 flex items-center gap-2">
                        <span className="material-icons text-xl">notifications_active</span>
                        Convites de Despachantes ({pendingFromDispatcher.length})
                    </h3>
                    <p className="text-sm text-muted mb-4">
                        Os despachantes abaixo estão solicitando acesso para visualizar suas armas e gerenciar suas guias de tráfego.
                    </p>
                    <div className="flex flex-col gap-3">
                        {pendingFromDispatcher.map(conn => (
                            <div key={conn.id} className="p-4 bg-black bg-opacity-20 border border-color-light rounded-md flex justify-between items-center flex-col md:flex-row gap-4">
                                <div>
                                    <p className="font-bold">{conn.dispatcherNome}</p>
                                    <p className="text-sm text-muted">Aguardando sua autorização</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white" onClick={() => handleRejectRemove(conn.id, false)}>
                                        Recusar
                                    </button>
                                    <button className="btn btn-primary" onClick={() => handleAccept(conn.id)}>
                                        Autorizar Acesso
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BUSCAR E CONVIDAR DESPACHANTE */}
            <div className="glass-panel p-6">
                <h3 className="font-bold text-accent-primary mb-4 flex items-center gap-2">
                    <span className="material-icons text-xl">person_search</span>
                    Buscar e Adicionar Despachante
                </h3>
                <p className="text-sm text-muted mb-4">
                    Insira o CPF do seu despachante credenciado para encontrá-lo no sistema.
                </p>

                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-sm font-bold block mb-1">CPF do Despachante</label>
                        <input
                            type="text"
                            className="w-full"
                            placeholder="Apenas números..."
                            value={searchCpf}
                            onChange={(e) => setSearchCpf(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary" disabled={isSearching || searchCpf.length < 11}>
                        {isSearching ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>

                {searchResult && (
                    <div className="mt-4 p-4 border border-color-light rounded-md bg-black bg-opacity-30 flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
                        <div>
                            <p className="font-bold text-accent-primary">{searchResult.nome}</p>
                            <p className="text-sm text-muted">Despachante Autorizado</p>
                        </div>
                        <button
                            onClick={handleInvite}
                            className="btn btn-primary"
                            disabled={isSearching}
                        >
                            <span className="material-icons text-sm mr-1">send</span>
                            Enviar Convite
                        </button>
                    </div>
                )}
            </div>

            {/* DESPACHANTES ATIVOS */}
            <div className="glass-panel p-6">
                <h3 className="font-bold text-success mb-4 flex items-center gap-2">
                    <span className="material-icons text-xl">verified_user</span>
                    Despachantes Autorizados ({activeDispatchers.length})
                </h3>
                <p className="text-sm text-muted mb-4">
                    Estes profissionais podem visualizar seus documentos e datas de vencimento.
                </p>

                {isLoading ? (
                    <div className="flex justify-center p-8"><span className="loading-spinner"></span></div>
                ) : activeDispatchers.length === 0 ? (
                    <div className="text-center p-8 text-muted border border-dashed border-color-light rounded-md">
                        <span className="material-icons text-4xl mb-2 opacity-50">gpp_bad</span>
                        <p>Nenhum despachante autorizado no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {activeDispatchers.map(conn => (
                            <div key={conn.id} className="p-4 border border-color-light bg-black bg-opacity-20 rounded-md flex justify-between items-center gap-4 flex-col md:flex-row">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-accent-primary bg-opacity-20 text-accent-primary flex items-center justify-center font-bold">
                                        <span className="material-icons text-white text-opacity-80">business_center</span>
                                    </div>
                                    <div>
                                        <p className="font-bold">{conn.dispatcherNome}</p>
                                        <p className="text-xs text-muted">Acesso Liberado desde: {new Date(conn.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white"
                                    onClick={() => handleRejectRemove(conn.id, true)}
                                    title="Remover Acesso deste Despachante"
                                >
                                    <span className="material-icons text-sm mr-1">block</span>
                                    Revogar Acesso
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CONVITES ENVIADOS (PENDENTES) */}
            {pendingToDispatcher.length > 0 && (
                <div className="glass-panel p-6 opacity-70 mt-4">
                    <h3 className="font-bold text-muted mb-4 flex items-center gap-2">
                        <span className="material-icons text-xl">schedule</span>
                        Convites Enviados ({pendingToDispatcher.length})
                    </h3>
                    <div className="flex flex-col gap-2">
                        {pendingToDispatcher.map(conn => (
                            <div key={conn.id} className="p-3 bg-black bg-opacity-20 border border-color-light rounded-md flex justify-between items-center">
                                <p className="text-sm font-bold">Despachante: <span className="text-muted font-normal">{conn.dispatcherNome}</span></p>
                                <button className="text-xs text-danger underline hover:text-white bg-transparent border-none cursor-pointer" onClick={() => handleRejectRemove(conn.id, false)}>
                                    Cancelar Envio
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
