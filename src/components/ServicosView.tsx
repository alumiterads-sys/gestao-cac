import React, { useState, useEffect } from 'react';
import type { UserProfile, ServicoPreco } from '../types';
import { fetchServicosPrecos, createServicoPreco, updateServicoPreco, deleteServicoPreco } from '../api';

interface ServicosViewProps {
    user: UserProfile;
}

export const ServicosView: React.FC<ServicosViewProps> = ({ user }) => {
    const [servicos, setServicos] = useState<ServicoPreco[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [preco, setPreco] = useState<number>(0);
    const [prazo, setPrazo] = useState<number>(0);

    const loadServicos = async () => {
        setIsLoading(true);
        const data = await fetchServicosPrecos(user.id);
        setServicos(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadServicos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setNome('');
        setDescricao('');
        setPreco(0);
        setPrazo(0);
    };

    const handleEdit = (s: ServicoPreco) => {
        setIsEditing(true);
        setCurrentId(s.id);
        setNome(s.nome_servico);
        setDescricao(s.descricao || '');
        setPreco(s.preco);
        setPrazo(s.prazo_estimado_dias || 0);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir este serviço? Ordens de serviço antigas preservarão o nome.')) return;
        await deleteServicoPreco(id);
        loadServicos();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && currentId) {
            await updateServicoPreco(currentId, {
                nome_servico: nome,
                descricao,
                preco,
                prazo_estimado_dias: prazo
            });
        } else {
            await createServicoPreco({
                dispatcher_id: user.id,
                nome_servico: nome,
                descricao,
                preco,
                prazo_estimado_dias: prazo
            });
        }

        resetForm();
        loadServicos();
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Meus Serviços e Preços</h2>
                {isEditing && (
                    <button className="btn btn-secondary text-sm" onClick={resetForm}>
                        Cancelar Edição
                    </button>
                )}
            </div>

            {/* FORMULÁRIO */}
            <div className="glass-panel p-6">
                <h3 className="font-bold text-accent-primary mb-4 flex items-center gap-2">
                    <span className="material-icons text-xl">{isEditing ? 'edit' : 'add_circle'}</span>
                    {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-bold block mb-1">Nome do Serviço *</label>
                            <input
                                type="text"
                                className="w-full"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                required
                                placeholder="Ex: Renovação de CR"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold block mb-1">Preço (R$) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full"
                                value={preco}
                                onChange={e => setPreco(parseFloat(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-bold block mb-1">Descrição</label>
                            <input
                                type="text"
                                className="w-full"
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder="Detalhes adicionais do serviço..."
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold block mb-1">Prazo Estimado (Dias)</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full"
                                value={prazo}
                                onChange={e => setPrazo(parseInt(e.target.value))}
                                placeholder="Ex: 30"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-2">
                        <button type="submit" className="btn btn-primary">
                            <span className="material-icons mr-1">save</span>
                            {isEditing ? 'Salvar Alterações' : 'Adicionar Serviço'}
                        </button>
                    </div>
                </form>
            </div>

            {/* LISTAGEM */}
            <div className="glass-panel p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <span className="material-icons text-xl">list_alt</span>
                    Tabela de Preços
                </h3>

                {isLoading ? (
                    <div className="flex justify-center p-8"><span className="loading-spinner"></span></div>
                ) : servicos.length === 0 ? (
                    <div className="text-center p-8 text-muted border border-dashed border-color-light rounded-md">
                        <p>Nenhum serviço cadastrado. Adicione seus serviços acima.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-color-light text-muted text-sm">
                                    <th className="pb-2 font-bold min-w-[200px]">Serviço</th>
                                    <th className="pb-2 font-bold min-w-[100px]">Preço</th>
                                    <th className="pb-2 font-bold">Prazo</th>
                                    <th className="pb-2 font-bold text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servicos.map(s => (
                                    <tr key={s.id} className="border-b border-color-light hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td className="py-3">
                                            <p className="font-bold text-accent-primary">{s.nome_servico}</p>
                                            {s.descricao && <p className="text-xs text-muted mt-1">{s.descricao}</p>}
                                        </td>
                                        <td className="py-3 font-mono">
                                            R$ {s.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 text-sm">
                                            {s.prazo_estimado_dias ? `${s.prazo_estimado_dias} dias` : '-'}
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 text-warning hover:bg-warning hover:bg-opacity-20 rounded-md transition-colors" onClick={() => handleEdit(s)}>
                                                    <span className="material-icons text-sm">edit</span>
                                                </button>
                                                <button className="p-2 text-danger hover:bg-danger hover:bg-opacity-20 rounded-md transition-colors" onClick={() => handleDelete(s.id)}>
                                                    <span className="material-icons text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
