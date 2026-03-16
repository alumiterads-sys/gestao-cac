import React, { useState } from 'react';
import type { UserProfile } from '../types';

interface FirstAccessModalProps {
    user: UserProfile;
    onComplete: (updatedUser: UserProfile) => void;
}

export const FirstAccessModal: React.FC<FirstAccessModalProps> = ({ user, onComplete }) => {
    const [email, setEmail] = useState(user.email || '');
    const [clube, setClube] = useState(user.clubeFiliado || '');
    const [cr, setCr] = useState(user.numeroCR || '');
    const [crValidade, setCrValidade] = useState(user.vencimentoCR || '');
    
    const initialAtiv = user.atividadesCR || [];
    const [ativAtirador, setAtivAtirador] = useState(initialAtiv.includes('Atirador Desportivo'));
    const [ativCacador, setAtivCacador] = useState(initialAtiv.includes('Caçador'));
    const [ativColecionador, setAtivColecionador] = useState(initialAtiv.includes('Colecionador'));
    
    const [nivelAtirador, setNivelAtirador] = useState<'1' | '2' | '3' | ''>(user.nivelAtirador || '');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!ativAtirador && !ativCacador && !ativColecionador) {
            setError('Selecione pelo menos uma Atividade Ativa no CR (*).');
            return;
        }

        if (ativAtirador && !nivelAtirador) {
            setError('Por favor, selecione seu Nível de Atirador.');
            return;
        }

        setIsLoading(true);

        const atividades: string[] = [];
        if (ativAtirador) atividades.push('Atirador Desportivo');
        if (ativCacador) atividades.push('Caçador');
        if (ativColecionador) atividades.push('Colecionador');

        const updatedProfile: UserProfile = {
            ...user,
            email,
            clubeFiliado: clube,
            numeroCR: cr,
            vencimentoCR: crValidade,
            atividadesCR: atividades,
            nivelAtirador: ativAtirador ? (nivelAtirador as '1' | '2' | '3') : undefined
        };

        // Chama o callback passando os dados preenchidos para a camada superior (App.tsx)
        await onComplete(updatedProfile);
        
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-md p-4 animate-fade-in custom-scrollbar overflow-y-auto">
            <div className="bg-[#1c1c24] border border-accent-primary/50 shadow-[0_0_30px_rgba(255,215,0,0.15)] rounded-2xl w-full max-w-2xl flex flex-col my-8">
                
                {/* Cabeçalho */}
                <div className="p-6 md:p-8 text-center border-b border-white/10 bg-white/5 rounded-t-2xl">
                    <div className="w-16 h-16 bg-accent-primary/20 text-accent-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-primary/30">
                        <span className="material-icons text-3xl">how_to_reg</span>
                    </div>
                    <h2 className="text-2xl font-bold font-heading text-white">Completar Cadastro</h2>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Olá <strong className="text-white">{user.nome}</strong>! Identificamos que seu perfil foi criado internamente. 
                        Para acessar a plataforma, precisamos que você preencha suas informações como CAC.
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-muted-foreground">E-mail (Opcional)</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                                placeholder="Seu melhor e-mail..."
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-muted-foreground">Clube Fíliado (Opcional)</label>
                            <input 
                                type="text" 
                                value={clube}
                                onChange={(e) => setClube(e.target.value)}
                                className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                                placeholder="Nome do clube principal..."
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-muted-foreground">Número do CR (Opcional)</label>
                            <input 
                                type="text" 
                                value={cr}
                                onChange={(e) => setCr(e.target.value)}
                                className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-muted-foreground">Validade do CR (Opcional)</label>
                            <input 
                                type="date" 
                                value={crValidade}
                                onChange={(e) => setCrValidade(e.target.value)}
                                className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-5 rounded-xl mt-2">
                        <label className="text-sm font-semibold text-white mb-3 block border-b border-white/10 pb-2">
                            Quais são suas atividades no CR? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ativAtirador ? 'bg-accent-primary border-accent-primary' : 'border-white/30 group-hover:border-accent-primary/60'}`}>
                                    {ativAtirador && <span className="material-icons text-black text-sm">check</span>}
                                </div>
                                <input type="checkbox" className="hidden" checked={ativAtirador} onChange={e => setAtivAtirador(e.target.checked)} />
                                <span className={ativAtirador ? 'text-white font-medium' : 'text-muted-foreground'}>Atirador Desportivo</span>
                            </label>

                            {ativAtirador && (
                                <div className="ml-8 mb-2 p-4 bg-black/30 border border-accent-primary/30 rounded-lg flex flex-col gap-2 animate-fade-in relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary"></div>
                                    <label className="text-sm font-semibold text-white">Selecione seu Nível de Atirador:</label>
                                    <select
                                        value={nivelAtirador}
                                        onChange={(e) => setNivelAtirador(e.target.value as any)}
                                        className="input-field bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                                    >
                                        <option value="" disabled>--- Escolha um nível ---</option>
                                        <option value="1">Nível 1 (Mínimo de 8 treinamentos anuais)</option>
                                        <option value="2">Nível 2 (Mínimo de 12 treinamentos anuais + 4 competições)</option>
                                        <option value="3">Nível 3 (Mínimo de 20 treinamentos anuais + 6 competições)</option>
                                    </select>
                                </div>
                            )}

                            <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ativCacador ? 'bg-accent-primary border-accent-primary' : 'border-white/30 group-hover:border-accent-primary/60'}`}>
                                    {ativCacador && <span className="material-icons text-black text-sm">check</span>}
                                </div>
                                <input type="checkbox" className="hidden" checked={ativCacador} onChange={e => setAtivCacador(e.target.checked)} />
                                <span className={ativCacador ? 'text-white font-medium' : 'text-muted-foreground'}>Caçador</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ativColecionador ? 'bg-accent-primary border-accent-primary' : 'border-white/30 group-hover:border-accent-primary/60'}`}>
                                    {ativColecionador && <span className="material-icons text-black text-sm">check</span>}
                                </div>
                                <input type="checkbox" className="hidden" checked={ativColecionador} onChange={e => setAtivColecionador(e.target.checked)} />
                                <span className={ativColecionador ? 'text-white font-medium' : 'text-muted-foreground'}>Colecionador</span>
                            </label>
                        </div>
                    </div>

                    {/* Footer / Botão */}
                    <div className="mt-4 pt-6 border-t border-white/10">
                        <button 
                            type="submit" 
                            className="w-full py-4 rounded-xl font-bold transition-all bg-accent-primary text-black hover:brightness-110 flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="loading-spinner w-6 h-6 border-2"></span>
                            ) : (
                                <>
                                    <span>CONCLUIR CADASTRO E ACESSAR</span>
                                    <span className="material-icons">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};
