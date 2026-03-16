import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { StatsOverview } from './StatsOverview';
import { UsersList } from './UsersList';
import { GlobalFinancialSettings } from './GlobalFinancialSettings';

interface SuperAdminDashboardProps {
  currentUserId?: string;
  onUserUpdated?: () => void;
}

// Este componente substituirá o conteúdo principal (`DashboardDespachante`, etc) no `App.tsx`
// O `Layout` em `App.tsx` já engloba ele (e pode usar o menu de admin).
export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentUserId, onUserUpdated }) => {
  return (
    <div className="flex flex-col mx-auto max-w-6xl w-full gap-6 animate-fade-in">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Painel de Administração Global</h1>
        <p className="text-muted-foreground">Gerencie todos os usuários do aplicativo e veja estatísticas da plataforma.</p>
      </div>

      <Tabs.Root defaultValue="overview" className="w-full">
        <Tabs.List className="flex border-b border-color-light mb-6 overflow-x-auto custom-scrollbar">
          <Tabs.Trigger
            value="overview"
            className="px-6 py-3 border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary font-bold transition-colors whitespace-nowrap outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="material-icons text-[1.2rem]">analytics</span>
              Visão Geral
            </div>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="users"
            className="px-6 py-3 border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary font-bold transition-colors whitespace-nowrap outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="material-icons text-[1.2rem]">manage_accounts</span>
              Gerenciar Usuários
            </div>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="finance"
            className="px-6 py-3 border-b-2 border-transparent data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary font-bold transition-colors whitespace-nowrap outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="material-icons text-[1.2rem]">request_quote</span>
              Financeiro
            </div>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className="outline-none">
          <StatsOverview />
        </Tabs.Content>

        <Tabs.Content value="users" className="outline-none">
          <UsersList currentUserId={currentUserId} onUserUpdated={onUserUpdated} />
        </Tabs.Content>

        <Tabs.Content value="finance" className="outline-none mt-4">
          <GlobalFinancialSettings />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};
