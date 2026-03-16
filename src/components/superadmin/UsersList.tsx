import React, { useEffect, useState } from 'react';
import { fetchAllUsers, toggleUserStatus, deleteUser, toggleUserGratuidade } from '../../api/superadmin';
import type { Cliente } from '../../types';
import { AddUserModal } from './AddUserModal';

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user' | 'superadmin' | 'pending'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleToggleStatus = async (user: Cliente) => {
    const currentStatus = user.ativo !== false;
    const confirmMessage = currentStatus
      ? `Tem certeza que deseja DESATIVAR o acesso de ${user.nome}?`
      : `Tem certeza que deseja ATIVAR o acesso de ${user.nome}?`;

    if (!window.confirm(confirmMessage)) return;

    const success = await toggleUserStatus(user.id, currentStatus);
    if (success) {
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, ativo: !currentStatus } : u))
      );
    } else {
      alert('Erro ao alterar status do usuário.');
    }
  };

  const handleToggleGratuidade = async (user: Cliente) => {
    const currentGratuidade = user.gratuidade === true;
    const confirmMessage = currentGratuidade
      ? `Tem certeza que deseja REMOVER a Gratuidade de ${user.nome}? (Ele voltará a ver a tela de pagamento)`
      : `Tem certeza que deseja ATRIBUIR Gratuidade a ${user.nome}? (A isenção do plano será aplicada imediatamente)`;

    if (!window.confirm(confirmMessage)) return;

    const success = await toggleUserGratuidade(user.id, !currentGratuidade);
    if (success) {
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, gratuidade: !currentGratuidade } : u))
      );
    } else {
      alert('Erro ao alterar a gratuidade do usuário.');
    }
  };

  const handleDeleteUser = async (user: Cliente) => {
    const confirmation = window.prompt(
      `ATENÇÃO: Você está prestes a EXCLUIR PERMANENTEMENTE o usuário ${user.nome}.\n\nIsso apagará todas as armas, guias e registros IBAMA vinculados a ele. Essa ação NÃO PODE SER DESFEITA.\n\nDigite "EXCLUIR" para confirmar:`
    );

    if (confirmation !== 'EXCLUIR') {
      alert('Exclusão cancelada.');
      return;
    }

    setLoading(true);
    const success = await deleteUser(user.id);
    if (success) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      alert('Usuário excluído com sucesso.');
    } else {
      alert('Houve um erro ao excluir o usuário.');
    }
    setLoading(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cpf.includes(searchTerm) ||
      u.contato.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterRole === 'pending') {
        return matchesSearch && u.ativo === false;
    }

    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading-spinner"></span>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl w-full text-foreground animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold font-heading flex flex-col">
          Gerenciamento de Usuários
          <span className="text-sm font-normal text-muted-foreground mt-1">Ative, desative ou adicione novos usuários</span>
        </h2>
        <div className="flex gap-4 items-center">
            
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2 whitespace-nowrap h-fit"
          >
            <span className="material-icons text-sm">add</span>
            Adicionar Usuário
          </button>

          <input
            type="text"
            placeholder="Buscar por nome, CPF ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white w-64 focus:outline-none focus:border-accent-primary transition-colors"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="input-field bg-[#1c1c24] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-accent-primary transition-colors"
          >
            <option value="all">Todos os Tipos</option>
            <option value="pending">Aguardando Aprovação</option>
            <option value="user">CACs</option>
            <option value="admin">Despachantes</option>
            <option value="superadmin">Super Admins</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-white/5 text-muted-foreground text-sm uppercase tracking-wider">
              <th className="p-4 rounded-tl-lg font-medium">Nome / Contato</th>
              <th className="p-4 font-medium">CPF</th>
              <th className="p-4 font-medium">Tipo</th>
              <th className="p-4 font-medium">Status e Plano</th>
              <th className="p-4 font-medium text-center rounded-tr-lg">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isAtivo = u.ativo !== false;
                const isGratuito = u.gratuidade === true;
                return (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-medium text-white group-hover:text-accent-primary transition-colors">
                        {u.nome}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {u.contato}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{u.cpf}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400' :
                        u.role === 'admin' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Despachante' : 'CAC'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md w-fit text-xs font-medium border ${
                            isAtivo 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {isAtivo ? 'Acesso Liberado' : 'Acesso Bloqueado'}
                          </span>
                          
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md w-fit text-xs font-medium border ${
                             isGratuito
                              ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/30'
                              : 'bg-white/5 text-muted-foreground border-white/10'
                          }`}>
                              <span className="material-icons text-[14px]">{isGratuito ? 'redeem' : 'payments'}</span>
                              {isGratuito ? 'Gratuidade / VIP' : 'Plano Pago Padrão'}
                          </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleGratuidade(u)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            isGratuito
                              ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20'
                              : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border border-accent-primary/20'
                          }`}
                          title={isGratuito ? "Remover Gratuidade (Voltar a faturar)" : "Conceder Gratuidade Vitalícia"}
                        >
                          {isGratuito ? 'Remover VIP' : 'Tornar VIP'}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            isAtivo
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                          }`}
                          title={isAtivo ? "Desativar acesso total" : "Ativar acesso do usuário"}
                        >
                          {isAtivo ? 'Desativar' : 'Ativar'}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-red-900/40 text-red-500 hover:bg-red-500 hover:text-white border border-red-900/50"
                          title="Excluir Permatentemente"
                        >
                          <span className="material-icons text-[1.1rem]">delete_forever</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AddUserModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onUserAdded={loadUsers}
        />
      )}
    </div>
  );
};
