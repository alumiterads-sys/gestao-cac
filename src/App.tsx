import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { WeaponList } from './components/WeaponList';
import { TrafficGuidesView } from './components/TrafficGuidesView';
import { IbamaView } from './components/IbamaView';
import { Login } from './components/Login';
import { ClientsView } from './components/ClientsView';
import { DispatchersView } from './components/DispatchersView';
import {
  fetchWeapons, createWeapon, updateWeapon, deleteWeapon,
  fetchGuides, createGuide, deleteGuide,
  fetchIbamaDoc, saveIbamaDoc,
  createIbamaProperty, updateIbamaProperty, deleteIbamaProperty
} from './api';
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

  // ─── Carrega dados do Supabase ao logar ───────────────────
  useEffect(() => {
    if (!user) return;

    localStorage.setItem('gcac_session_user', JSON.stringify(user));

    // Redirecionar admin para painel admin (futuro)
    if (user.role === 'admin') {
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
          id: `ib-${Date.now()}`,
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

  // ─── Auth ─────────────────────────────────────────────────
  const handleLoginSuccess = (loginUser: UserProfile) => {
    setUser(loginUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setWeapons([]);
    setGuides([]);
    setIbamaDoc(null);
    localStorage.removeItem('gcac_session_user');
  };



  // ─── Weapons ──────────────────────────────────────────────
  const handleAddWeapon = async (w: Weapon) => {
    await createWeapon(w);
    setWeapons(prev => [...prev, w]);
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

  // Painel Admin
  if (user.role === 'admin') {
    return (
      <Layout userName={user.nome} onLogout={handleLogout} role="admin">
        <div className="flex flex-col mx-auto max-w-6xl w-full gap-6">
          <ClientsView user={user} />
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

  return (
    <Layout userName={user.nome} onLogout={handleLogout} role="user">
      <div className="flex flex-col mx-auto max-w-6xl w-full gap-6">
        <Tabs.Root defaultValue="dashboard" className="w-full">
          <Tabs.List className="flex border-b border-color-light mb-6 overflow-x-auto pb-px">
            <Tabs.Trigger value="dashboard" className="px-5 py-3 text-sm font-medium text-muted hover:text-white border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-white">
              <span className="flex items-center gap-2"><span className="material-icons text-[1.2rem]">dashboard</span> Resumo</span>
            </Tabs.Trigger>
            <Tabs.Trigger value="armas" className="px-5 py-3 text-sm font-medium text-muted hover:text-white border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-white">
              <span className="flex items-center gap-2"><span className="material-icons text-[1.2rem]">security</span> Acervo EB</span>
            </Tabs.Trigger>
            <Tabs.Trigger value="ibama" className="px-5 py-3 text-sm font-medium text-muted hover:text-white border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-white">
              <span className="flex items-center gap-2"><span className="material-icons text-[1.2rem]">nature</span> IBAMA</span>
            </Tabs.Trigger>
            <Tabs.Trigger value="guias" className="px-5 py-3 text-sm font-medium text-muted hover:text-white border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-white">
              <span className="flex items-center gap-2"><span className="material-icons text-[1.2rem]">description</span> Guias de Tráfego</span>
            </Tabs.Trigger>
            <Tabs.Trigger value="despachantes" className="px-5 py-3 text-sm font-medium text-muted hover:text-white border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-white ml-auto">
              <span className="flex items-center gap-2"><span className="material-icons text-[1.2rem]">badge</span> Despachantes</span>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="dashboard" className="outline-none">
            <Dashboard
              weapons={weapons}
              guides={guides}
              user={user}
              ibamaDoc={ibamaDoc}
            />
          </Tabs.Content>

          <Tabs.Content value="armas" className="outline-none">
            <WeaponList
              weapons={weapons}
              onAdd={handleAddWeapon}
              onUpdate={handleUpdateWeapon}
              onDelete={handleDeleteWeapon}
            />
          </Tabs.Content>

          <Tabs.Content value="ibama" className="outline-none">
            <IbamaView
              ibamaDoc={ibamaDoc}
              onUpdateDoc={handleUpdateIbamaDoc}
              onAddProperty={handleAddIbamaProperty}
              onUpdateProperty={handleUpdateIbamaProperty}
              onDeleteProperty={handleDeleteIbamaProperty}
            />
          </Tabs.Content>

          <Tabs.Content value="guias" className="outline-none">
            <TrafficGuidesView
              guides={guides}
              weapons={weapons}
              onAdd={handleAddGuide}
              onDelete={handleDeleteGuide}
            />
          </Tabs.Content>

          <Tabs.Content value="despachantes" className="outline-none">
            <DispatchersView user={user} />
          </Tabs.Content>

        </Tabs.Root>
      </div>
    </Layout>
  );

};

export default App;
