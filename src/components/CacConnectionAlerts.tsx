import React, { useState, useEffect } from 'react';
import type { UserProfile, DispatcherConnection } from '../types';
import { fetchCacConnections, acceptConnectionInvite, deleteConnection } from '../api';

interface CacConnectionAlertsProps {
    user: UserProfile;
}

export const CacConnectionAlerts: React.FC<CacConnectionAlertsProps> = ({ user }) => {
    const [connections, setConnections] = useState<DispatcherConnection[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

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

    const showMessage = (text: string) => {
        setMessage(text);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleAccept = async (connId: string) => {
        const success = await acceptConnectionInvite(connId);
        if (success) {
            showMessage('Despachante autorizado com sucesso!');
            loadConnections();
        } else {
            showMessage('Erro ao autorizar despachante.');
        }
    };

    const handleReject = async (connId: string) => {
        if (!window.confirm('Tem certeza que deseja recusar este despachante?')) return;

        const success = await deleteConnection(connId);
        if (success) {
            showMessage('Solicitação recusada.');
            loadConnections();
        } else {
            showMessage('Erro ao recusar solicitação.');
        }
    };

    // Filtra apenas as conexões que o CAC precisa aprovar
    const pendingInvites = connections.filter(c => c.status === 'pending_cac');

    if (isLoading) return null; // Silently load
    if (pendingInvites.length === 0 && !message) return null; // Mostra nada se não tiver convites pendentes

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in px-4 mt-4">
            {message && (
                <div className="p-3 rounded-md border bg-success bg-opacity-20 text-success border-success text-center">
                    {message}
                </div>
            )}

            {pendingInvites.map(conn => (
                <div key={conn.id} className="p-4 bg-warning bg-opacity-10 border border-warning rounded-md flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="material-icons text-warning text-3xl">notifications_active</span>
                        <div>
                            <p className="font-bold text-warning">Solicitação de Acesso</p>
                            <p className="text-sm">O despachante <strong>{conn.dispatcherNome}</strong> (CPF: {conn.dispatcherCpf}) solicitou acesso ao seu painel e acervo.</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <button
                            className="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white flex-1 md:flex-none justify-center"
                            onClick={() => handleReject(conn.id)}
                        >
                            Recusar
                        </button>
                        <button
                            className="btn btn-primary bg-warning hover:bg-yellow-600 text-black border-warning flex-1 md:flex-none justify-center"
                            onClick={() => handleAccept(conn.id)}
                        >
                            Autorizar Acesso
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
