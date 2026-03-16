import React, { useState, useEffect } from 'react';
import { editUser } from '../../api/superadmin';
import type { Cliente } from '../../types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Cliente;
  onUserUpdated: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Cliente>>({});

  useEffect(() => {
     if (user) {
         setFormData({
             nome: user.nome || '',
             cpf: user.cpf || '',
             contato: user.contato || '',
             email: user.email || '',
             senha_app: user.senha_app || '',
             role: user.role || 'user',
             cr: user.cr || '',
             cr_expiry: user.cr_expiry || '',
             nivel_atirador: user.nivel_atirador || '',
             clube_filiado: user.clube_filiado || ''
         });
     }
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { success, error } = await editUser(user.id, formData);

    if (success) {
      alert('Usuário atualizado com sucesso!');
      onUserUpdated();
      onClose();
    } else {
      alert(error || 'Erro ao atualizar o usuário.');
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c24] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-icons text-accent-primary">edit</span>
            Editar Usuário Global
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="editUserForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                <input
                  type="text"
                  name="nome"
                  required
                  value={formData.nome || ''}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">CPF (Somente Números)</label>
                <input
                  type="text"
                  name="cpf"
                  required
                  value={formData.cpf || ''}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Telefone / Contato</label>
                <input
                  type="text"
                  name="contato"
                  required
                  value={formData.contato || ''}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Senha Aplicativo</label>
                <input
                  type="text" // Type text para ver a senha atual no painel admin
                  name="senha_app"
                  required
                  value={formData.senha_app || ''}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Tipo de Permissão</label>
                <select
                  name="role"
                  required
                  value={formData.role || 'user'}
                  onChange={handleChange}
                  className="w-full bg-[#2a2a35] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                >
                  <option value="user">Usuário Comum (CAC)</option>
                  <option value="admin">Despachante</option>
                  <option value="superadmin">Super Admin (Gestor)</option>
                </select>
              </div>

               <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Número CR</label>
                <input
                  type="text"
                  name="cr"
                  value={formData.cr || ''}
                  onChange={handleChange}
                  placeholder="Se for CAC"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Validade CR</label>
                <input
                  type="date"
                  name="cr_expiry"
                  value={formData.cr_expiry || ''}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors format-date-input"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Clube de Tiro</label>
                <input
                  type="text"
                  name="clube_filiado"
                  value={formData.clube_filiado || ''}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nivel Atirador</label>
                <select
                  name="nivel_atirador"
                  value={formData.nivel_atirador || ''}
                  onChange={handleChange}
                  className="w-full bg-[#2a2a35] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-primary focus:outline-none transition-colors"
                >
                  <option value="">Nenhum/Não Informado</option>
                  <option value="1">Nível 1</option>
                  <option value="2">Nível 2</option>
                  <option value="3">Nível 3</option>
                </select>
              </div>

            </div>
          </form>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3 justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-bold text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="editUserForm"
            disabled={loading}
            className="btn btn-primary min-w-[140px]"
          >
            {loading ? <span className="loading-spinner w-5 h-5 border-2"></span> : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
