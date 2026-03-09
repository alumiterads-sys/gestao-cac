import React, { useState, useEffect } from 'react';
import type { UserProfile, OrdemServico, DispatcherConnection } from '../types';
import { fetchOrdensServico, fetchDispatcherConnections, fetchClientsDashboardData, fetchClientesAvulsos } from '../api';
import { isExpiringSoon, formatDateBR, getDaysRemaining } from '../utils';

interface DashboardDespachanteProps {
    user: UserProfile;
}

export const DashboardDespachante: React.FC<DashboardDespachanteProps> = ({ user }) => {
    const [ordens, setOrdens] = useState<OrdemServico[]>([]);
    const [clientes, setClientes] = useState<DispatcherConnection[]>([]);
    const [clientesAvulsos, setClientesAvulsos] = useState<number>(0);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        const [osData, connData] = await Promise.all([
            fetchOrdensServico(user.id),
            fetchDispatcherConnections(user.id)
        ]);

        setOrdens(osData);
        setClientes(connData);
        const avulsoData = await fetchClientesAvulsos(user.id);
        setClientesAvulsos(avulsoData.length);

        // Alertas de Vencimento dos Clientes Ativos
        const newAlertas: any[] = [];
        const activeIds = connData.filter(c => c.status === 'active').map(c => c.cacId);

        if (activeIds.length > 0) {
            const { profiles, weapons, guides, ibamaDocs } = await fetchClientsDashboardData(activeIds);

            // 1. CR
            profiles.forEach((p: any) => {
                if (p.vencimento_cr && isExpiringSoon(p.vencimento_cr, 30)) {
                    newAlertas.push({
                        id: `cr-${p.id}`, clienteNome: p.nome, tipo: 'CR',
                        documento: `CR Nº ${p.numero_cr}`, vencimento: p.vencimento_cr, diasRestantes: getDaysRemaining(p.vencimento_cr)
                    });
                }
            });
            // 2. CRAF
            weapons.forEach((w: any) => {
                if (w.vencimento_craf && isExpiringSoon(w.vencimento_craf, 60)) {
                    const prof = profiles.find((p: any) => p.id === w.cliente_id);
                    newAlertas.push({
                        id: `craf-${w.id}`, clienteNome: prof?.nome || 'Desconhecido', tipo: 'CRAF',
                        documento: `CRAF - ${w.fabricante} ${w.modelo_arma}`, vencimento: w.vencimento_craf, diasRestantes: getDaysRemaining(w.vencimento_craf)
                    });
                }
            });
            // 3. GT
            guides.forEach((g: any) => {
                if (g.vencimento_gt && isExpiringSoon(g.vencimento_gt, 30)) {
                    const prof = profiles.find((p: any) => p.id === g.cliente_id);
                    newAlertas.push({
                        id: `gt-${g.id}`, clienteNome: prof?.nome || 'Desconhecido', tipo: 'GT',
                        documento: `Guia de Tráfego`, vencimento: g.vencimento_gt, diasRestantes: getDaysRemaining(g.vencimento_gt)
                    });
                }
            });
            // 4. IBAMA
            ibamaDocs.forEach((i: any) => {
                if (i.venc_cr_ibama && isExpiringSoon(i.venc_cr_ibama, 30)) {
                    const prof = profiles.find((p: any) => p.id === i.cliente_id);
                    newAlertas.push({
                        id: `ibama-${i.id}`, clienteNome: prof?.nome || 'Desconhecido', tipo: 'CR IBAMA',
                        documento: `CR IBAMA`, vencimento: i.venc_cr_ibama, diasRestantes: getDaysRemaining(i.venc_cr_ibama)
                    });
                }
            });

            newAlertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
        }

        setAlertas(newAlertas);

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    const activeClientsCount = clientes.filter(c => c.status === 'active').length;
    const totalClientsCount = activeClientsCount + clientesAvulsos;
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
                <div className="glass-panel p-5 flex flex-col justify-between border-l-4 border-l-success relative overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-success mb-1">Total de Clientes</p>
                            <h3 className="text-4xl font-black mt-1 tracking-tight">{totalClientsCount}</h3>
                        </div>
                        <div className="p-3 bg-success bg-opacity-20 rounded-xl">
                            <span className="material-icons text-success text-3xl">people</span>
                        </div>
                    </div>
                    <div className="mt-4 z-10">
                        <p className="text-xs text-muted leading-tight">
                            <span className="text-success font-bold">{activeClientsCount} via App</span>
                            {' · '}
                            <span className="text-warning font-bold">{clientesAvulsos} Sem App</span>
                        </p>
                    </div>
                </div>

                {/* Card Convites Pendentes */}
                <div className="glass-panel p-5 flex flex-col justify-between border-l-4 border-l-warning relative overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-warning mb-1">Aguardando</p>
                            <h3 className="text-4xl font-black mt-1 tracking-tight">{pendingClientsCount}</h3>
                        </div>
                        <div className="p-3 bg-warning bg-opacity-20 rounded-xl">
                            <span className="material-icons text-warning text-3xl">schedule_send</span>
                        </div>
                    </div>
                    <div className="mt-4 z-10">
                        <p className="text-xs text-muted leading-tight">Convites de acesso<br />pendentes</p>
                    </div>
                </div>

                {/* Card OS Abertas */}
                <div className="glass-panel p-5 flex flex-col justify-between border-l-4 border-l-info relative overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-info mb-1">O.S. em Aberto</p>
                            <h3 className="text-4xl font-black mt-1 tracking-tight">{openOrdensCount}</h3>
                        </div>
                        <div className="p-3 bg-info bg-opacity-20 rounded-xl">
                            <span className="material-icons text-info text-3xl">assignment</span>
                        </div>
                    </div>
                    <div className="mt-4 z-10">
                        <p className="text-xs text-muted leading-tight">Serviços sendo<br />executados</p>
                    </div>
                </div>

                {/* Card Desempenho / Faturamento */}
                <div className="glass-panel p-5 flex flex-col justify-between border-l-4 border-l-accent-primary relative overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-accent-primary mb-1">Faturamento</p>
                            <h3 className="text-2xl font-black mt-1 tracking-tight">R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-3 bg-accent-primary bg-opacity-20 rounded-xl">
                            <span className="material-icons text-accent-primary text-3xl">payments</span>
                        </div>
                    </div>
                    <div className="mt-4 z-10">
                        <p className="text-xs text-muted leading-tight">Estimativa total de<br />O.S. concluídas</p>
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

                {/* Alertas de Vencimento dos Clientes */}
                <div className="glass-panel p-6 h-full flex flex-col border-l-4 border-l-danger">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-danger">
                        <span className="material-icons">warning</span>
                        Documentos a Vencer ({alertas.length})
                    </h3>

                    {alertas.length === 0 ? (
                        <div className="text-center p-6 text-success border border-success border-opacity-30 rounded-lg mt-auto mb-auto flex flex-col items-center">
                            <span className="material-icons text-4xl mb-2">check_circle</span>
                            <p className="text-sm font-bold">Tudo em dia!</p>
                            <p className="text-xs text-muted mt-1">Nenhum documento vencendo nos próximos 30 dias.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar max-h-80 pr-1">
                            {alertas.map(alerta => {
                                const isUrgent = alerta.diasRestantes <= 15;
                                const tipoIcone: Record<string, string> = {
                                    'CRAF': 'military_tech',
                                    'CR': 'badge',
                                    'GT': 'local_shipping',
                                    'CR IBAMA': 'park',
                                };
                                const icone = tipoIcone[alerta.tipo] || 'description';
                                return (
                                    <div
                                        key={alerta.id}
                                        className={`rounded-lg border flex overflow-hidden ${
                                            isUrgent
                                                ? 'border-danger border-opacity-50 bg-danger bg-opacity-5'
                                                : 'border-warning border-opacity-40 bg-warning bg-opacity-5'
                                        }`}
                                    >
                                        {/* Barra lateral de urgência */}
                                        <div className={`w-1.5 flex-shrink-0 ${isUrgent ? 'bg-danger' : 'bg-warning'}`} />

                                        {/* Ícone do tipo de documento */}
                                        <div className={`flex items-center justify-center px-3 flex-shrink-0 ${
                                            isUrgent ? 'text-danger' : 'text-warning'
                                        }`}>
                                            <span className="material-icons text-2xl">{icone}</span>
                                        </div>

                                        {/* Conteúdo principal */}
                                        <div className="flex-1 py-3 pr-2 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex-shrink-0 ${
                                                    isUrgent ? 'bg-danger text-white' : 'bg-warning text-black'
                                                }`}>
                                                    {alerta.tipo}
                                                </span>
                                                <p className="font-bold text-sm truncate text-white">{alerta.clienteNome}</p>
                                            </div>
                                            <p className="text-xs text-muted truncate">{alerta.documento}</p>
                                            <p className="text-[10px] text-muted mt-1">Vence: {formatDateBR(alerta.vencimento)}</p>
                                        </div>

                                        {/* Contador de dias */}
                                        <div className={`flex flex-col items-center justify-center px-4 flex-shrink-0 border-l ${
                                            isUrgent ? 'border-danger border-opacity-30' : 'border-warning border-opacity-30'
                                        }`}>
                                            <span className={`text-2xl font-black leading-none ${
                                                isUrgent ? 'text-danger' : 'text-warning'
                                            }`}>
                                                {alerta.diasRestantes}
                                            </span>
                                            <span className={`text-[9px] font-bold uppercase mt-0.5 ${
                                                isUrgent ? 'text-danger' : 'text-warning'
                                            }`}>dias</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
