import React, { useState } from 'react';
import { createUser } from '../../api/superadmin';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserAdded: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [contato, setContato] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'user' | 'superadmin'>('user');
    const [senha, setSenha] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!nome || !cpf || !contato || !role || !senha) {
            setError('Preencha todos os campos obrigatórios (*)');
            setIsLoading(false);
            return;
        }

        const result = await createUser({
            nome,
            cpf,
            contato,
            email,
            role,
            senha_app: senha
        });

        if (result.success) {
            onUserAdded();
            // Reset form
            setNome('');
            setCpf('');
            setContato('');
            setEmail('');
            setRole('user');
            setSenha('');
            onClose();
        } else {
            setError(result.error || 'Erro desconhecido ao cadastrar usuário.');
        }
        
        setIsLoading(false);
    };

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1c1c24] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="border-b border-white/10 p-6 flex justify-between items-center bg-white/5 rounded-t-2xl">
                    <h3 className="text-xl font-bold font-heading text-white m-0 flex items-center gap-2">
                        <span className="material-icons text-accent-primary">person_add</span>
                        Adicionar Novo Usuário
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="add-user-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-muted-foreground">Nome Completo *</label>
                            <input 
                                type="text" 
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                                placeholder="Digite o nome..."
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-muted-foreground">CPF *</label>
                            <input 
                                type="text" 
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                                className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                                placeholder="Apenas números..."
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-muted-foreground">Contato (WhatsApp) *</label>
                                <input 
                                    type="text" 
                                    value={contato}
                                    onChange={(e) => setContato(e.target.value)}
                                    className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                                    placeholder="Ex: 84999999999"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-muted-foreground">Senha Inicial *</label>
                                <input 
                                    type="text" 
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-muted-foreground">E-mail (Opcional)</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                                placeholder="Endereço de e-mail..."
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-muted-foreground">Nível de Permissão (Tipo de Usuário) *</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="input-field bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-accent-primary focus:outline-none transition-colors"
                            >
                                <option value="user">CAC (Cliente)</option>
                                <option value="admin">Despachante</option>
                                <option value="superadmin">Super Admin (Gestor Global)</option>
                            </select>
                            <span className="text-xs text-muted-foreground mt-1">
                                {role === 'user' && 'Pode gerenciar armas, guias e IBAMA dele mesmo.'}
                                {role === 'admin' && 'Pode ver dados de múltiplos CACs e tem painel de despachante.'}
                                {role === 'superadmin' && 'Pode ver e editar todos os usuários do sistema.'}
                            </span>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 p-6 flex justify-end gap-3 bg-white/5 rounded-b-2xl">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg font-bold transition-all text-white border border-white/20 hover:bg-white/10"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="add-user-form"
                        className="px-6 py-2.5 rounded-lg font-bold transition-all bg-accent-primary text-black hover:brightness-110 flex items-center justify-center min-w-[120px]"
                        disabled={isLoading}
                    >
                        {isLoading ? <span className="loading-spinner w-5 h-5 border-2"></span> : 'Criar Usuário'}
                    </button>
                </div>
            </div>
        </div>
    );
}
