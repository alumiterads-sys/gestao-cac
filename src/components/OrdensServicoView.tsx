import React, { useState, useEffect } from 'react';
import type { UserProfile, OrdemServico, DispatcherConnection, ServicoPreco, ClienteAvulso } from '../types';
import {
    fetchOrdensServico, createOrdemServico, updateOrdemServico, deleteOrdemServico,
    fetchDispatcherConnections, fetchServicosPrecos, fetchClientesAvulsos
} from '../api';

interface OrdensServicoViewProps {
    user: UserProfile;
}

export const OrdensServicoView: React.FC<OrdensServicoViewProps> = ({ user }) => {
    const [ordens, setOrdens] = useState<OrdemServico[]>([]);
    const [clientes, setClientes] = useState<DispatcherConnection[]>([]);
    const [clientesAvulsos, setClientesAvulsos] = useState<ClienteAvulso[]>([]);
    const [servicos, setServicos] = useState<ServicoPreco[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [selectedClientValue, setSelectedClientValue] = useState(''); // Format: "app:ID" or "offline:ID"
    const [servicoId, setServicoId] = useState('');
    const [servicoNomeCust, setServicoNomeCust] = useState('');
    const [valor, setValor] = useState<number>(0);
    const [status, setStatus] = useState<OrdemServico['status']>('aberta');
    const [observacoes, setObservacoes] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        const [osData, connData, servData, avulsosData] = await Promise.all([
            fetchOrdensServico(user.id),
            fetchDispatcherConnections(user.id),
            fetchServicosPrecos(user.id),
            fetchClientesAvulsos(user.id)
        ]);

        setOrdens(osData);
        setClientes(connData.filter(c => c.status === 'active'));
        setClientesAvulsos(avulsosData);
        setServicos(servData);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    // Quando um serviço pré-definido é selecionado, puxa o valor e nome
    useEffect(() => {
        if (servicoId) {
            const s = servicos.find(x => x.id === servicoId);
            if (s) {
                setServicoNomeCust(s.nome_servico);
                setValor(s.preco);
            }
        }
    }, [servicoId, servicos]);

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setSelectedClientValue('');
        setServicoId('');
        setServicoNomeCust('');
        setValor(0);
        setStatus('aberta');
        setObservacoes('');
    };

    const handleEdit = (os: OrdemServico) => {
        setIsEditing(true);
        setCurrentId(os.id);
        setSelectedClientValue(os.cliente_avulso_id ? `offline:${os.cliente_avulso_id}` : `app:${os.cac_id}`);
        setServicoId(os.servico_id || '');
        setServicoNomeCust(os.servico_nome);
        setValor(os.valor_cobrado);
        setStatus(os.status);
        setObservacoes(os.observacoes || '');
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta O.S.?')) return;
        await deleteOrdemServico(id);
        loadData();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedClientValue) {
            alert('Selecione um cliente.');
            return;
        }
        if (!servicoNomeCust) {
            alert('Defina o nome do serviço.');
            return;
        }

        const isOffline = selectedClientValue.startsWith('offline:');
        const idValue = selectedClientValue.split(':')[1];

        const payload = {
            dispatcher_id: user.id,
            cac_id: isOffline ? null : idValue,
            cliente_avulso_id: isOffline ? idValue : null,
            servico_id: servicoId || null,
            servico_nome: servicoNomeCust,
            status,
            valor_cobrado: valor,
            observacoes
        };

        if (isEditing && currentId) {
            await updateOrdemServico(currentId, payload as any);
        } else {
            await createOrdemServico(payload as any);
        }

        resetForm();
        loadData();
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'aberta': return 'bg-info text-info';
            case 'em_andamento': return 'bg-warning text-warning';
            case 'aguardando_cliente': return 'bg-accent-primary text-accent-primary';
            case 'concluida': return 'bg-success text-success';
            case 'cancelada': return 'bg-danger text-danger';
            default: return 'bg-gray-500 text-gray-500';
        }
    };

    const formatStatus = (s: string) => {
        return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Gerenciamento de Ordens de Serviço</h2>
                {isEditing && (
                    <button className="btn btn-secondary text-sm" onClick={resetForm}>
                        Cancelar Edição
                    </button>
                )}
            </div>

            {/* FORMULÁRIO DE O.S. */}
            <div className="glass-panel p-6 border-l-4 border-l-accent-primary">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <span className="material-icons text-xl">{isEditing ? 'edit_document' : 'post_add'}</span>
                    {isEditing ? 'Editar O.S.' : 'Abrir Nova O.S.'}
                </h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-bold block mb-1">Cliente (CAC) *</label>
                            <select
                                className="w-full bg-black bg-opacity-50"
                                value={selectedClientValue}
                                onChange={e => setSelectedClientValue(e.target.value)}
                                required
                            >
                                <option value="">-- Selecione o Cliente --</option>
                                <optgroup label="App G-CAC">
                                    {clientes.map(c => (
                                        <option key={c.cacId} value={`app:${c.cacId}`}>{c.cacNome} (CPF: {c.cacCpf})</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Manuais (Offline)">
                                    {clientesAvulsos.map(c => (
                                        <option key={c.id} value={`offline:${c.id}`}>{c.nome} (CPF: {c.cpf})</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold block mb-1">Status da O.S. *</label>
                            <select
                                className="w-full bg-black bg-opacity-50"
                                value={status}
                                onChange={e => setStatus(e.target.value as any)}
                                required
                            >
                                <option value="aberta">Aberta</option>
                                <option value="em_andamento">Em Andamento</option>
                                <option value="aguardando_cliente">Aguardando Cliente</option>
                                <option value="concluida">Concluída</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-bold block mb-1 text-muted">Vincular à Tabela (Opcional)</label>
                            <select
                                className="w-full bg-black bg-opacity-50"
                                value={servicoId}
                                onChange={e => setServicoId(e.target.value)}
                            >
                                <option value="">-- Serviço Avulso --</option>
                                {servicos.map(s => (
                                    <option key={s.id} value={s.id}>{s.nome_servico} (R$ {s.preco})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold block mb-1">Nome do Serviço Cobrado *</label>
                            <input
                                type="text"
                                className="w-full"
                                value={servicoNomeCust}
                                onChange={e => setServicoNomeCust(e.target.value)}
                                required
                                placeholder="Descreva o serviço..."
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold block mb-1">Valor Final Cobrado (R$) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full"
                                value={valor}
                                onChange={e => setValor(parseFloat(e.target.value))}
                                required
                            />
                        </div>
                    </div>

                    <div className="w-full">
                        <label className="text-sm font-bold block mb-1">Observações Internas</label>
                        <textarea
                            className="w-full h-24"
                            value={observacoes}
                            onChange={e => setObservacoes(e.target.value)}
                            placeholder="Anotações para controle..."
                        />
                    </div>

                    <div className="flex justify-end mt-2">
                        <button type="submit" className="btn btn-primary">
                            <span className="material-icons mr-1">save</span>
                            {isEditing ? 'Salvar O.S.' : 'Criar Ordem de Serviço'}
                        </button>
                    </div>
                </form>
            </div>

            {/* LISTAGEM DE O.S. */}
            <div className="glass-panel p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <span className="material-icons text-xl">folder_open</span>
                    Histórico de O.S. ({ordens.length})
                </h3>

                {isLoading ? (
                    <div className="flex justify-center p-8"><span className="loading-spinner"></span></div>
                ) : ordens.length === 0 ? (
                    <div className="text-center p-8 text-muted border border-dashed border-color-light rounded-md flex flex-col items-center">
                        <span className="material-icons text-4xl mb-2 opacity-50">receipt_long</span>
                        <p>Nenhuma Ordem de Serviço registrada.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ordens.map(os => (
                            <div key={os.id} className="p-4 border border-color-light bg-black bg-opacity-20 rounded-md flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-accent-primary">{os.servico_nome}</p>
                                        <p className="text-sm font-mono text-muted mb-1">Cliente: {os.cac_nome}</p>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded-full bg-opacity-20 font-bold ${getStatusColor(os.status)}`}>
                                        {formatStatus(os.status)}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-color-light pt-3 mt-1">
                                    <div>
                                        <p className="text-xs text-muted mb-1">Data: {new Date(os.created_at).toLocaleDateString()}</p>
                                        <p className="font-bold text-lg">
                                            R$ {os.valor_cobrado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-warning hover:bg-warning hover:bg-opacity-20 rounded-md transition-colors" onClick={() => handleEdit(os)} aria-label="Editar">
                                            <span className="material-icons text-sm">edit</span>
                                        </button>
                                        <button className="p-2 text-danger hover:bg-danger hover:bg-opacity-20 rounded-md transition-colors" onClick={() => handleDelete(os.id)} aria-label="Excluir">
                                            <span className="material-icons text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
