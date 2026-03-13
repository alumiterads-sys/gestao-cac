import React from 'react';
import type { UserProfile, Weapon, TrafficGuide, IbamaDoc } from '../types';
import { isExpiringSoon, formatDateBR, getDaysRemaining } from '../utils';

interface DashboardProps {
    user: UserProfile;
    weapons: Weapon[];
    guides: TrafficGuide[];
    ibamaDoc?: IbamaDoc | null;
}

    import { fetchDispatcherName } from '../api';

    export const Dashboard: React.FC<DashboardProps> = ({ user, weapons, guides, ibamaDoc }) => {
        const [dispatcherName, setDispatcherName] = React.useState<string | null>(null);

        React.useEffect(() => {
            if (user.despachante_id) {
                fetchDispatcherName(user.despachante_id).then(name => {
                    if (name) setDispatcherName(name);
                });
            }
        }, [user.despachante_id]);

        // Coletar todos os alertas
        const alertas: any[] = [];

        // 1. CR do Usuário (30 dias)
        if (isExpiringSoon(user.vencimentoCR, 30)) {
            alertas.push({
                id: `cr-${user.id}`,
                tipo: 'CR',
                documento: `CR Nº ${user.numeroCR}`,
                vencimento: user.vencimentoCR,
                diasRestantes: getDaysRemaining(user.vencimentoCR)
            });
        }

        // 2. CRAF das Armas (30 dias)
        weapons.forEach(arma => {
            if (isExpiringSoon(arma.vencimentoCRAF, 60)) {
                alertas.push({
                    id: `craf-${arma.id}`,
                    tipo: 'CRAF',
                    documento: `CRAF - ${arma.fabricante} ${arma.modelo}`,
                    vencimento: arma.vencimentoCRAF,
                    diasRestantes: getDaysRemaining(arma.vencimentoCRAF)
                });
            }
        });

        // 3. Guias de Tráfego (GT) - 15 dias
        guides.forEach(gt => {
            if (isExpiringSoon(gt.vencimentoGT, 30)) {
                const armaOrigem = weapons.find(w => w.id === gt.weaponId);
                alertas.push({
                    id: `gt-${gt.id}`,
                    tipo: 'GT',
                    documento: `Guia de Tráfego - ${armaOrigem ? armaOrigem.modelo : 'Arma Indefinida'}`,
                    vencimento: gt.vencimentoGT,
                    diasRestantes: getDaysRemaining(gt.vencimentoGT)
                });
            }
        });

        // 4. Manejo IBAMA - 10 dias (Para cada propriedade cadastrada)
        if (ibamaDoc?.propriedades) {
            ibamaDoc.propriedades.forEach(prop => {
                if (isExpiringSoon(prop.vencimentoManejo, 10)) {
                    alertas.push({
                        id: `ibama-${prop.id}`,
                        tipo: 'Manejo',
                        documento: `Autorização Manejo - ${prop.nomeFazenda}`,
                        vencimento: prop.vencimentoManejo,
                        diasRestantes: getDaysRemaining(prop.vencimentoManejo)
                    });
                }
            });
        }

        // 5. CR do IBAMA (30 dias)
        if (ibamaDoc?.vencimentoCR && isExpiringSoon(ibamaDoc.vencimentoCR, 30)) {
            alertas.push({
                id: `ibama-cr-${ibamaDoc.id}`,
                tipo: 'CR',
                documento: `CR IBAMA Nº ${ibamaDoc.numeroCRIbama || 'Não Cadastrado'}`,
                vencimento: ibamaDoc.vencimentoCR,
                diasRestantes: getDaysRemaining(ibamaDoc.vencimentoCR)
            });
        }

        // Ordenar pelos que vencem mais rápido (dias restantes menores primeiro)
        alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);

        return (
            <div className="flex flex-col gap-4">
                {/* BANNER DE VÍNCULO AO DESPACHANTE */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl flex items-center justify-between text-white glass-panel animate-fade-in">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Status da Conta</span>
                        {user.despachante_id ? (
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-emerald-400 text-lg">verified_user</span>
                                <span className="font-bold text-emerald-400 text-lg">DESPACHANTE RESPONSÁVEL: {dispatcherName || 'Carregando...'}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-warning text-lg">public</span>
                                <span className="font-bold text-warning text-lg">CONTA AUTÔNOMA - NENHUM DESPACHANTE VINCULADO</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl shadow-xl glass-panel animate-fade-in" id="dashboard-alertas">
                    <h2 className="section-title text-danger mb-4">ALERTA DE VENCIMENTOS</h2>

            {alertas.length === 0 ? (
                <div className="glass-panel p-8 text-center border-success">
                    <p className="text-xl text-success">Nenhum documento perto do vencimento estipulado.</p>
                </div>
            ) : (
                <div className="alerts-grid">
                    {alertas.map(alerta => (
                        <div key={alerta.id} className="alert-card glass-panel flex flex-col gap-2 relative">
                            {alerta.diasRestantes <= 10 && (
                                <div className="absolute top-2 right-2 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
                                </div>
                            )}
                            <div className="flex justify-between items-start">
                                <span className={`badge ${alerta.diasRestantes <= 15 ? 'badge-danger' : 'badge-warning'}`}>
                                    {alerta.tipo}
                                </span>
                                <span className={`font-bold text-sm ${alerta.diasRestantes <= 15 ? 'text-danger' : 'text-warning'}`}>
                                    Vence em {alerta.diasRestantes} dias
                                </span>
                            </div>
                            <h3 className="font-bold">{alerta.documento}</h3>
                            <p className="text-sm text-muted">Acesso/Data Final: {formatDateBR(alerta.vencimento)}</p>

                            <a href={(alerta.tipo === 'Manejo' || alerta.tipo === 'CR' && alerta.id.startsWith('ibama')) ? '#modulo-ibama' : '#modulo-acervo'} className="btn btn-secondary mt-auto text-sm flex justify-center border-accent-primary text-accent-primary">
                                Ir para Registro
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </div>
    );
};
