import React, { useState, useEffect } from 'react';
import type { UserProfile, OrdemServico, DispatcherConnection } from '../types';
import { fetchOrdensServico, fetchDispatcherConnections } from '../api';

interface DashboardDespachanteProps {
    user: UserProfile;
}

export const DashboardDespachante: React.FC<DashboardDespachanteProps> = ({ user }) => {
    const [ordens, setOrdens] = useState<OrdemServico[]>([]);
    const [clientes, setClientes] = useState<DispatcherConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        const [osData, connData] = await Promise.all([
            fetchOrdensServico(user.id),
            fetchDispatcherConnections(user.id)
        ]);

        setOrdens(osData);
        setClientes(connData);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    const activeClientsCount = clientes.filter(c => c.status === 'active').length;
    const pendingClientsCount = clientes.filter(c => c.status === 'pending_cac').length;

    const openOrdens = ordens.filter(os => os.status !== 'concluida' && os.status !== 'cancelada');
    const openOrdensCount = openOrdens.length;

    // Calcula o faturamento estimado das ordens concluídas ou em andamento (opcional, foco em concluídas)
    const totalFaturado = ordens
        .filter(os => os.status === 'concluida')
        .reduce((sum, os) => sum + os.valor_cobrado, 0);

    if (isLoading) {
        return <div className="flex justify-center p-12"><span className="loading-spinner"></span></div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Visão Geral</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card Clientes Ativos */}
                <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-success">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-icons text-success text-3xl">people</span>
                        <h3 className="text-3xl font-bold">{activeClientsCount}</h3>
                    </div>
                    <div>
                        <p className="font-bold">Clientes Ativos</p>
                        <p className="text-xs text-muted">Acesso total aos acervos vinculados</p>
                    </div>
                </div>

                {/* Card Convites Pendentes */}
                <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-warning">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-icons text-warning text-3xl">schedule_send</span>
                        <h3 className="text-3xl font-bold">{pendingClientsCount}</h3>
                    </div>
                    <div>
                        <p className="font-bold">Aguardando Avaliação</p>
                        <p className="text-xs text-muted">Convites pendentes no app do cliente</p>
                    </div>
                </div>

                {/* Card OS Abertas */}
                <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-info">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-icons text-info text-3xl">assignment</span>
                        <h3 className="text-3xl font-bold">{openOrdensCount}</h3>
                    </div>
                    <div>
                        <p className="font-bold">O.S. em Aberto</p>
                        <p className="text-xs text-muted">Serviços sendo executados</p>
                    </div>
                </div>

                {/* Card Desempenho / Faturamento */}
                <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-accent-primary">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-icons text-accent-primary text-3xl">payments</span>
                        <h3 className="text-2xl font-bold">R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div>
                        <p className="font-bold">Faturamento Estimado</p>
                        <p className="text-xs text-muted">Total de O.S. concluídas</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Resumo Ordens Recentes */}
                <div className="glass-panel p-6 h-full">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-info">
                        <span className="material-icons">manage_search</span>
                        Serviços Recentes
                    </h3>
                    {ordens.length === 0 ? (
                        <p className="text-sm text-muted">Nenhuma Ordem de Serviço registrada.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {ordens.slice(0, 5).map(os => (
                                <div key={os.id} className="flex justify-between items-center border-b border-color-light pb-2 last:border-0">
                                    <div className="truncate pr-4">
                                        <p className="font-bold text-sm truncate">{os.servico_nome}</p>
                                        <p className="text-xs text-muted truncate">{os.cac_nome}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full border border-current ml-auto whitespace-nowrap ${os.status === 'concluida' ? 'text-success' :
                                            os.status === 'cancelada' ? 'text-danger' : 'text-info'
                                        }`}>
                                        {os.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mensagem Rápida */}
                <div className="glass-panel p-6 bg-accent-primary bg-opacity-10 border border-accent-primary border-opacity-30">
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-accent-primary">
                        <span className="material-icons">tips_and_updates</span>
                        Novo Painel Gestão CAC
                    </h3>
                    <p className="text-sm mb-4">
                        Bem-vindo(a) ao novo painel do Despachante. Aqui você pode gerenciar toda a sua carteira de clientes, tabela de preços e ordens de serviço.
                    </p>
                    <ul className="text-sm list-disc pl-5 flex flex-col gap-1 text-muted">
                        <li>Cadastre seus serviços na aba <strong>Meus Serviços</strong>.</li>
                        <li>Busque clientes pelo CPF em <strong>Clientes</strong> e envie convites.</li>
                        <li>Crie <strong>Ordens de Serviço</strong> vinculadas aos clientes ativos.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
