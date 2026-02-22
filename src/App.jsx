import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
    Users, PlusCircle, Search, DollarSign, Map, Trash2, Edit, Eye, X,
    Calendar, Clock, Shield, AlertTriangle, UserCheck, UserX, History, FileText, ArrowLeft, Phone,
    CheckCircle, Circle, Loader, FileCheck, Info, RefreshCw, Bell, AlertCircle
} from 'lucide-react';

import { supabase } from './lib/supabase';
import {
    clients, servicos, tabelaFiliado, tabelaNaoFiliado, historicoServicos,
    crafs, guias, simaf, getAlertEvents, STATUS_SERVICO, TIPOS_SERVICO
} from './data/mockData';
import { format, parseISO, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =============================================
// HELPER FUNCTIONS
// =============================================
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR }); }
    catch { return dateStr; }
};

const formatMoney = (val) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return `R$ ${Number(val).toFixed(2).replace('.', ',')}`;
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    return differenceInDays(parseISO(dateStr), new Date());
};

const getStatusBadge = (status) => {
    const map = {
        'Não Iniciado': { cls: 'badge-silver', icon: <Circle size={10} /> },
        'Iniciado, Montando Processo': { cls: 'badge-blue', icon: <Loader size={10} /> },
        'Aguardando Aprovação': { cls: 'badge-gold', icon: <Clock size={10} /> },
        'Em Análise pela PF': { cls: 'badge-purple', icon: <Shield size={10} /> },
        'Concluído': { cls: 'badge-green', icon: <CheckCircle size={10} /> },
        'Arquivado': { cls: 'badge-silver', icon: <FileCheck size={10} /> },
    };
    const s = map[status] || { cls: 'badge-silver', icon: null };
    return <span className={`badge ${s.cls}`}>{s.icon} {status}</span>;
};

// =============================================
// SIDEBAR
// =============================================
function Sidebar() {
    const [pendingCount, setPendingCount] = useState(0);
    const [alertsCount, setAlertsCount] = useState(0);

    React.useEffect(() => {
        const fetchCounts = async () => {
            const { count: pending } = await supabase.from('servicos').select('*', { count: 'exact', head: true }).neq('status', 'Concluído');
            setPendingCount(pending || 0);

            // For now, alerts still come from mock logic until we migrate the alert engine
            const alerts = getAlertEvents().filter(a => a.urgent || a.vencido).length;
            setAlertsCount(alerts);
        };
        fetchCounts();
    }, []);

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">GC</div>
                <div className="logo-text">G<span>CAC</span></div>
            </div>
            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Principal</div>
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                    <Map className="nav-icon" /> Dashboard
                    {alertsCount > 0 && <span className="nav-badge">{alertsCount}</span>}
                </NavLink>

                <div className="sidebar-section-title">Gestão</div>
                <NavLink to="/servicos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <DollarSign className="nav-icon" /> Serviços
                    {pendingCount > 0 && <span className="nav-badge" style={{ backgroundColor: 'var(--accent-blue)' }}>{pendingCount}</span>}
                </NavLink>
                <NavLink to="/clientes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Users className="nav-icon" /> Clientes
                </NavLink>

                <div className="sidebar-section-title">Financeiro</div>
                <NavLink to="/filiado" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <UserCheck className="nav-icon" /> $ Filiado
                </NavLink>
                <NavLink to="/nao-filiado" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <UserX className="nav-icon" /> $ Não Filiado
                </NavLink>

                <div className="sidebar-section-title">Registros</div>
                <NavLink to="/historico" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <History className="nav-icon" /> Histórico de Serviços
                </NavLink>
                <NavLink to="/crafs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Crosshair className="nav-icon" /> CRAFs
                </NavLink>
                <NavLink to="/guias" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FileText className="nav-icon" /> Guias
                </NavLink>
                <NavLink to="/simaf" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Map className="nav-icon" /> SIMAF
                </NavLink>
            </nav>
            <div className="sidebar-footer">
                <NavLink to="/sobre" className="nav-item">
                    <Info className="nav-icon" /> Sobre
                </NavLink>
            </div>
        </aside>
    );
}

// =============================================
// DASHBOARD
// =============================================
function DashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState([
        { label: 'Clientes', value: 0, icon: <Users size={20} />, color: 'blue' },
        { label: 'Serviços Ativos', value: 0, icon: <DollarSign size={20} />, color: 'green' },
        { label: 'Armas (CRAFs)', value: 0, icon: <Crosshair size={20} />, color: 'gold' },
        { label: 'SIMAF', value: 0, icon: <Map size={20} />, color: 'purple' },
    ]);
    const [recentServices, setRecentServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const alerts = useMemo(() => getAlertEvents(), []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                { count: clientsCount },
                { count: activeServicesCount },
                { count: crafsCount },
                { count: simafCount },
                { data: recent }
            ] = await Promise.all([
                supabase.from('clientes').select('*', { count: 'exact', head: true }),
                supabase.from('servicos').select('*', { count: 'exact', head: true }).neq('status', 'Concluído'),
                supabase.from('crafs').select('*', { count: 'exact', head: true }),
                supabase.from('simaf').select('*', { count: 'exact', head: true }),
                supabase.from('servicos').select('*, clientes(nome)').order('created_at', { ascending: false }).limit(5)
            ]);

            setStats([
                { label: 'Clientes', value: clientsCount || 0, icon: <Users size={20} />, color: 'blue' },
                { label: 'Serviços Ativos', value: activeServicesCount || 0, icon: <DollarSign size={20} />, color: 'green' },
                { label: 'Armas (CRAFs)', value: crafsCount || 0, icon: <Crosshair size={20} />, color: 'gold' },
                { label: 'SIMAF', value: simafCount || 0, icon: <Map size={20} />, color: 'purple' },
            ]);
            setRecentServices(recent?.map(s => ({ ...s, nome: s.clientes?.nome })) || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">DASHBOARD</h1>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={fetchData}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/servicos')}>
                        <PlusCircle size={16} /> Novo Serviço
                    </button>
                </div>
            </div>
            <div className="page-body">
                <div className="stats-grid stagger">
                    {stats.map((s, i) => (
                        <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="stat-header">
                                <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                                <div className="stat-value">{loading ? '...' : s.value}</div>
                            </div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-section animate-slide-up" style={{ animationDelay: '400ms' }}>
                        <h3><Bell size={18} color="var(--accent-gold)" /> Alertas de Vencimento</h3>
                        <div className="alerts-list">
                            {alerts.slice(0, 8).map(alert => (
                                <div key={alert.id} className={`alert-item ${alert.urgent ? 'urgent' : ''} ${alert.vencido ? 'vencido' : ''}`}>
                                    <div className={`alert-dot ${alert.type}`}></div>
                                    <div className="alert-info">
                                        <div className="alert-title">{alert.title}</div>
                                        <div className="alert-date">Vencimento: {formatDate(alert.date)} ({getDaysUntil(alert.date)} dias)</div>
                                    </div>
                                    {alert.vencido && <AlertTriangle size={14} color="var(--accent-red)" />}
                                    {!alert.vencido && alert.urgent && <Clock size={14} color="var(--accent-gold)" />}
                                </div>
                            ))}
                            {alerts.length === 0 && <div className="empty-state">Parabéns! Nenhum vencimento próximo.</div>}
                        </div>
                    </div>

                    <div className="dashboard-section animate-slide-up" style={{ animationDelay: '500ms' }}>
                        <h3><History size={18} color="var(--accent-blue)" /> Serviços Recentes</h3>
                        <div className="service-list">
                            {loading ? (
                                <div className="empty-state">Carregando...</div>
                            ) : recentServices.map(s => (
                                <div key={s.id} className="service-card" style={{ padding: '12px 16px' }} onClick={() => navigate('/servicos')}>
                                    <div className="service-info">
                                        <div className="service-name" style={{ fontSize: 13 }}>{s.nome}</div>
                                        <div className="service-type" style={{ fontSize: 10 }}>{s.tipo_servico}</div>
                                    </div>
                                    {getStatusBadge(s.status)}
                                </div>
                            ))}
                            {!loading && recentServices.length === 0 && <div className="empty-state">Nenhum serviço recente.</div>}
                        </div>
                        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={() => navigate('/historico')}>
                            Ver Histórico Completo
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// =============================================
// 1. SERVIÇOS
// =============================================
function ServicosPage() {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [servicosList, setServicosList] = useState([]);
    const [clientesList, setClientesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingServico, setEditingServico] = useState(null);

    const fetchServicos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('servicos')
            .select('*, clientes(nome, filiado)')
            .order('data', { ascending: false });

        if (error) console.error('Error fetching services:', error);
        else setServicosList(data.map(s => ({ ...s, cliente: s.clientes?.nome })));
        setLoading(false);
    };

    const fetchClientes = async () => {
        const { data, error } = await supabase.from('clientes').select('id, nome, filiado');
        if (!error) setClientesList(data);
    };

    React.useEffect(() => {
        fetchServicos();
        fetchClientes();
    }, []);

    const filtered = useMemo(() =>
        servicosList.filter(s =>
            (s.cliente || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.tipo_servico || '').toLowerCase().includes(search.toLowerCase())
        ), [search, servicosList]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">SERVIÇOS</h1>
                <div className="page-actions">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input placeholder="Procurar serviços" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}><PlusCircle size={16} /> Add</button>
                </div>
            </div>
            <div className="page-body" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Tipo de Serviço</th>
                                    <th>Status</th>
                                    <th>Protocolo?</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="empty-state">Carregando serviços...</td></tr>
                                ) : filtered.map(s => (
                                    <tr key={s.id} onClick={() => setSelected(s)}
                                        className={selected?.id === s.id ? 'selected' : ''}>
                                        <td>{formatDate(s.data)}</td>
                                        <td style={{ fontWeight: 600 }}>{s.cliente}</td>
                                        <td>{s.tipo_servico}</td>
                                        <td>{getStatusBadge(s.status)}</td>
                                        <td>
                                            <span className={`badge ${s.servico_executado === 'PROTOCOLADO' ? 'badge-green' : 'badge-gold'}`}>
                                                {s.servico_executado}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="service-actions">
                                                <button className="btn-icon" onClick={e => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Excluir este serviço?')) {
                                                        supabase.from('servicos').delete().eq('id', s.id).then(() => fetchServicos());
                                                    }
                                                }}><Trash2 size={16} /></button>
                                                <button className="btn-icon" onClick={e => {
                                                    e.stopPropagation();
                                                    setEditingServico(s);
                                                }}><Edit size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {selected && (
                    <div className="detail-panel" style={{ width: 400 }}>
                        <div className="modal-header" style={{ marginBottom: 20 }}>
                            <h2>DETALHES DO SERVIÇO</h2>
                            <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
                        </div>
                        <div className="detail-field">
                            <div className="field-label">Cliente</div>
                            <div className="field-value" style={{ fontSize: 18, fontWeight: 700 }}>{selected.cliente}</div>
                        </div>
                        <div className="detail-field">
                            <div className="field-label">Serviço</div>
                            <div className="field-value">{selected.tipo_servico}</div>
                        </div>
                        <div className="form-row">
                            <div className="detail-field">
                                <div className="field-label">Data</div>
                                <div className="field-value">{formatDate(selected.data)}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Protocolo</div>
                                <div className="field-value">{selected.n_protocolo || '—'}</div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="detail-field">
                                <div className="field-label">Valor</div>
                                <div className="field-value" style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{formatMoney(selected.valor)}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Pagamento</div>
                                <div className="field-value">
                                    <span className={`badge ${selected.pago_ou_pendente === 'Pago' ? 'badge-green' : 'badge-gold'}`}>
                                        {selected.pago_ou_pendente}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="detail-field">
                            <div className="field-label">Forma de Pagamento</div>
                            <div className="field-value">{selected.forma_pagamento || '—'}</div>
                        </div>
                        <div className="detail-field">
                            <div className="field-label">Observações</div>
                            <div className="field-value" style={{ fontStyle: 'italic', background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
                                {selected.observacoes || 'Sem observações.'}
                            </div>
                        </div>
                        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingServico(selected)}>
                                <Edit size={16} /> Editar
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1 }}>
                                <FileText size={16} /> Gerar PDF
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {showForm && <AddServicoModal onClose={() => setShowForm(false)} onSave={fetchServicos} clientes={clientesList} />}
            {editingServico && <AddServicoModal initialData={editingServico} onClose={() => setEditingServico(null)} onSave={() => { fetchServicos(); setSelected(null); }} clientes={clientesList} />}
        </>
    );
}

// =============================================
// 2. CLIENTES
// =============================================
function ClientesPage() {
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const [clientesList, setClientesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);

    const fetchClientes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nome', { ascending: true });

        if (error) console.error('Error fetching clients:', error);
        else setClientesList(data);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchClientes();
    }, []);

    const filtered = useMemo(() =>
        clientesList.filter(c =>
            (c.nome || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.cpf || '').includes(search)
        ), [search, clientesList]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">CLIENTES</h1>
                <div className="page-actions">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input placeholder="Procurar clientes" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><PlusCircle size={16} /> ADD</button>
                </div>
            </div>
            <div className="page-body">
                <div className="client-grid">
                    {loading ? (
                        <div className="empty-state">Carregando clientes...</div>
                    ) : filtered.map(c => (
                        <div key={c.id} className="client-card" onClick={() => navigate(`/clientes/${c.id}`)}>
                            <div className="client-avatar">{getInitials(c.nome)}</div>
                            <div className="client-info">
                                <div className="client-name">{c.nome}</div>
                                <div className="client-cpf">{c.cpf}</div>
                            </div>
                            <div className="client-actions">
                                <button className="btn-icon" onClick={e => {
                                    e.stopPropagation();
                                    if (window.confirm('Excluir cliente e todos os seus registros?')) {
                                        supabase.from('clientes').delete().eq('id', c.id).then(() => fetchClientes());
                                    }
                                }}><Trash2 size={16} /></button>
                                <button className="btn-icon" onClick={e => {
                                    e.stopPropagation();
                                    setEditingCliente(c);
                                }}><Edit size={16} /></button>
                                {c.contato && <button className="btn-icon" onClick={e => e.stopPropagation()}><Phone size={16} /></button>}
                            </div>
                        </div>
                    ))}
                    {!loading && filtered.length === 0 && (
                        <div className="empty-state">
                            <h3>Nenhum cliente cadastrado</h3>
                            <p>Clique em ADD para começar</p>
                        </div>
                    )}
                </div>
            </div>
            {showAddModal && <AddClienteModal onClose={() => setShowAddModal(false)} onSave={fetchClientes} />}
            {editingCliente && <AddClienteModal initialData={editingCliente} onClose={() => setEditingCliente(null)} onSave={fetchClientes} />}
        </>
    );
}

// =============================================
// CLIENT DETAIL
// =============================================
function ClienteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [clientCrafs, setClientCrafs] = useState([]);
    const [clientGuias, setClientGuias] = useState([]);
    const [clientIbama, setClientIbama] = useState([]);
    const [tab, setTab] = useState('armas');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClientData = async () => {
            setLoading(true);
            const [
                { data: clientData },
                { data: crafsData },
                { data: guiasData },
                { data: ibamaData }
            ] = await Promise.all([
                supabase.from('clientes').select('*').eq('id', id).single(),
                supabase.from('crafs').select('*').eq('cliente_id', id),
                supabase.from('guias').select('*').eq('cliente_id', id),
                supabase.from('ibama').select('*').eq('cliente_id', id)
            ]);

            setClient(clientData);
            setClientCrafs(crafsData || []);
            setClientGuias(guiasData || []);
            setClientIbama(ibamaData || []);
            setLoading(false);
        };
        fetchClientData();
    }, [id]);

    if (loading) return <div className="page-body">Carregando detalhes...</div>;

    if (!client) return (
        <div className="page-body">
            <button className="back-btn" onClick={() => navigate('/clientes')}><ArrowLeft size={16} /> Voltar</button>
            <div className="empty-state"><h3>Cliente não encontrado</h3></div>
        </div>
    );

    return (
        <div className="page-body">
            <button className="back-btn" onClick={() => navigate('/clientes')}><ArrowLeft size={16} /> Voltar para Clientes</button>

            <div className="client-detail-header">
                <div className="client-detail-avatar">{getInitials(client.nome)}</div>
                <div>
                    <div className="client-detail-name">{client.nome}</div>
                    <div className="client-detail-meta">
                        {client.filiado && <span className="badge badge-green">Filiado Pró-Tiro</span>}
                        {!client.filiado && <span className="badge badge-silver">Não Filiado</span>}
                    </div>
                </div>
            </div>

            <div className="info-grid">
                <div className="info-card">
                    <div className="info-label">CPF</div>
                    <div className="info-value" style={{ fontFamily: 'Courier New, monospace' }}>{client.cpf}</div>
                </div>
                <div className="info-card">
                    <div className="info-label">Contato</div>
                    <div className="info-value">{client.contato || '—'}</div>
                </div>
                <div className="info-card">
                    <div className="info-label">Senha GOV</div>
                    <div className="info-value">{client.senha_gov}</div>
                </div>
                <div className="info-card">
                    <div className="info-label">Nº CR</div>
                    <div className="info-value">{client.cr}</div>
                </div>
                <div className="info-card">
                    <div className="info-label">Vencimento do CR</div>
                    <div className="info-value" style={{ color: getDaysUntil(client.cr_expiry) < 30 ? 'var(--accent-red)' : 'inherit' }}>
                        {formatDate(client.cr_expiry)}
                        {getDaysUntil(client.cr_expiry) !== null && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                                ({getDaysUntil(client.cr_expiry)} dias)
                            </span>
                        )}
                    </div>
                </div>
                <div className="info-card">
                    <div className="info-label">Filiado?</div>
                    <div className="info-value">{client.filiado ? 'SIM' : 'NÃO'}</div>
                </div>
            </div>

            {/* IBAMA Section */}
            {clientIbama.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>IBAMA</h3>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nº CR IBAMA</th>
                                    <th>Vencimento CR IBAMA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientIbama.map((ib, i) => (
                                    <tr key={i}>
                                        <td>{ib.cr_ibama || '—'}</td>
                                        <td>{formatDate(ib.venc_cr_ibama)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab-btn ${tab === 'armas' ? 'active' : ''}`} onClick={() => setTab('armas')}>
                    Armas ({clientCrafs.length})
                </button>
                <button className={`tab-btn ${tab === 'guias' ? 'active' : ''}`} onClick={() => setTab('guias')}>
                    Guias ({clientGuias.length})
                </button>
            </div>

            {tab === 'armas' && (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Modelo Arma</th>
                                <th>Tipo</th>
                                <th>Calibre</th>
                                <th>Nº Série</th>
                                <th>Nº SIGMA</th>
                                <th>Vencimento CRAF</th>
                                <th>Acervo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientCrafs.map(cr => (
                                <tr key={cr.id}>
                                    <td style={{ fontWeight: 600 }}>{cr.modeloArma}</td>
                                    <td>{cr.tipo}</td>
                                    <td><span className="badge badge-blue">{cr.calibre}</span></td>
                                    <td style={{ fontFamily: 'Courier New, monospace', fontSize: 12 }}>{cr.nSerie}</td>
                                    <td>{cr.nSigma}</td>
                                    <td style={{ color: getDaysUntil(cr.vencimentoCraf) < 60 ? 'var(--accent-gold)' : 'inherit' }}>
                                        {formatDate(cr.vencimentoCraf)}
                                    </td>
                                    <td><span className={`badge ${cr.acervo === 'Caça' ? 'badge-green' : 'badge-blue'}`}>{cr.acervo}</span></td>
                                </tr>
                            ))}
                            {clientCrafs.length === 0 && (
                                <tr><td colSpan="7"><div className="empty-state"><p>Nenhuma arma cadastrada</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'guias' && (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Arma</th>
                                <th>Data de Vencimento</th>
                                <th>Tipo de Guia</th>
                                <th>Destino</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientGuias.map(g => (
                                <tr key={g.id}>
                                    <td style={{ fontWeight: 500 }}>{g.arma}</td>
                                    <td>{formatDate(g.dataVencimento)}</td>
                                    <td><span className={`badge ${g.tipoGuia === 'Caça' ? 'badge-green' : g.tipoGuia === 'Caça Treino' ? 'badge-gold' : 'badge-blue'}`}>{g.tipoGuia}</span></td>
                                    <td>{g.destino}</td>
                                </tr>
                            ))}
                            {clientGuias.length === 0 && (
                                <tr><td colSpan="4"><div className="empty-state"><p>Nenhuma guia cadastrada</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// =============================================
// 3. $ FILIADO
// =============================================
function FiliadoPage() {
    const [selected, setSelected] = useState(null);
    const [precos, setPrecos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPreco, setEditingPreco] = useState(null);

    const fetchPrecos = async () => {
        setLoading(true);
        const { data } = await supabase.from('tabela_precos').select('*').eq('tipo_cliente', 'Filiado');
        setPrecos(data || []);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchPrecos();
    }, []);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">$ FILIADO</h1>
                <div className="page-actions">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input placeholder="Procurar $ FILIADO" />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><PlusCircle size={16} /> Add</button>
                </div>
            </div>
            <div className="page-body" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                    <div className="data-table-container">
                        <table className="pricing-table">
                            <thead>
                                <tr>
                                    <th>Serviços</th>
                                    <th>Taxas (GRU)</th>
                                    <th>Valor</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="empty-state">Carregando...</td></tr>
                                ) : precos.map(item => (
                                    <tr key={item.id} onClick={() => setSelected(item)}
                                        className={selected?.id === item.id ? 'selected' : ''} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontWeight: 500 }}>{item.servico}</td>
                                        <td className="tax">{formatMoney(item.taxas_gru)}</td>
                                        <td className="price">{formatMoney(item.valor)}</td>
                                        <td className="obs-cell">{item.observacoes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {selected && (
                    <div style={{ width: 320 }}>
                        <div className="data-table-container" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700 }}>DETALHES</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-icon" onClick={async () => {
                                        if (window.confirm('Excluir este preço?')) {
                                            await supabase.from('tabela_precos').delete().eq('id', selected.id);
                                            fetchPrecos();
                                            setSelected(null);
                                        }
                                    }}><Trash2 size={16} /></button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setEditingPreco(selected)}><Edit size={14} /> Editar</button>
                                </div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Serviços</div>
                                <div className="field-value">{selected.servico}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Taxas (GRU)</div>
                                <div className="field-value money-gold">{formatMoney(selected.taxas_gru)}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Valor</div>
                                <div className="field-value money-green" style={{ fontSize: 20 }}>{formatMoney(selected.valor)}</div>
                            </div>
                            {selected.observacoes && (
                                <div className="detail-field">
                                    <div className="field-label">Observações</div>
                                    <div className="field-value" style={{ fontSize: 13 }}>{selected.observacoes}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {showAddModal && <PrecoModal onClose={() => setShowAddModal(false)} onSave={fetchPrecos} defaultTipo="Filiado" />}
            {editingPreco && <PrecoModal initialData={editingPreco} onClose={() => setEditingPreco(null)} onSave={() => { fetchPrecos(); setSelected(null); }} />}
        </>
    );
}

// =============================================
// 4. $ NÃO FILIADO
// =============================================
function NaoFiliadoPage() {
    const [selected, setSelected] = useState(null);
    const [precos, setPrecos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPreco, setEditingPreco] = useState(null);

    const fetchPrecos = async () => {
        setLoading(true);
        const { data } = await supabase.from('tabela_precos').select('*').eq('tipo_cliente', 'Não Filiado');
        setPrecos(data || []);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchPrecos();
    }, []);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">$ NÃO FILIADO</h1>
                <div className="page-actions">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input placeholder="Procurar $ NÃO FILIADO" />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><PlusCircle size={16} /> Add</button>
                </div>
            </div>
            <div className="page-body" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                    <div className="data-table-container">
                        <table className="pricing-table">
                            <thead>
                                <tr>
                                    <th>Serviços</th>
                                    <th>Taxas (GRU)</th>
                                    <th>Valor</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="empty-state">Carregando...</td></tr>
                                ) : precos.map(item => (
                                    <tr key={item.id} onClick={() => setSelected(item)}
                                        className={selected?.id === item.id ? 'selected' : ''} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontWeight: 500 }}>{item.servico}</td>
                                        <td className="tax">{formatMoney(item.taxas_gru)}</td>
                                        <td className="price">{formatMoney(item.valor)}</td>
                                        <td className="obs-cell">{item.observacoes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {selected && (
                    <div style={{ width: 320 }}>
                        <div className="data-table-container" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700 }}>DETALHES</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-icon" onClick={async () => {
                                        if (window.confirm('Excluir este preço?')) {
                                            await supabase.from('tabela_precos').delete().eq('id', selected.id);
                                            fetchPrecos();
                                            setSelected(null);
                                        }
                                    }}><Trash2 size={16} /></button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setEditingPreco(selected)}><Edit size={14} /> Editar</button>
                                </div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Serviços</div>
                                <div className="field-value">{selected.servico}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Taxas (GRU)</div>
                                <div className="field-value money-gold">{formatMoney(selected.taxas_gru)}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Valor</div>
                                <div className="field-value money-green" style={{ fontSize: 20 }}>{formatMoney(selected.valor)}</div>
                            </div>
                            {selected.observacoes && (
                                <div className="detail-field">
                                    <div className="field-label">Observações</div>
                                    <div className="field-value" style={{ fontSize: 13 }}>{selected.observacoes}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {showAddModal && <PrecoModal onClose={() => setShowAddModal(false)} onSave={fetchPrecos} defaultTipo="Não Filiado" />}
            {editingPreco && <PrecoModal initialData={editingPreco} onClose={() => setEditingPreco(null)} onSave={() => { fetchPrecos(); setSelected(null); }} />}
        </>
    );
}

// =============================================
// 5. HISTÓRICO DE SERVIÇOS
// =============================================
function HistoricoPage() {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [historicoList, setHistoricoList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingServico, setEditingServico] = useState(null);
    const [clientesList, setClientesList] = useState([]);

    const fetchHistorico = async () => {
        setLoading(true);
        const [servicosData, clientesData] = await Promise.all([
            supabase.from('servicos').select('*, clientes(nome)').eq('status', 'Concluído').order('data', { ascending: false }),
            supabase.from('clientes').select('id, nome').order('nome')
        ]);

        if (servicosData.error) console.error('Error fetching history:', servicosData.error);
        else setHistoricoList(servicosData.data.map(h => ({ ...h, nome: h.clientes?.nome })));

        setClientesList(clientesData.data || []);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchHistorico();
    }, []);

    const filtered = useMemo(() =>
        historicoList.filter(h =>
            (h.nome || '').toLowerCase().includes(search.toLowerCase()) ||
            (h.tipo_servico || '').toLowerCase().includes(search.toLowerCase())
        ), [search, historicoList]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">HISTÓRICO DE SERVIÇOS</h1>
                <div className="page-actions">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input placeholder="Procurar HISTÓRICO" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>
            <div className="page-body" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data ↑</th>
                                    <th>Status</th>
                                    <th>Nome</th>
                                    <th>Executado?</th>
                                    <th>Serviço</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="empty-state">Carregando histórico...</td></tr>
                                ) : filtered.map(h => (
                                    <tr key={h.id} onClick={() => setSelected(h)}
                                        className={selected?.id === h.id ? 'selected' : ''}>
                                        <td>{formatDate(h.data)}</td>
                                        <td>{getStatusBadge(h.status)}</td>
                                        <td style={{ fontWeight: 500 }}>{h.nome}</td>
                                        <td>{h.servico_executado}</td>
                                        <td>{h.tipo_servico}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {selected && (
                    <div style={{ width: 340 }}>
                        <div className="data-table-container" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700 }}>DETALHES</h3>
                                <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setEditingServico(selected)}><Edit size={14} /> Editar</button>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Data</div>
                                <div className="field-value">{formatDate(selected.data)}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Status</div>
                                <div className="field-value">{getStatusBadge(selected.status)}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Nome</div>
                                <div className="field-value">{selected.nome}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Serviço Executado?</div>
                                <div className="field-value">{selected.servico_executado}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Serviços</div>
                                <div className="field-value">{selected.tipo_servico}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">GRU Paga?</div>
                                <div className="field-value">{selected.gru_paga ? 'SIM' : 'NÃO'}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Filiado no Pro Tiro?</div>
                                <div className="field-value">{selected.filiado_pro_tiro ? 'SIM' : 'NÃO'}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Valor</div>
                                <div className="field-value money-green">{formatMoney(selected.valor)}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Pago ou Pendente</div>
                                <div className="field-value">
                                    <span className={`badge ${selected.pago_ou_pendente === 'Pago' ? 'badge-green' : 'badge-gold'}`}>
                                        {selected.pago_ou_pendente}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {editingServico && <AddServicoModal initialData={editingServico} onClose={() => setEditingServico(null)} onSave={() => { fetchHistorico(); setSelected(null); }} clientes={clientesList} />}
        </>
    );
}

// =============================================
// 6. CRAFs
// =============================================
function CrafsPage() {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [crafsList, setCrafsList] = useState([]);
    const [clientesList, setClientesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCraf, setEditingCraf] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        const [crafsData, clientesData] = await Promise.all([
            supabase.from('crafs').select('*, clientes(nome)').order('modelo_arma', { ascending: true }),
            supabase.from('clientes').select('id, nome').order('nome')
        ]);

        if (crafsData.error) console.error('Error fetching CRAFs:', crafsData.error);
        else setCrafsList(crafsData.data.map(c => ({ ...c, cliente: c.clientes?.nome })));

        setClientesList(clientesData.data || []);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const filtered = useMemo(() =>
        crafsList.filter(cr =>
            (cr.cliente || '').toLowerCase().includes(search.toLowerCase()) ||
            (cr.modelo_arma || '').toLowerCase().includes(search.toLowerCase()) ||
            (cr.n_serie || '').toLowerCase().includes(search.toLowerCase())
        ), [search, crafsList]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">CRAFS</h1>
                <div className="page-actions">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input placeholder="Procurar CRAFS" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><PlusCircle size={16} /> Add</button>
                </div>
            </div>
            <div className="page-body" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Tipo</th>
                                    <th>Calibre</th>
                                    <th>Modelo Arma</th>
                                    <th>Nº de Série</th>
                                    <th>Nº SIGMA</th>
                                    <th>Vencimento CRAF</th>
                                    <th>Acervo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="empty-state">Carregando CRAFs...</td></tr>
                                ) : filtered.map(cr => (
                                    <tr key={cr.id} onClick={() => setSelected(cr)}
                                        className={selected?.id === cr.id ? 'selected' : ''}>
                                        <td style={{ fontWeight: 500 }}>{cr.cliente}</td>
                                        <td>{cr.tipo}</td>
                                        <td><span className="badge badge-blue">{cr.calibre}</span></td>
                                        <td style={{ fontWeight: 600 }}>{cr.modelo_arma}</td>
                                        <td style={{ fontFamily: 'Courier New, monospace', fontSize: 12 }}>{cr.n_serie}</td>
                                        <td>{cr.n_sigma}</td>
                                        <td style={{ color: getDaysUntil(cr.vencimento_craf) < 90 ? 'var(--accent-gold)' : 'inherit' }}>
                                            {formatDate(cr.vencimento_craf)}
                                        </td>
                                        <td><span className={`badge ${cr.acervo === 'Caça' ? 'badge-green' : 'badge-blue'}`}>{cr.acervo}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {selected && (
                    <div style={{ width: 340 }}>
                        <div className="data-table-container" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700 }}>DETALHES</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-icon" onClick={() => {
                                        if (window.confirm('Excluir este CRAF?')) {
                                            supabase.from('crafs').delete().eq('id', selected.id).then(() => {
                                                setSelected(null);
                                                fetchData();
                                            });
                                        }
                                    }}><Trash2 size={16} /></button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setEditingCraf(selected)}><Edit size={14} /> Editar</button>
                                    <button className="btn-icon" onClick={() => setSelected(null)}><X size={16} /></button>
                                </div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Cliente</div>
                                <div className="field-value" style={{
                                    fontSize: 16

                                    , fontWeight: 700
                                }}>{selected.cliente}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Tipo</div>
                                <div className="field-value">{selected.tipo}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Nº de Série</div>
                                <div className="field-value" style={{ fontFamily: 'Courier New, monospace' }}>{selected.n_serie}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Nº SIGMA</div>
                                <div className="field-value">{selected.n_sigma}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Modelo Arma</div>
                                <div className="field-value">{selected.modelo_arma}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Vencimento do CRAF</div>
                                <div className="field-value">{formatDate(selected.vencimento_craf)}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Calibre</div>
                                <div className="field-value"><span className="badge badge-blue">{selected.calibre}</span></div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Acervo</div>
                                <div className="field-value">
                                    <span className={`badge ${selected.acervo === 'Caça' ? 'badge-green' : 'badge-blue'}`}>
                                        {selected.acervo}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showAddModal && <AddCrafModal onClose={() => setShowAddModal(false)} onSave={fetchData} clientes={clientesList} />}
            {editingCraf && <AddCrafModal initialData={editingCraf} onClose={() => setEditingCraf(null)} onSave={() => { fetchData(); setSelected(null); }} clientes={clientesList} />}
        </>
    );
}

// =============================================
// 7. GUIAS
// =============================================
function GuiasPage() {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [guiasList, setGuiasList] = useState([]);
    const [clientesList, setClientesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingGuia, setEditingGuia] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        const [guiasData, clientesData] = await Promise.all([
            supabase.from('guias').select('*, clientes(nome)').order('data_vencimento', { ascending: true }),
            supabase.from('clientes').select('id, nome').order('nome')
        ]);

        if (guiasData.error) console.error('Error fetching Guias:', guiasData.error);
        else setGuiasList(guiasData.data.map(g => ({ ...g, nome: g.clientes?.nome })));

        setClientesList(clientesData.data || []);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const filtered = useMemo(() =>
        guiasList.filter(g =>
            (g.nome || '').toLowerCase().includes(search.toLowerCase()) ||
            (g.arma_nome || '').toLowerCase().includes(search.toLowerCase()) ||
            (g.destino || '').toLowerCase().includes(search.toLowerCase())
        ), [search, guiasList]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">GUIAS</h1>
                <div className="page-actions">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input placeholder="Procurar GUIAS" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><PlusCircle size={16} /> Add</button>
                </div>
            </div>
            <div className="page-body" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Arma</th>
                                    <th>Data de Vencimento</th>
                                    <th>Tipo de Guia</th>
                                    <th>Destino</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="empty-state">Carregando guias...</td></tr>
                                ) : filtered.map(g => (
                                    <tr key={g.id} onClick={() => setSelected(g)}
                                        className={selected?.id === g.id ? 'selected' : ''}>
                                        <td style={{ fontWeight: 500 }}>{g.nome}</td>
                                        <td>{g.arma_nome}</td>
                                        <td style={{ color: getDaysUntil(g.data_vencimento) < 30 ? 'var(--accent-gold)' : 'inherit' }}>
                                            {formatDate(g.data_vencimento)}
                                        </td>
                                        <td>
                                            <span className={`badge ${g.tipo_guia === 'Caça' ? 'badge-green' : g.tipo_guia === 'Caça Treino' ? 'badge-gold' : 'badge-blue'}`}>
                                                {g.tipo_guia}
                                            </span>
                                        </td>
                                        <td>{g.destino}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {selected && (
                    <div style={{ width: 340 }}>
                        <div className="data-table-container" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700 }}>DETALHES</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-icon" onClick={() => {
                                        if (window.confirm('Excluir esta Guia?')) {
                                            supabase.from('guias').delete().eq('id', selected.id).then(() => {
                                                setSelected(null);
                                                fetchData();
                                            });
                                        }
                                    }}><Trash2 size={16} /></button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setEditingGuia(selected)}><Edit size={14} /> Editar</button>
                                    <button className="btn-icon" onClick={() => setSelected(null)}><X size={16} /></button>
                                </div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Nome</div>
                                <div className="field-value">{selected.nome}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Arma</div>
                                <div className="field-value">{selected.arma_nome}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Tipo de Guia</div>
                                <div className="field-value">
                                    <span className={`badge ${selected.tipo_guia === 'Caça' ? 'badge-green' : 'badge-gold'}`}>{selected.tipo_guia}</span>
                                </div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Data de Vencimento</div>
                                <div className="field-value">{formatDate(selected.data_vencimento)}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Destino</div>
                                <div className="field-value">{selected.destino}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showAddModal && <AddGuiaModal onClose={() => setShowAddModal(false)} onSave={fetchData} clientes={clientesList} />}
            {editingGuia && <AddGuiaModal initialData={editingGuia} onClose={() => setEditingGuia(null)} onSave={() => { fetchData(); setSelected(null); }} clientes={clientesList} />}
        </>
    );
}

// =============================================
// 8. SIMAF
// =============================================
function SimafPage() {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [simafList, setSimafList] = useState([]);
    const [clientesList, setClientesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSimaf, setEditingSimaf] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        const [simafData, clientesData] = await Promise.all([
            supabase.from('simaf').select('*, clientes(nome)').order('data_vencimento', { ascending: true }),
            supabase.from('clientes').select('id, nome').order('nome')
        ]);

        if (simafData.error) console.error('Error fetching SIMAF:', simafData.error);
        else setSimafList(simafData.data.map(s => ({ ...s, cliente: s.clientes?.nome })));

        setClientesList(clientesData.data || []);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const filtered = useMemo(() =>
        simafList.filter(s =>
            (s.cliente || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.fazenda || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.cidade || '').toLowerCase().includes(search.toLowerCase())
        ), [search, simafList]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">SIMAF</h1>
                <div className="page-actions">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input placeholder="Procurar SIMAF" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><PlusCircle size={16} /> Add</button>
                </div>
            </div>
            <div className="page-body" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data de Vencimento ↑</th>
                                    <th>Cliente</th>
                                    <th>Fazenda</th>
                                    <th>Proprietário</th>
                                    <th>Cidade</th>
                                    <th>Nº do CAR</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="empty-state">Carregando SIMAF...</td></tr>
                                ) : filtered.map(s => (
                                    <tr key={s.id} onClick={() => setSelected(s)}
                                        className={selected?.id === s.id ? 'selected' : ''}>
                                        <td style={{ color: getDaysUntil(s.data_vencimento) < 30 ? 'var(--accent-red)' : 'inherit' }}>
                                            {formatDate(s.data_vencimento)}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{s.cliente}</td>
                                        <td>{s.fazenda}</td>
                                        <td>{s.proprietario}</td>
                                        <td>{s.cidade}</td>
                                        <td style={{ fontFamily: 'Courier New, monospace', fontSize: 12 }}>{s.n_car}</td>
                                        <td style={{ color: 'var(--text-muted)', maxWidth: 200 }}>{s.observacoes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {selected && (
                    <div style={{ width: 340 }}>
                        <div className="data-table-container" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700 }}>DETALHES</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-icon" onClick={() => {
                                        if (window.confirm('Excluir este SIMAF?')) {
                                            supabase.from('simaf').delete().eq('id', selected.id).then(() => {
                                                setSelected(null);
                                                fetchData();
                                            });
                                        }
                                    }}><Trash2 size={16} /></button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 12px' }}><Edit size={14} /> Editar</button>
                                    <button className="btn-icon" onClick={() => setSelected(null)}><X size={16} /></button>
                                </div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Cliente</div>
                                <div className="field-value">{selected.cliente}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Fazenda</div>
                                <div className="field-value">{selected.fazenda}</div>
                            </div>
                            <div className="detail-field">
                                <div className="field-label">Data de Vencimento</div>
                                <div className="field-value">{formatDate(selected.data_vencimento)}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showAddModal && <AddSimafModal onClose={() => setShowAddModal(false)} onSave={fetchData} clientes={clientesList} />}
            {editingSimaf && <AddSimafModal initialData={editingSimaf} onClose={() => setEditingSimaf(null)} onSave={() => { fetchData(); setSelected(null); }} clientes={clientesList} />}
        </>
    );
}

// =============================================
// SOBRE
// =============================================
function SobrePage() {
    return (
        <div className="page-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="logo-icon" style={{
                    width: 80, height: 80, borderRadius: 16,
                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 auto 20px'
                }}>GC</div>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>
                    G<span style={{ color: 'var(--accent-green)' }}>CAC</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                    GESTÃO DE DADOS CAC
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 400, margin: '0 auto' }}>
                    Sistema de gestão para colecionadores, atiradores e caçadores.
                    Controle de documentos, prazos e serviços.
                </p>
            </div>
        </div>
    );
}

// =============================================
// =============================================
// MODALS
// =============================================
function AddClienteModal({ onClose, onSave, initialData }) {
    const [formData, setFormData] = useState(initialData || {
        nome: '',
        cpf: '',
        contato: '',
        senha_gov: '',
        cr: '',
        cr_expiry: '',
        filiado: false
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.nome || !formData.cpf) {
            alert('Nome e CPF são obrigatórios');
            return;
        }
        setLoading(true);

        const { id, ...dataToSave } = formData;
        let result;
        if (id) {
            result = await supabase.from('clientes').update(dataToSave).eq('id', id);
        } else {
            result = await supabase.from('clientes').insert([dataToSave]);
        }

        if (result.error) {
            console.error('Error saving client:', result.error);
            alert('Erro ao salvar cliente: ' + result.error.message);
        } else {
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{formData.id ? 'EDITAR CLIENTE' : 'NOVO CLIENTE'}</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label required">Nome Completo</label>
                        <input className="form-input" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">CPF</label>
                            <input className="form-input" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contato / WhatsApp</label>
                            <input className="form-input" value={formData.contato} onChange={e => setFormData({ ...formData, contato: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Senha GOV</label>
                            <input className="form-input" value={formData.senha_gov} onChange={e => setFormData({ ...formData, senha_gov: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nº do CR</label>
                            <input className="form-input" value={formData.cr} onChange={e => setFormData({ ...formData, cr: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Vencimento do CR</label>
                            <input type="date" className="form-input" value={formData.cr_expiry || ''} onChange={e => setFormData({ ...formData, cr_expiry: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Filiado Pró-Tiro?</label>
                            <div className="form-toggle">
                                <button className={`toggle-btn ${!formData.filiado ? 'active' : ''}`} onClick={() => setFormData({ ...formData, filiado: false })}>NÃO</button>
                                <button className={`toggle-btn ${formData.filiado ? 'active' : ''}`} onClick={() => setFormData({ ...formData, filiado: true })}>SIM</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AddServicoModal({ onClose, onSave, clientes, initialData }) {
    const [formData, setFormData] = useState(initialData || {
        cliente_id: '',
        data: new Date().toISOString().split('T')[0],
        status: 'Não Iniciado',
        servico_executado: 'NÃO PROTOCOLADO',
        tipo_servico: TIPOS_SERVICO[0],
        gru_paga: false,
        filiado_pro_tiro: false,
        valor: 0,
        pago_ou_pendente: 'Pendente',
        forma_pagamento: '',
        observacoes: '',
        n_protocolo: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.cliente_id) {
            alert('Selecione um cliente');
            return;
        }
        setLoading(true);

        const { id, ...dataToSave } = formData;
        let result;
        if (id) {
            // Remove synthetic fields if they exist
            delete dataToSave.cliente;
            result = await supabase.from('servicos').update(dataToSave).eq('id', id);
        } else {
            result = await supabase.from('servicos').insert([dataToSave]);
        }

        if (result.error) {
            console.error('Error saving service:', result.error);
            alert('Erro ao salvar serviço: ' + result.error.message);
        } else {
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{formData.id ? 'EDITAR INFORMAÇÕES' : 'INSERIR INFORMAÇÕES'}</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Data</label>
                            <input type="date" className="form-input" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status do Serviço</label>
                            <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                {STATUS_SERVICO.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label required">Nome do Cliente</label>
                        <select className="form-select" value={formData.cliente_id} onChange={e => {
                            const c = clientes.find(cli => cli.id === e.target.value);
                            setFormData({ ...formData, cliente_id: e.target.value, filiado_pro_tiro: c?.filiado || false });
                        }}>
                            <option value="">Selecionar cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label required">Serviço Executado?</label>
                        <div className="form-toggle">
                            <button className={`toggle-btn ${formData.servico_executado === 'NÃO PROTOCOLADO' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, servico_executado: 'NÃO PROTOCOLADO' })}>NÃO PROTOCOLADO</button>
                            <button className={`toggle-btn ${formData.servico_executado === 'PROTOCOLADO' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, servico_executado: 'PROTOCOLADO' })}>PROTOCOLADO</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Serviços</label>
                        <select className="form-select" value={formData.tipo_servico} onChange={e => setFormData({ ...formData, tipo_servico: e.target.value })}>
                            {TIPOS_SERVICO.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">GRU Paga?</label>
                            <div className="form-toggle">
                                <button className={`toggle-btn ${!formData.gru_paga ? 'active' : ''}`} onClick={() => setFormData({ ...formData, gru_paga: false })}>NÃO</button>
                                <button className={`toggle-btn ${formData.gru_paga ? 'active' : ''}`} onClick={() => setFormData({ ...formData, gru_paga: true })}>SIM</button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Filiado Pró-Tiro?</label>
                            <div className="form-toggle">
                                <button className={`toggle-btn ${!formData.filiado_pro_tiro ? 'active' : ''}`} onClick={() => setFormData({ ...formData, filiado_pro_tiro: false })}>NÃO</button>
                                <button className={`toggle-btn ${formData.filiado_pro_tiro ? 'active' : ''}`} onClick={() => setFormData({ ...formData, filiado_pro_tiro: true })}>SIM</button>
                            </div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Valor</label>
                            <input type="number" className="form-input" value={formData.valor} onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })} placeholder="R$ 0,00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Situação</label>
                            <div className="form-toggle">
                                <button className={`toggle-btn ${formData.pago_ou_pendente === 'Pago' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, pago_ou_pendente: 'Pago' })}>PAGO</button>
                                <button className={`toggle-btn ${formData.pago_ou_pendente === 'Pendente' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, pago_ou_pendente: 'Pendente' })}>PENDENTE</button>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Forma de Pagamento</label>
                        <input className="form-input" value={formData.forma_pagamento || ''} onChange={e => setFormData({ ...formData, forma_pagamento: e.target.value })} placeholder="PIX, Cartão, Dinheiro..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Observações</label>
                        <textarea className="form-textarea" value={formData.observacoes || ''} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Anotações sobre o serviço..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nº do Protocolo</label>
                        <input className="form-input" value={formData.n_protocolo || ''} onChange={e => setFormData({ ...formData, n_protocolo: e.target.value })} placeholder="Ex: 08795.002627/2025" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function AddCrafModal({ onClose, onSave, clientes, initialData }) {
    const [formData, setFormData] = useState(initialData || {
        cliente_id: '',
        tipo: '',
        calibre: '',
        modelo_arma: '',
        n_serie: '',
        n_sigma: '',
        vencimento_craf: '',
        acervo: 'Caça'
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.cliente_id || !formData.modelo_arma || !formData.n_serie) {
            alert('Campos obrigatórios: Cliente, Modelo e Nº de Série');
            return;
        }
        setLoading(true);

        const { id, ...dataToSave } = formData;
        let result;
        if (id) {
            delete dataToSave.cliente;
            result = await supabase.from('crafs').update(dataToSave).eq('id', id);
        } else {
            result = await supabase.from('crafs').insert([dataToSave]);
        }

        if (result.error) {
            console.error('Error saving CRAF:', result.error);
            alert('Erro ao salvar CRAF: ' + result.error.message);
        } else {
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{formData.id ? 'EDITAR CRAF' : 'NOVO CRAF'}</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label required">Cliente</label>
                        <select className="form-select" value={formData.cliente_id} onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}>
                            <option value="">Selecionar cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Tipo de Arma</label>
                            <input className="form-input" placeholder="Ex: Pistola, Fuzil..." value={formData.tipo || ''} onChange={e => setFormData({ ...formData, tipo: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Calibre</label>
                            <input className="form-input" placeholder="Ex: 9mm, .40..." value={formData.calibre || ''} onChange={e => setFormData({ ...formData, calibre: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label required">Modelo da Arma</label>
                        <input className="form-input" value={formData.modelo_arma || ''} onChange={e => setFormData({ ...formData, modelo_arma: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Nº de Série</label>
                            <input className="form-input" value={formData.n_serie || ''} onChange={e => setFormData({ ...formData, n_serie: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nº SIGMA</label>
                            <input className="form-input" value={formData.n_sigma || ''} onChange={e => setFormData({ ...formData, n_sigma: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Vencimento do CRAF</label>
                            <input type="date" className="form-input" value={formData.vencimento_craf || ''} onChange={e => setFormData({ ...formData, vencimento_craf: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Acervo</label>
                            <select className="form-select" value={formData.acervo} onChange={e => setFormData({ ...formData, acervo: e.target.value })}>
                                <option value="Caça">Caça</option>
                                <option value="Coleção">Coleção</option>
                                <option value="Tiro Esportivo">Tiro Esportivo</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AddGuiaModal({ onClose, onSave, clientes, initialData }) {
    const [formData, setFormData] = useState(initialData || {
        cliente_id: '',
        arma_nome: '',
        data_vencimento: '',
        tipo_guia: 'Caça',
        destino: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.cliente_id || !formData.arma_nome || !formData.data_vencimento) {
            alert('Campos obrigatórios: Cliente, Arma e Vencimento');
            return;
        }
        setLoading(true);

        const { id, ...dataToSave } = formData;
        let result;
        if (id) {
            delete dataToSave.nome;
            result = await supabase.from('guias').update(dataToSave).eq('id', id);
        } else {
            result = await supabase.from('guias').insert([dataToSave]);
        }

        if (result.error) {
            console.error('Error saving Guia:', result.error);
            alert('Erro ao salvar Guia: ' + result.error.message);
        } else {
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{formData.id ? 'EDITAR GUIA' : 'NOVA GUIA'}</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label required">Cliente</label>
                        <select className="form-select" value={formData.cliente_id} onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}>
                            <option value="">Selecionar cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label required">Arma</label>
                        <input className="form-input" placeholder="Ex: Glock G17, Taurus G2C..." value={formData.arma_nome || ''} onChange={e => setFormData({ ...formData, arma_nome: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Data de Vencimento</label>
                            <input type="date" className="form-input" value={formData.data_vencimento || ''} onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tipo de Guia</label>
                            <select className="form-select" value={formData.tipo_guia} onChange={e => setFormData({ ...formData, tipo_guia: e.target.value })}>
                                <option value="Caça">Caça</option>
                                <option value="Caça Treino">Caça Treino</option>
                                <option value="Tiro Esportivo">Tiro Esportivo</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Destino / Local</label>
                        <input className="form-input" placeholder="Ex: Clube de Tiro X, Fazenda Y..." value={formData.destino || ''} onChange={e => setFormData({ ...formData, destino: e.target.value })} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function AddSimafModal({ onClose, onSave, clientes, initialData }) {
    const [formData, setFormData] = useState(initialData || {
        cliente_id: '',
        fazenda: '',
        proprietario: '',
        cidade: '',
        n_car: '',
        data_vencimento: '',
        observacoes: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.cliente_id || !formData.fazenda || !formData.data_vencimento) {
            alert('Campos obrigatórios: Cliente, Fazenda e Vencimento');
            return;
        }
        setLoading(true);

        const { id, ...dataToSave } = formData;
        let result;
        if (id) {
            delete dataToSave.cliente;
            result = await supabase.from('simaf').update(dataToSave).eq('id', id);
        } else {
            result = await supabase.from('simaf').insert([dataToSave]);
        }

        if (result.error) {
            console.error('Error saving SIMAF:', result.error);
            alert('Erro ao salvar SIMAF: ' + result.error.message);
        } else {
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ width: 640 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{formData.id ? 'EDITAR SIMAF' : 'NOVO SIMAF'}</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label required">Cliente</label>
                        <select className="form-select" value={formData.cliente_id} onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}>
                            <option value="">Selecionar cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Fazenda</label>
                            <input className="form-input" value={formData.fazenda || ''} onChange={e => setFormData({ ...formData, fazenda: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Proprietário</label>
                            <input className="form-input" value={formData.proprietario || ''} onChange={e => setFormData({ ...formData, proprietario: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Cidade</label>
                            <input className="form-input" value={formData.cidade || ''} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nº do CAR</label>
                            <input className="form-input" placeholder="Ex: MG-3106209-..." value={formData.n_car || ''} onChange={e => setFormData({ ...formData, n_car: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label required">Data de Vencimento</label>
                        <input type="date" className="form-input" value={formData.data_vencimento || ''} onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Observações</label>
                        <textarea className="form-textarea" rows="3" value={formData.observacoes || ''} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function PrecoModal({ onClose, onSave, initialData, defaultTipo }) {
    const [formData, setFormData] = useState(initialData || {
        servico: '',
        taxas_gru: 0,
        valor: 0,
        observacoes: '',
        tipo_cliente: defaultTipo || 'Filiado'
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.servico) {
            alert('Serviço é obrigatório');
            return;
        }
        setLoading(true);
        const { id, ...dataToSave } = formData;
        let result;
        if (id) {
            result = await supabase.from('tabela_precos').update(dataToSave).eq('id', id);
        } else {
            result = await supabase.from('tabela_precos').insert([dataToSave]);
        }
        if (result.error) {
            console.error('Error saving price:', result.error);
            alert('Erro ao salvar: ' + result.error.message);
        } else {
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{formData.id ? 'EDITAR PREÇO' : 'NOVO PREÇO'}</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>Salvar</button>
                    </div>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label required">Serviço</label>
                        <input className="form-input" value={formData.servico || ''} onChange={e => setFormData({ ...formData, servico: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Taxas (GRU)</label>
                            <input type="number" className="form-input" value={formData.taxas_gru || 0} onChange={e => setFormData({ ...formData, taxas_gru: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Valor do Serviço</label>
                            <input type="number" className="form-input" value={formData.valor || 0} onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Observações</label>
                        <textarea className="form-textarea" value={formData.observacoes || ''} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
                    </div>
                </div>
            </div>
        </div>
    );
}


// MAIN APP
// =============================================
function App() {
    return (
        <Router>
            <Sidebar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/servicos" element={<ServicosPage />} />
                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/clientes/:id" element={<ClienteDetailPage />} />
                    <Route path="/filiado" element={<FiliadoPage />} />
                    <Route path="/nao-filiado" element={<NaoFiliadoPage />} />
                    <Route path="/historico" element={<HistoricoPage />} />
                    <Route path="/crafs" element={<CrafsPage />} />
                    <Route path="/guias" element={<GuiasPage />} />
                    <Route path="/simaf" element={<SimafPage />} />
                    <Route path="/sobre" element={<SobrePage />} />
                </Routes>
            </main>
        </Router>
    );
}

export default App;
