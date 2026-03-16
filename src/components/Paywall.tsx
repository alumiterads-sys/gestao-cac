import React from 'react';

interface PaywallProps {
    tipoCliente: 'despachante_base' | 'cac';
    planoPrecoSemestral?: number;
    planoPrecoAnual?: number;
    mensalidadeDespachante?: number;
    onAssinar: (planoId: string) => void;
    onLogout: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ 
    tipoCliente, 
    planoPrecoSemestral = 69.90, 
    planoPrecoAnual = 120.00,
    mensalidadeDespachante = 150.00,
    onAssinar,
    onLogout
}) => {
    
    return (
        <div className="min-h-screen w-full bg-[#121214] flex flex-col items-center justify-center p-4">
            
            <div className="absolute top-6 right-6">
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors p-2"
                >
                    <span className="material-icons text-sm">logout</span>
                    <span className="text-sm font-medium">Sair</span>
                </button>
            </div>

            <div className="max-w-3xl w-full text-center mb-10 animate-fade-in">
                <div className="w-20 h-20 bg-accent-primary/20 text-accent-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-primary/30">
                    <span className="material-icons text-4xl">lock_clock</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading tracking-tight">
                    {tipoCliente === 'despachante_base' 
                        ? 'Sua licença expirou' 
                        : 'Acesso Premium Necessário'}
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    {tipoCliente === 'despachante_base'
                        ? 'Renove sua assinatura para continuar gerenciando seus clientes e processos com a melhor plataforma do mercado.'
                        : 'Para visualizar seus PDFs na nuvem, emitir relatórios e receber alertas no WhatsApp, você precisa de um plano ativo.'}
                </p>
            </div>

            {/* Planos Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
                
                {tipoCliente === 'cac' && (
                    <>
                        {/* Plano Semestral */}
                        <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col hover:border-white/30 transition-all relative overflow-hidden group">
                            <h3 className="text-xl font-bold text-white mb-2">Plano Semestral</h3>
                            <p className="text-muted-foreground text-sm mb-6">Acesso total por 6 meses.</p>
                            
                            <div className="mb-6 flex items-end gap-1">
                                <span className="text-3xl font-bold text-white">R$ {planoPrecoSemestral.toFixed(2).replace('.', ',')}</span>
                                <span className="text-muted-foreground mb-1">/ 6 meses</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-icons text-green-500 text-sm">check_circle</span> Alertas via WhatsApp
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-icons text-green-500 text-sm">check_circle</span> Armazenamento em Nuvem Seguro
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-icons text-green-500 text-sm">check_circle</span> Download Fácil
                                </li>
                            </ul>

                            <button 
                                onClick={() => onAssinar('cac_semestral')}
                                className="w-full py-3 rounded-lg border border-accent-primary text-accent-primary font-bold hover:bg-accent-primary hover:text-black transition-colors"
                            >
                                Assinar Semestral
                            </button>
                        </div>

                        {/* Plano Anual - Destaque */}
                        <div className="bg-gradient-to-br from-[#2a2a35] to-[#1c1c24] border-2 border-accent-primary rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden transform md:-translate-y-4 shadow-[0_10px_40px_rgba(255,215,0,0.15)]">
                            <div className="absolute top-0 right-0 bg-accent-primary text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                                MAIS POPULAR
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">Plano Anual</h3>
                            <p className="text-accent-primary/80 text-sm mb-6 font-medium">Melhor custo benefício (Economize 15%).</p>
                            
                            <div className="mb-6 flex items-end gap-1">
                                <span className="text-3xl font-bold text-white">R$ {planoPrecoAnual.toFixed(2).replace('.', ',')}</span>
                                <span className="text-muted-foreground mb-1">/ ano</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-icons text-accent-primary text-sm">stars</span> Tudo do plano Semestral
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-icons text-accent-primary text-sm">stars</span> Um ano inteiro livre de anúncios
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-icons text-accent-primary text-sm">stars</span> Suporte Prioritário
                                </li>
                            </ul>

                            <button 
                                onClick={() => onAssinar('cac_anual')}
                                className="w-full py-4 rounded-lg bg-accent-primary text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all"
                            >
                                Assinar Plano Anual
                            </button>
                        </div>
                    </>
                )}

                {tipoCliente === 'despachante_base' && (
                    <div className="col-span-1 md:col-span-2 max-w-md mx-auto w-full">
                        <div className="bg-gradient-to-br from-[#2a2a35] to-[#1c1c24] border-2 border-accent-primary rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-[0_10px_40px_rgba(255,215,0,0.15)]">
                            <h3 className="text-xl font-bold text-white mb-2 text-center">Plano Despachante Parceiro</h3>
                            <p className="text-accent-primary/80 text-sm mb-6 font-medium text-center">Gerencie ilimitados CACs na sua base.</p>
                            
                            <div className="mb-6 flex flex-col items-center gap-1">
                                <span className="text-4xl font-bold text-white">R$ {mensalidadeDespachante.toFixed(2).replace('.', ',')}</span>
                                <span className="text-muted-foreground text-sm">/ mês</span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-icons text-accent-primary text-sm">check_circle</span> Gestão ilimitada de CACs (Dados em texto)
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-icons text-accent-primary text-sm">check_circle</span> Receba Ordens de Serviço App
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-icons text-accent-primary text-sm">emoji_events</span> Desconto na fatura se seus clientes assinarem
                                </li>
                            </ul>

                            <button 
                                onClick={() => onAssinar('despachante_base')}
                                className="w-full py-4 rounded-lg bg-accent-primary text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all"
                            >
                                Reativar Licença
                            </button>
                        </div>
                    </div>
                )}
                
            </div>
            
            <div className="mt-12 text-center text-xs text-muted-foreground/50">
                Pagamentos processados de forma segura por PIX Automático Recorrente. <br/>
                Cancelamento pode ser feito a qualquer momento antes do próximo faturamento.
            </div>

        </div>
    );
};
