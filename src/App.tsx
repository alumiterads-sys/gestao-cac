import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { HierarchyView } from './components/HierarchyView';
import { IbamaView } from './components/IbamaView';
import { Login } from './components/Login';
import {
  fetchWeapons, createWeapon, updateWeapon, deleteWeapon,
  fetchGuides, createGuide, deleteGuide,
  fetchIbamaDoc, saveIbamaDoc,
  createIbamaProperty, updateIbamaProperty, deleteIbamaProperty
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

  const handleUpdateProfile = async (updatedUser: UserProfile) => {
    const success = await updateUserProfile(updatedUser);
    if (success) {
      setUser(updatedUser);
      localStorage.setItem('gcac_session_user', JSON.stringify(updatedUser));
    } else {
      alert('Erro ao salvar alterações no perfil. Verifique sua conexão.');
    }
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
        <div className="flex flex-col items-center justify-center min-h-64 gap-4">
          <h2 className="text-3xl font-bold text-accent-primary">Painel Administrativo</h2>
          <p className="text-muted">Módulo do Despachante em construção. Em breve disponível.</p>
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
      <div className="flex flex-col gap-8">
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
