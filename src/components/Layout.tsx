import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    userName?: string;
    onLogout?: () => void;
    role?: 'admin' | 'user';
}

export const Layout: React.FC<LayoutProps> = ({ children, userName, onLogout, role = 'user' }) => {
    const title = role === 'admin' ? 'Painel do Despachante' : 'Gestão Pessoal CAC';
    const badgeColor = role === 'admin' ? '#f59e0b' : 'var(--accent-primary)';

    return (
        <div className="app-layout">
            {/* Background Logo Watermark */}
            <div className="bg-watermark"></div>

            {/* Top Navbar */}
            <nav className="navbar glass-panel">
                <div className="container flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="GCAC Logo" className="navbar-logo" />
                        <div className="flex flex-col">
                            <h1 className="navbar-title">{title}</h1>
                            {role === 'admin' && (
                                <span style={{ fontSize: '0.65rem', color: badgeColor, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    ● ADMINISTRADOR
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="user-greeting">Olá, {userName || 'Usuário'}</span>
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
