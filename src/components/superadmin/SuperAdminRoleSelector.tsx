import React from 'react';
import type { UserProfile } from '../../types';

interface SuperAdminRoleSelectorProps {
    user: UserProfile;
    onSelectRole: (role: 'superadmin' | 'admin' | 'user') => void;
    onLogout: () => void;
}

export const SuperAdminRoleSelector: React.FC<SuperAdminRoleSelectorProps> = ({ user, onSelectRole, onLogout }) => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
            {/* Background Logo Watermark (reused from Layout) */}
            <div className="bg-watermark"></div>

            <button 
                onClick={onLogout}
                className="absolute top-6 right-6 flex items-center gap-2 text-muted-foreground hover:text-white transition-colors p-2"
            >
                <span className="material-icons text-[1.2rem]">logout</span>
                <span className="text-sm font-bold uppercase tracking-wider">Sair</span>
            </button>


            {/* Logo fora do container animado para mix-blend-mode funcionar corretamente */}
            <img src="/logo.png" alt="G CAC Logo" className="navbar-logo" style={{ height: '120px', marginBottom: '1.5rem', position: 'relative', zIndex: 10 }} />

            <div style={{ maxWidth: '56rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }} className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center tracking-tight">
                    Bem-vindo(a), {user.nome.split(' ')[0]}
                </h1>
                <p className="text-muted-foreground text-center mb-10 max-w-lg text-[1rem]">
                    Sua conta possui acesso irrestrito master. Escolha o painel que deseja visualizar:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                    
                    {/* Card: Super Admin */}
                    <button 
                        onClick={() => onSelectRole('superadmin')}
                        className="glass-panel text-left p-6 flex flex-col hover:border-[#a855f7] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all group overflow-hidden relative cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#a855f7]/5 rounded-bl-[100px] -z-0 group-hover:bg-[#a855f7]/10 transition-colors"></div>
                        
                        <div className="flex items-center gap-3 mb-4 z-10">
                            <span className="material-icons text-[2rem]" style={{ color: '#a855f7' }}>shield</span>
                            <h3 className="text-xl font-bold text-white">Modo Gestor</h3>
                        </div>
                        <p className="text-muted-foreground text-sm flex-1 z-10 font-normal leading-relaxed">
                            Acesso ao painel global da plataforma. Gerencie usuários, faturamento e integrações B2B.
                        </p>
                        <div className="mt-6 z-10 text-sm font-bold flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: '#a855f7' }}>
                            Acessar Painel <span className="material-icons text-sm">arrow_forward</span>
                        </div>
                    </button>

                    {/* Card: Despachante */}
                    <button 
                        onClick={() => onSelectRole('admin')}
                        className="glass-panel text-left p-6 flex flex-col hover:border-[#f59e0b] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all group overflow-hidden relative cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#f59e0b]/5 rounded-bl-[100px] -z-0 group-hover:bg-[#f59e0b]/10 transition-colors"></div>
                        
                        <div className="flex items-center gap-3 mb-4 z-10">
                            <span className="material-icons text-[2rem]" style={{ color: '#f59e0b' }}>work</span>
                            <h3 className="text-xl font-bold text-white">Modo Despachante</h3>
                        </div>
                        <p className="text-muted-foreground text-sm flex-1 z-10 font-normal leading-relaxed">
                            Gerencie sua carteira de clientes, acompanhe O.S. e efetue o controle da sua assessoria (B2B).
                        </p>
                        <div className="mt-6 z-10 text-sm font-bold flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: '#f59e0b' }}>
                            Acessar Painel <span className="material-icons text-sm">arrow_forward</span>
                        </div>
                    </button>

                    {/* Card: CAC */}
                    <button 
                        onClick={() => onSelectRole('user')}
                        className="glass-panel text-left p-6 flex flex-col hover:border-[var(--accent-primary)] hover:shadow-[0_0_20px_var(--accent-glow)] transition-all group overflow-hidden relative cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-primary)]/5 rounded-bl-[100px] -z-0 group-hover:bg-[var(--accent-primary)]/10 transition-colors"></div>
                        
                        <div className="flex items-center gap-3 mb-4 z-10">
                            <span className="material-icons text-[2rem] text-accent-primary">person</span>
                            <h3 className="text-xl font-bold text-white">Modo CAC</h3>
                        </div>
                        <p className="text-muted-foreground text-sm flex-1 z-10 font-normal leading-relaxed">
                            Visão de usuário final (B2C). Gerencie seu próprio acervo, guias de tráfego e licenças.
                        </p>
                        <div className="mt-6 z-10 text-accent-primary text-sm font-bold flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                            Acessar Painel <span className="material-icons text-sm">arrow_forward</span>
                        </div>
                    </button>

                </div>
                
                <p className="text-[11px] uppercase tracking-widest text-[#94a3b8] mt-16 text-center max-w-lg font-bold">
                    Use o botão "Trocar Visão" ↔️ no topo da tela caso queira mudar de ideia depois.
                </p>
            </div>
        </div>
    );
};
