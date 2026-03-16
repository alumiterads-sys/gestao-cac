import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    userName?: string;
    onLogout?: () => void;
    role?: 'admin' | 'user' | 'superadmin';
    isSuperAdminUser?: boolean; // Prop to know if the actual physical user is superadmin
    onSwitchRole?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, userName, onLogout, role = 'user', isSuperAdminUser, onSwitchRole }) => {
    const badgeColor = role === 'admin' ? '#f59e0b' : role === 'superadmin' ? '#a855f7' : 'var(--accent-primary)';

    return (
        <div className="app-layout">
            {/* Background Logo Watermark */}
            <div className="bg-watermark"></div>

            {/* Top Navbar */}
            <nav className="navbar glass-panel">
                <div className="container flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="G CAC Logo" className="navbar-logo" />
                        <div className="flex flex-col">
                            <h1 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                G CAC - GESTÃO DE DADOS CAC
                            </h1>
                            {role === 'admin' && (
                                <span style={{ fontSize: '0.85rem', color: badgeColor, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    {userName?.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="user-greeting">Olá, {userName || 'Usuário'}</span>
                        
                        {isSuperAdminUser && role !== 'superadmin' && onSwitchRole && (
                             <button
                               onClick={onSwitchRole}
                               className="btn bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 border border-accent-primary/30 flex items-center gap-2"
                               title="Voltar para a seleção de perfil"
                             >
                               <span className="material-icons text-sm">swap_horiz</span>
                               <span className="hidden sm:inline">Trocar Visão</span>
                             </button>
                        )}
                        
                        <button className="btn btn-secondary" onClick={onLogout}>Sair</button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container main-content animate-fade-in">
                {children}
            </main>
        </div>
    );
};
