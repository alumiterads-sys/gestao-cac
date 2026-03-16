import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { HierarchyView } from './components/HierarchyView';
import { IbamaView } from './components/IbamaView';
import { Login } from './components/Login';
import { ClientsView } from './components/ClientsView';
import { CacConnectionAlerts } from './components/CacConnectionAlerts';
import { DashboardDespachante } from './components/DashboardDespachante';
import { ServicosView } from './components/ServicosView';
import { OrdensServicoView } from './components/OrdensServicoView';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { FirstAccessModal } from './components/FirstAccessModal';
import { Paywall } from './components/Paywall';
import { SuperAdminRoleSelector } from './components/superadmin/SuperAdminRoleSelector';
import { fetchAssinaturasDoUsuario, fetchConfiguracoesGlobais } from './api/financeiro';
import * as Tabs from '@radix-ui/react-tabs';
import {
  fetchWeapons, createWeapon, updateWeapon, deleteWeapon,
  fetchGuides, createGuide, updateGuide, deleteGuide,
  fetchIbamaDoc, saveIbamaDoc,
  createIbamaProperty, updateIbamaProperty, deleteIbamaProperty,
  fetchUserProfileById
} from './api';
import { updateUserProfile } from './db';
import type { UserProfile, Weapon, TrafficGuide, IbamaDoc, IbamaProperty } from './types';

export const App: React.FC = () => {
  // ─── Sessão do Usuário ────────────────────────────────────
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('gcac_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  // ─── Dados CAC ────────────────────────────────────────────
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [guides, setGuides] = useState<TrafficGuide[]>([]);
  const [ibamaDoc, setIbamaDoc] = useState<IbamaDoc | null>(null);

  // Financial States
  const [globalConfig, setGlobalConfig] = useState<any>(null);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  // ─── Super Admin Role Switcher State ──────────────────────
  const [currentViewRole, setCurrentViewRole] = useState<'admin' | 'user' | 'superadmin' | null>(null);

  // ─── Carrega dados do Supabase ao logar ───────────────────
  useEffect(() => {
    if (!user) return;

    localStorage.setItem('gcac_session_user', JSON.stringify(user));

    // Redirecionar admin para painel admin ou superadmin
    if (user.role === 'admin' || user.role === 'superadmin') {
      // Admin não carrega dados CAC pessoais
      return;
    }

    // Carregar dados do usuário CAC
    fetchWeapons(user.id).then(setWeapons);
    fetchGuides(user.id).then(setGuides);
    fetchIbamaDoc(user.id).then(doc => {
      if (doc) {
        setIbamaDoc(doc);
      } else {
        const newIbama: IbamaDoc = {
          id: crypto.randomUUID(),
          userId: user.id,
          numeroCRIbama: '',
          vencimentoCR: '',
          propriedades: []
        };
        setIbamaDoc(newIbama);
        saveIbamaDoc(newIbama);
      }
    });
  }, [user]);

  // Checa e carrega configs financeiras quando o App inicia
  useEffect(() => {
    fetchConfiguracoesGlobais().then(config => {
       if (config) setGlobalConfig(config);
    });
  }, []);

  // Verifica assinatura sempre que user mudar
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || user.role === 'superadmin') {
         setIsCheckingSubscription(false);
         return; 
      }
      setIsCheckingSubscription(true);
      const assinaturas = await fetchAssinaturasDoUsuario(user.id);
      // Pega a assinatura mais recente ou ativa
      const assinaturaApenas = assinaturas.find(a => a.status === 'ativa' || a.status === 'trial') || assinaturas[0];
      setActiveSubscription(assinaturaApenas || null);
      setIsCheckingSubscription(false);
    };

    checkSubscription();
  }, [user]);

  // ─── Auth ─────────────────────────────────────────────────
  const handleLoginSuccess = (loginUser: UserProfile) => {
    setUser(loginUser);
    setIsAuthenticated(true);
    // Se for superadmin, reseta a view para forçar a tela de seleção
    if (loginUser.role === 'superadmin') {
      setCurrentViewRole(null);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentViewRole(null);
    setWeapons([]);
    setGuides([]);
    setIbamaDoc(null);
    localStorage.removeItem('gcac_session_user');
  };

  const handleUpdateProfile = async (updatedUser: UserProfile) => {
    const success = await updateUserProfile(updatedUser);
    if (success) {
      setUser(updatedUser);
      localStorage.setItem('gcac_session_user', JSON.stringify(updatedUser));
    } else {
      alert('Erro ao salvar alterações no perfil. Verifique sua conexão.');
    }
  };

  const refreshUser = async () => {
    if (user) {
      const updated = await fetchUserProfileById(user.id);
      if (updated) {
        setUser(updated);
        localStorage.setItem('gcac_session_user', JSON.stringify(updated));
      }
    }
  };

  // ─── Weapons ──────────────────────────────────────────────
  const handleAddWeapon = async (w: Weapon) => {
    const result = await createWeapon(w);
    if (result === true) {
      setWeapons(prev => [...prev, w]);
    } else {
      alert(`Erro ao salvar arma no banco: ${result}`);
    }
  };
  const handleUpdateWeapon = async (w: Weapon) => {
    await updateWeapon(w);
    setWeapons(prev => prev.map(x => x.id === w.id ? w : x));
  };
  const handleDeleteWeapon = async (id: string) => {
    await deleteWeapon(id);
    setWeapons(prev => prev.filter(x => x.id !== id));
  };

  // ─── Guides ───────────────────────────────────────────────
  const handleAddGuide = async (g: TrafficGuide) => {
    const guideWithUser = { ...g, userId: user?.id };
    await createGuide(guideWithUser);
    setGuides(prev => [...prev, guideWithUser]);
  };
  const handleUpdateGuide = async (g: TrafficGuide) => {
    await updateGuide(g);
    setGuides(prev => prev.map(x => x.id === g.id ? g : x));
  };
  const handleDeleteGuide = async (id: string) => {
    await deleteGuide(id);
    setGuides(prev => prev.filter(g => g.id !== id));
  };

  // ─── IBAMA ────────────────────────────────────────────────
  const handleUpdateIbamaDoc = async (updated: IbamaDoc) => {
    await saveIbamaDoc(updated);
    setIbamaDoc(updated);
  };
  const handleAddIbamaProperty = async (prop: IbamaProperty) => {
    if (!ibamaDoc || !user) return;
    await createIbamaProperty(user.id, prop);
    const updated = { ...ibamaDoc, propriedades: [...ibamaDoc.propriedades, prop] };
    setIbamaDoc(updated);
  };
  const handleUpdateIbamaProperty = async (prop: IbamaProperty) => {
    if (!ibamaDoc) return;
    await updateIbamaProperty(prop);
    const updated = {
      ...ibamaDoc,
      propriedades: ibamaDoc.propriedades.map(p => p.id === prop.id ? prop : p)
    };
    setIbamaDoc(updated);
  };
  const handleDeleteIbamaProperty = async (id: string) => {
    if (!ibamaDoc) return;
    await deleteIbamaProperty(id);
    const updated = { ...ibamaDoc, propriedades: ibamaDoc.propriedades.filter(p => p.id !== id) };
    setIbamaDoc(updated);
  };

  // ─── Render ───────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const handleAssinarPlano = async (planoId: string) => {
    // Espaço para a integração final com Gateway (Asaas/Stripe)
    alert(`Integração com Gateway de Pagamento pendente.\nVocê escolheu o plano: ${planoId}\nRedirecionando para o Checkout (Mock)...`);
    
    // Simulação temporária: ativa a assinatura direto para testes.
    try {
        const endDate = new Date();
        if (planoId === 'cac_semestral') endDate.setMonth(endDate.getMonth() + 6);
        else if (planoId === 'cac_anual') endDate.setFullYear(endDate.getFullYear() + 1);
        else endDate.setMonth(endDate.getMonth() + 1); // despachante

        const novaAssina = {
            cliente_id: user.id,
            tipo_plano: planoId as any,
            status: 'ativa' as any,
            data_inicio: new Date().toISOString(),
            data_vencimento: endDate.toISOString(),
            valor_recorrente: 0, // lido na criacao via backend
        };
        const { error } = await supabase.from('assinaturas').insert([novaAssina]);
        if (!error) {
           window.location.reload();
        }
    } catch(e) { console.error(e) }
  };

  if (isCheckingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121214]">
        <div className="flex flex-col items-center gap-4">
           <span className="loading-spinner w-8 h-8 border-4 border-accent-primary" />
           <p className="text-muted-foreground animate-pulse">Verificando status da licença...</p>
        </div>
      </div>
    );
  }

  // Verificar Paywall (Restrição Financeira)
  // Superadmins sempre passam. Gratuidade (VIP) sempre passa. Senão, verificar se tem assinatura ativa
  const needsPaywall = 
        user.role !== 'superadmin' && 
        user.gratuidade !== true &&
        (!activeSubscription || (activeSubscription.status !== 'ativa' && activeSubscription.status !== 'trial'));
  
  if (needsPaywall) {
      return (
          <Paywall 
             tipoCliente={user.role === 'admin' ? 'despachante_base' : 'cac'}
             onLogout={handleLogout}
             onAssinar={handleAssinarPlano}
             planoPrecoSemestral={globalConfig?.plano_cac_semestral}
             planoPrecoAnual={globalConfig?.plano_cac_anual}
             mensalidadeDespachante={globalConfig?.mensalidade_despachante}
          />
      );
  }

  // Se for superadmin original de banco e ainda não escolheu um papel:
  const isSuperAdminUser = user.role === 'superadmin';
  if (isSuperAdminUser && currentViewRole === null) {
      return (
          <SuperAdminRoleSelector 
              user={user} 
              onSelectRole={(role: 'superadmin' | 'admin' | 'user') => setCurrentViewRole(role)} 
              onLogout={handleLogout} 
          />
      );
  }

  // Determine se o layout deve ser de Administrador ou de Usuário
  // O aplicativo foi unificado. O layout é ditado pela role escolhida (ou a role real se não for superadmin).
  const effectiveRole = isSuperAdminUser && currentViewRole ? currentViewRole : user.role;
  const isSuperAdminLayout = effectiveRole === 'superadmin';
  const isAdminLayout = effectiveRole === 'admin';

  const layoutProps = {
      userName: user.nome,
      onLogout: handleLogout,
      isSuperAdminUser: isSuperAdminUser,
      onSwitchRole: () => setCurrentViewRole(null) // Volta para a tela de seleção
  };

  if (isSuperAdminLayout) {
    return (
      <Layout {...layoutProps} role="superadmin">
        <SuperAdminDashboard currentUserId={user.id} onUserUpdated={refreshUser} />
      </Layout>
    );
  }

  // Painel Admin / Despachante
  if (isAdminLayout) {
    return (
      <Layout {...layoutProps} role="admin">
        <div className="flex flex-col mx-auto max-w-6xl w-full gap-6 animate-fade-in">
          <Tabs.Root defaultValue="dashboard" className="w-full">
            <Tabs.List className="flex border-b border-color-light mb-6 overflow-x-auto custom-scrollbar">
              <Tabs.Trigger
                value="dashboard"
                className="px-6 py-3 border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary font-bold transition-colors whitespace-nowrap outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[1.2rem]">dashboard</span>
                  Visão Geral
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="clientes"
                className="px-6 py-3 border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary font-bold transition-colors whitespace-nowrap outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[1.2rem]">people</span>
                  Clientes
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="os"
                className="px-6 py-3 border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary font-bold transition-colors whitespace-nowrap outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[1.2rem]">assignment</span>
                  Ordens de Serviço
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="servicos"
                className="px-6 py-3 border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary font-bold transition-colors whitespace-nowrap outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[1.2rem]">list_alt</span>
                  Serviços e Valores
                </div>
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="dashboard" className="outline-none">
              <DashboardDespachante user={user} />
            </Tabs.Content>

            <Tabs.Content value="clientes" className="outline-none">
              <ClientsView user={user} />
            </Tabs.Content>

            <Tabs.Content value="os" className="outline-none">
              <OrdensServicoView user={user} />
            </Tabs.Content>

            <Tabs.Content value="servicos" className="outline-none">
              <ServicosView user={user} />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </Layout>
    );
  }

  // Portal CAC (usuário comum)
  if (!ibamaDoc) {
    return (
      <Layout userName={user.nome} onLogout={handleLogout} role="user">
        <div className="flex items-center justify-center min-h-64">
          <span className="loading-spinner" />
        </div>
      </Layout>
    );
  }

  // Verifica se o usuário tem o perfil incompleto (ex: acesso pelo Super Admin)
  if (user.role === 'user' && (!user.atividadesCR || user.atividadesCR.length === 0)) {
    return (
      <Layout userName={user.nome} onLogout={handleLogout} role="user">
        <FirstAccessModal 
          user={user} 
          onComplete={async (updatedProfile) => {
             // O modal já validou tudo, vamos salvar no banco e no state
             await handleUpdateProfile(updatedProfile);
          }}
        />
      </Layout>
    );
  }

  return (
    <Layout userName={user.nome} onLogout={handleLogout} role="user">
      <div className="flex flex-col gap-8">
        <CacConnectionAlerts user={user} onConnectionAccepted={refreshUser} />

        <Dashboard
          user={user}
          weapons={weapons}
          guides={guides}
          ibamaDoc={ibamaDoc}
        />

        <HierarchyView
          user={user}
          weapons={weapons}
          guides={guides}
          onAddWeapon={handleAddWeapon}
          onUpdateWeapon={handleUpdateWeapon}
          onDeleteWeapon={handleDeleteWeapon}
          onAddGuide={handleAddGuide}
          onUpdateGuide={handleUpdateGuide}
          onDeleteGuide={handleDeleteGuide}
          onUpdateProfile={handleUpdateProfile}
        />

        {user.atividadesCR.includes('Caçador') && (
          <IbamaView
            ibamaDoc={ibamaDoc}
            onUpdateDoc={handleUpdateIbamaDoc}
            onAddProperty={handleAddIbamaProperty}
            onUpdateProperty={handleUpdateIbamaProperty}
            onDeleteProperty={handleDeleteIbamaProperty}
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
