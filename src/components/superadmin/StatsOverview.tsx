import React, { useEffect, useState } from 'react';
import { getSuperAdminStats } from '../../api/superadmin';

export const StatsOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalCacs: 0,
    totalDespachantes: 0,
    totalInactive: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await getSuperAdminStats();
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading-spinner"></span>
      </div>
    );
  }

  const totalUsers = stats.totalCacs + stats.totalDespachantes;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {/* Total Users Card */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col justify-between h-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="material-icons text-6xl text-white">groups</span>
        </div>
        <div>
          <h3 className="text-muted-foreground font-medium mb-1">Total de Contas</h3>
          <div className="text-4xl font-bold text-white mb-2">{totalUsers}</div>
        </div>
        <div className="text-sm text-emerald-400 font-medium">Cadastrados no sistema</div>
      </div>

       {/* Despachantes Card */}
       <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col justify-between h-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="material-icons text-6xl text-blue-400">admin_panel_settings</span>
        </div>
        <div>
          <h3 className="text-muted-foreground font-medium mb-1">Despachantes</h3>
          <div className="text-4xl font-bold text-blue-400 mb-2">{stats.totalDespachantes}</div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">Corresponde a {totalUsers > 0 ? Math.round((stats.totalDespachantes / totalUsers) * 100) : 0}%</div>
      </div>

      {/* CACs Card */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col justify-between h-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="material-icons text-6xl text-emerald-400">person</span>
        </div>
        <div>
          <h3 className="text-muted-foreground font-medium mb-1">CACs</h3>
          <div className="text-4xl font-bold text-emerald-400 mb-2">{stats.totalCacs}</div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">Corresponde a {totalUsers > 0 ? Math.round((stats.totalCacs / totalUsers) * 100) : 0}%</div>
      </div>

      {/* Inactive Card */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col justify-between h-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="material-icons text-6xl text-red-400">block</span>
        </div>
        <div>
          <h3 className="text-muted-foreground font-medium mb-1">Contas Inativas</h3>
          <div className="text-4xl font-bold text-red-500 mb-2">{stats.totalInactive}</div>
        </div>
        <div className="text-sm text-red-400 mt-2 font-medium">Acesso bloqueado</div>
      </div>
    </div>
  );
};
