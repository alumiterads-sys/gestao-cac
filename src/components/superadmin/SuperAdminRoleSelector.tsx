import React from 'react';
import type { UserProfile } from '../../types';

interface SuperAdminRoleSelectorProps {
    user: UserProfile;
    onSelectRole: (role: 'superadmin' | 'admin' | 'user') => void;
    onLogout: () => void;
}

export const SuperAdminRoleSelector: React.FC<SuperAdminRoleSelectorProps> = ({ user, onSelectRole, onLogout }) => {
    return (
        <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center p-4 relative font-sans">
            <button 
                onClick={onLogout}
                className="absolute top-6 right-6 flex items-center gap-2 text-muted-foreground hover:text-white transition-colors p-2"
            >
                <span className="material-icons text-sm">logout</span>
                <span className="text-sm font-medium">Sair</span>
            </button>

            <div className="max-w-4xl w-full animate-fade-in flex flex-col items-center">
                <div className="w-16 h-16 bg-accent-primary/20 text-accent-primary rounded-full flex items-center justify-center mb-6 border border-accent-primary/30">
                    <span className="material-icons text-3xl">admin_panel_settings</span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
                    Bem-vindo(a), {user.nome.split(' ')[0]}
                </h1>
                <p className="text-muted-foreground text-center mb-10 max-w-lg">
                    Sua conta possui acesso irrestrito. Como você deseja utilizar o sistema neste momento?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                    
                    {/* Card: Super Admin */}
                    <button 
                        onClick={() => onSelectRole('superadmin')}
                        className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col hover:border-accent-primary/50 transition-all text-left group overflow-hidden relative min-h-[220px]"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-primary/5 rounded-bl-[100px] -z-0 group-hover:bg-accent-primary/10 transition-colors"></div>
                        
                        <div className="flex items-center gap-3 mb-4 z-10">
                            <span className="material-icons text-accent-primary text-3xl">shield</span>
                            <h3 className="text-xl font-bold text-white">Modo Gestor</h3>
                        </div>
                        <p className="text-muted-foreground text-sm flex-1 z-10 font-normal">
                            Acesso ao painel global da plataforma. Gerencie usuários, configurações financeiras e assinaturas.
                        </p>
                        <div className="mt-6 z-10 text-accent-primary text-sm font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                            Acessar Painel <span className="material-icons text-sm">arrow_forward</span>
                        </div>
                    </button>

                    {/* Card: Despachante */}
                    <button 
                        onClick={() => onSelectRole('admin')}
                        className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col hover:border-blue-500/50 transition-all text-left group overflow-hidden relative min-h-[220px]"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[100px] -z-0 group-hover:bg-blue-500/10 transition-colors"></div>
                        
                        <div className="flex items-center gap-3 mb-4 z-10">
                            <span className="material-icons text-blue-400 text-3xl">work</span>
                            <h3 className="text-xl font-bold text-white">Modo Despachante</h3>
                        </div>
                        <p className="text-muted-foreground text-sm flex-1 z-10 font-normal">
                            Gerencie sua carteira de clientes, acompanhe Ordens de Serviço e cadastre serviços prestados.
                        </p>
                        <div className="mt-6 z-10 text-blue-400 text-sm font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                            Acessar Painel <span className="material-icons text-sm">arrow_forward</span>
                        </div>
                    </button>

                    {/* Card: CAC */}
                    <button 
                        onClick={() => onSelectRole('user')}
                        className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col hover:border-emerald-500/50 transition-all text-left group overflow-hidden relative min-h-[220px]"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[100px] -z-0 group-hover:bg-emerald-500/10 transition-colors"></div>
                        
                        <div className="flex items-center gap-3 mb-4 z-10">
                            <span className="material-icons text-emerald-400 text-3xl">person</span>
                            <h3 className="text-xl font-bold text-white">Modo CAC</h3>
                        </div>
                        <p className="text-muted-foreground text-sm flex-1 z-10 font-normal">
                            Visão de usuário final. Gerencie seu próprio acervo, guias de tráfego e documentos pessoais.
                        </p>
                        <div className="mt-6 z-10 text-emerald-400 text-sm font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                            Acessar Painel <span className="material-icons text-sm">arrow_forward</span>
                        </div>
                    </button>

                </div>
                
                <p className="text-xs text-muted-foreground/50 mt-12 text-center max-w-lg">
                    Selecione o modo de navegação. Você poderá alternar entre os perfis a qualquer momento usando a opção "Trocar Visão" no menu superior.
                </p>
            </div>
        </div>
    );
};
