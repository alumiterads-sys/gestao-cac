import React, { useState, useEffect } from 'react';
import type { ConfiguracoesGlobais } from '../../types';
import { fetchConfiguracoesGlobais, updateConfiguracoesGlobais } from '../../api/financeiro';

export const GlobalFinancialSettings: React.FC = () => {
    const [config, setConfig] = useState<ConfiguracoesGlobais | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Form states
    const [setupDespachante, setSetupDespachante] = useState<string>('');
    const [mensalidadeDespachante, setMensalidadeDespachante] = useState<string>('');
    const [planoCacSemestral, setPlanoCacSemestral] = useState<string>('');
    const [planoCacAnual, setPlanoCacAnual] = useState<string>('');
    const [metaCacDesconto, setMetaCacDesconto] = useState<string>('');
    const [percentualDesconto, setPercentualDesconto] = useState<string>('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        const data = await fetchConfiguracoesGlobais();
        if (data) {
            setConfig(data);
            setSetupDespachante(data.taxa_setup_despachante.toString());
            setMensalidadeDespachante(data.mensalidade_despachante.toString());
            setPlanoCacSemestral(data.plano_cac_semestral.toString());
            setPlanoCacAnual(data.plano_cac_anual.toString());
            setMetaCacDesconto(data.meta_cac_desconto.toString());
            setPercentualDesconto(data.percentual_desconto_meta.toString());
        }
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!config) return;

        setIsSaving(true);
        const updates: Partial<ConfiguracoesGlobais> = {
            taxa_setup_despachante: parseFloat(setupDespachante),
            mensalidade_despachante: parseFloat(mensalidadeDespachante),
            plano_cac_semestral: parseFloat(planoCacSemestral),
            plano_cac_anual: parseFloat(planoCacAnual),
            meta_cac_desconto: parseInt(metaCacDesconto, 10),
            percentual_desconto_meta: parseFloat(percentualDesconto),
        };

        const success = await updateConfiguracoesGlobais(config.id, updates);
        
        if (success) {
            setMessage({ text: 'Configurações globais salvas com sucesso!', type: 'success' });
            setConfig({ ...config, ...updates });
        } else {
            setMessage({ text: 'Erro ao salvar as configurações. Tente novamente.', type: 'error' });
        }
        setIsSaving(false);
        
        setTimeout(() => setMessage(null), 5000);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <span className="loading-spinner"></span>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-center">
                Não foi possível carregar as configurações do banco de dados (tabela configuracoes_globais parece vazia).
            </div>
        );
    }

    return (
        <div className="bg-[#1c1c24] border border-white/10 rounded-xl p-6 shadow-xl w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <span className="material-icons text-accent-primary text-3xl">account_balance_wallet</span>
                <div>
                    <h2 className="text-xl font-bold text-white">Configurações Financeiras Globais</h2>
                    <p className="text-sm text-muted-foreground">Estes valores definem os preços base de todas as futuras faturas do G-CAC.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                    <span className="material-icons text-lg">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Preços Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-muted-foreground">Setup Despachante (R$)</label>
                        <input 
                            type="number" step="0.01" min="0" required
                            value={setupDespachante} onChange={(e) => setSetupDespachante(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-accent-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-muted-foreground">Mensalidade Desp. (R$)</label>
                        <input 
                            type="number" step="0.01" min="0" required
                            value={mensalidadeDespachante} onChange={(e) => setMensalidadeDespachante(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-accent-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-muted-foreground">CAC Semestral (R$)</label>
                        <input 
                            type="number" step="0.01" min="0" required
                            value={planoCacSemestral} onChange={(e) => setPlanoCacSemestral(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-accent-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-muted-foreground">CAC Anual (R$)</label>
                        <input 
                            type="number" step="0.01" min="0" required
                            value={planoCacAnual} onChange={(e) => setPlanoCacAnual(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-accent-primary focus:outline-none"
                        />
                    </div>
                </div>

                {/* Gamificação / Metas */}
                <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-5 mt-4">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <span className="material-icons text-accent-primary">emoji_events</span>
                        Regras de Gamificação e Desconto (Para Despachantes)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-muted-foreground">Meta de CACs Pagtos no Mês (Qtd)</label>
                            <input 
                                type="number" step="1" min="1" required
                                value={metaCacDesconto} onChange={(e) => setMetaCacDesconto(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-accent-primary focus:outline-none"
                                title="Quantos clientes precisam pagar a assinatura neste mês para que o despachante parceiro ganhe o desconto?"
                            />
                            <span className="text-xs text-muted-foreground/60 italic">Ex: 10 clientes pagantes ativam o trigger.</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-muted-foreground">Desconto na Próxima Fatura (%)</label>
                            <input 
                                type="number" step="0.01" min="0" max="100" required
                                value={percentualDesconto} onChange={(e) => setPercentualDesconto(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-accent-primary focus:outline-none"
                            />
                             <span className="text-xs text-muted-foreground/60 italic">Ex: 20 reduzirá a fatura de R$ 150 para R$ 120 automaticamente.</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-white/10 pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-accent-primary text-black font-bold py-3 px-8 rounded-lg hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <span className="loading-spinner w-4 h-4 border-2"></span>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <span className="material-icons text-sm">save</span>
                                Salvar Configurações
                            </>
                        )}
                    </button>
                </div>
            </form>

        </div>
    );
};
