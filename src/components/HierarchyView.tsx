import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import type { UserProfile, Weapon, TrafficGuide, TipoArma, Calibre, TipoAcervo, TipoGuia } from '../types';
import { formatDateBR, isExpiringSoon, maskCPF, maskPhone, getClassificacaoCalibre, getWeaponLimits } from '../utils';

// ─── Constants ────────────────────────────────────────────────────
const TIPOS_GUIA: TipoGuia[] = ['Caça', 'Caça Treino', 'Caça Manutenção', 'Tiro Desportivo', 'Tiro Desportivo Manutenção'];
const CALIBRES = ['.22 LR', '.380 ACP', '9mm', '.40 S&W', '.45 ACP', '.38 SPL', '.357 Mag', '12 GA', '5.56', '7.62', '.308 Win'];
const TIPOS_ARMA: TipoArma[] = ['Carabina/Fuzil', 'Revólver', 'Pistola', 'Pistolete', 'Espingarda'];
const TIPOS_ACERVO: TipoAcervo[] = ['Atirador', 'Caçador', 'Colecionador'];
const FABRICANTES = ['CBC', 'Colt', 'CZ', 'Glock', 'Imbel', 'Rossi', 'Smith & Wesson', 'Taurus', 'Winchester'];
const BLANK_WEAPON: Partial<Weapon> = { tipo: undefined, tipoFuncionamento: undefined, calibre: undefined, registroSistema: undefined, tipoAcervo: undefined, vencimentoCRAF: '', fabricante: undefined };

const getWeaponImage = (tipo?: string, modelo?: string, tipoFuncionamento?: string) => {
    const mod = modelo?.toLowerCase() || '';
    if (mod.includes('fuzil')) {
        if (tipoFuncionamento === 'Semi-Auto') return '/vetores/FUZIL SEMI AUTO.jpg';
        if (tipoFuncionamento === 'Repetição') return '/vetores/FUZIL DE REPETIÇÃO.jpg';
    }
    if (mod.includes('carabina')) return '/vetores/CARABINA PUMA.jpeg';
    if (mod.includes('rifle')) return '/vetores/RIFLE.png';

    if (tipo === 'Espingarda') return '/vetores/ESPINGARDA.png';
    if (tipo === 'Pistola') return '/vetores/PISTOLA.png';
    if (tipo === 'Pistolete') return '/vetores/PISTOLETE.png';

    return '/vetores/VETOR.png'; // Fallback genérico
};

// ─── ConfirmDialog via Portal ─────────────────────────────────────
// Renderiza direto no body para não ser cortado por overflow:hidden
interface ConfirmDialogProps { message: string; onConfirm: () => void; onCancel: () => void; }
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) =>
    ReactDOM.createPortal(
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.78)' }}
            onClick={e => e.stopPropagation()}
        >
            <div className="glass-panel animate-fade-in border-danger" style={{ maxWidth: '30rem', width: '90%', padding: '2rem' }}>
                <p style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '1.8rem', lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <button className="btn btn-secondary text-danger border-danger" style={{ minWidth: '140px' }} onClick={onConfirm}>Sim, excluir</button>
                    <button className="btn btn-primary" style={{ minWidth: '140px' }} onClick={onCancel}>Cancelar</button>
                </div>
            </div>
        </div>,
        document.body
    );

// ─── WeaponForm — FORA do HierarchyView para evitar remontagem ────
// CRITICAL: Definir componentes DENTRO de outro componente causa
// remontagem a cada render e perda de foco nos inputs.
interface WeaponFormProps {
    data: Partial<Weapon>;
    onChange: (field: keyof Weapon, value: string | undefined) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    onCancel: () => void;
    formId: string; // unique id to distinguish add vs edit radio groups
}

const WeaponForm: React.FC<WeaponFormProps> = ({
    data, onChange, onSubmit, submitLabel, onCancel, formId
}) => (
    <form onSubmit={onSubmit} className="mt-4 p-4 bg-black bg-opacity-30 border border-accent-primary rounded-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-color-light pb-4 mb-4">
            <div>
                <label className="text-sm font-bold block mb-1">Tipo de Funcionamento *</label>
                <select required value={data.tipoFuncionamento || ''} onChange={e => onChange('tipoFuncionamento', e.target.value)}>
                    <option value="" disabled>Selecione</option>
                    <option value="Repetição">Repetição</option>
                    <option value="Semi-Auto">Semi Auto</option>
                </select>
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Fabricante / Marca *</label>
                <select required value={data.fabricante && FABRICANTES.includes(data.fabricante) ? data.fabricante : (data.fabricante === 'Outro' ? 'Outro' : '')} onChange={e => {
                    if (e.target.value !== 'Outro') onChange('fabricante', e.target.value);
                    else onChange('fabricante', 'Outro');
                }}>
                    <option value="" disabled>Selecione</option>
                    {FABRICANTES.map(f => <option key={f} value={f}>{f}</option>)}
                    <option value="Outro">Outro / Digitar manualmente</option>
                </select>
                {(!FABRICANTES.includes(data.fabricante || '') && data.fabricante !== undefined) && (
                    <input type="text" className="mt-2 text-sm w-full" placeholder="Digite o fabricante" required value={data.fabricante || ''} onChange={e => onChange('fabricante', e.target.value)} />
                )}
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Modelo *</label>
                <input type="text" required value={data.modelo || ''} onChange={e => onChange('modelo', e.target.value)} />
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Tipo da Arma *</label>
                <select required value={data.tipo || ''} onChange={e => onChange('tipo', e.target.value)}>
                    <option value="" disabled>Selecione</option>
                    {TIPOS_ARMA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Calibre *</label>
                <select required value={data.calibre || ''} onChange={e => onChange('calibre', e.target.value)}>
                    <option value="" disabled>Selecione</option>
                    {CALIBRES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Nº de Série *</label>
                <input type="text" required value={data.numeroSerie || ''} onChange={e => onChange('numeroSerie', e.target.value)} />
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Acervo *</label>
                <select required value={data.tipoAcervo || ''} onChange={e => onChange('tipoAcervo', e.target.value)}>
                    <option value="" disabled>Selecione</option>
                    {TIPOS_ACERVO.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Vencimento CRAF *</label>
                <input type="date" required value={data.vencimentoCRAF || ''} onChange={e => onChange('vencimentoCRAF', e.target.value)} />
            </div>
            <div>
                <label className="text-sm font-bold block mb-1">Sistema de Registro *</label>
                <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`sis_${formId}`} checked={data.registroSistema === 'SIGMA'} onChange={() => onChange('registroSistema', 'SIGMA')} /> SIGMA
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`sis_${formId}`} checked={data.registroSistema === 'SINARM'} onChange={() => onChange('registroSistema', 'SINARM')} /> SINARM
                    </label>
                </div>
            </div>
            {data.registroSistema === 'SIGMA' && (
                <div>
                    <label className="text-sm font-bold block mb-1">Nº SIGMA</label>
                    <input type="text" value={data.numeroSigma || ''} onChange={e => onChange('numeroSigma', e.target.value)} />
                </div>
            )}
            {data.registroSistema === 'SINARM' && (
                <div>
                    <label className="text-sm font-bold block mb-1">Nº SINARM</label>
                    <input type="text" value={data.numeroSinarm || ''} onChange={e => onChange('numeroSinarm', e.target.value)} />
                </div>
            )}

        </div>

        <div className="flex gap-3 mt-5">
            <button type="submit" className="btn btn-primary flex-1 py-3">{submitLabel}</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        </div>
    </form>
);

// ─── HierarchyView ────────────────────────────────────────────────
interface HierarchyProps {
    user: UserProfile;
    weapons: Weapon[];
    guides: TrafficGuide[];
    onAddWeapon: (w: Weapon) => void;
    onUpdateWeapon: (w: Weapon) => void;
    onDeleteWeapon: (id: string) => void;
    onAddGuide: (g: TrafficGuide) => void;
    onDeleteGuide: (id: string) => void;
    onUpdateProfile?: (u: UserProfile) => void;
}

export const HierarchyView: React.FC<HierarchyProps> = ({
    user, weapons, guides,
    onAddWeapon, onUpdateWeapon, onDeleteWeapon,
    onAddGuide, onDeleteGuide, onUpdateProfile
}) => {
    const [expandedWeaponId, setExpandedWeaponId] = useState<string | null>(null);

    // ── Profile ─────────────────────────────────────────────────
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editUser, setEditUser] = useState<UserProfile>(user);

    // ── New weapon form ────────────────────────────────────────
    const [isAddingWeapon, setIsAddingWeapon] = useState(false);
    const [newWeapon, setNewWeapon] = useState<Partial<Weapon>>(BLANK_WEAPON);

    // ── Edit weapon form ───────────────────────────────────────
    const [editingWeaponId, setEditingWeaponId] = useState<string | null>(null);
    const [editWeapon, setEditWeapon] = useState<Partial<Weapon>>({});

    // ── Guide form ─────────────────────────────────────────────
    const [addingGuideForWeapon, setAddingGuideForWeapon] = useState<string | null>(null);
    const [newGuide, setNewGuide] = useState<Partial<TrafficGuide>>({ tipoGuia: 'Tiro Desportivo', vencimentoGT: '', destino: '', observacoes: '' });
    // Seletor Estado/Cidade para guias Caça
    const [guiaEstados, setGuiaEstados] = useState<{ sigla: string; nome: string }[]>([]);
    const [guiaMunicipios, setGuiaMunicipios] = useState<{ nome: string }[]>([]);
    const [guiaEstado, setGuiaEstado] = useState('');
    const [guiaCidade, setGuiaCidade] = useState('');

    // ── Confirm dialogs ────────────────────────────────────────
    const [confirmDeleteWeapon, setConfirmDeleteWeapon] = useState<string | null>(null);
    const [confirmDeleteGuide, setConfirmDeleteGuide] = useState<string | null>(null);

    // ── Profile handlers ─────────────────────────────────────────
    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();

        if (editUser.atividadesCR.length === 0) {
            alert('Por favor, selecione pelo menos uma Atividade Ativa no CR (*).');
            return;
        }

        setIsEditingProfile(false);
        onUpdateProfile?.(editUser);
    };

    const handleAtividadeChange = useCallback((atividade: string, checked: boolean) => {
        setEditUser(prev => ({
            ...prev,
            atividadesCR: checked ? [...prev.atividadesCR, atividade] : prev.atividadesCR.filter(a => a !== atividade)
        }));
    }, []);

    // ── Weapon onChange (for WeaponForm) ──────────────────────────
    const handleNewWeaponChange = useCallback((field: keyof Weapon, value: string | undefined) => {
        setNewWeapon(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleEditWeaponChange = useCallback((field: keyof Weapon, value: string | undefined) => {
        setEditWeapon(prev => ({ ...prev, [field]: value }));
    }, []);

    // ── Add weapon ─────────────────────────────────────────────
    const handleAddWeapon = (e: React.FormEvent) => {
        e.preventDefault();

        // --- Limit Validation ---
        const acervo = newWeapon.tipoAcervo as TipoAcervo;
        const calibre = newWeapon.calibre as Calibre;
        if (acervo && calibre) {
            const classsificacao = getClassificacaoCalibre(calibre, newWeapon.tipo, newWeapon.modelo, newWeapon.tipoFuncionamento);
            const limits = getWeaponLimits(acervo, user.nivelAtirador);

            // Count existing weapons in this acervo
            const weaponsInAcervo = weapons.filter(w => w.tipoAcervo === acervo);
            const permitidasCount = weaponsInAcervo.filter(w => getClassificacaoCalibre(w.calibre, w.tipo, w.modelo, w.tipoFuncionamento) === 'Permitido').length;
            const restritasCount = weaponsInAcervo.filter(w => getClassificacaoCalibre(w.calibre, w.tipo, w.modelo, w.tipoFuncionamento) === 'Restrito').length;
            const totalCount = weaponsInAcervo.length;

            if (totalCount >= limits.total) {
                alert(`Limite de armas excedido para o acervo de ${acervo} (Máximo total: ${limits.total}).`);
                return;
            }
            if (classsificacao === 'Permitido' && permitidasCount >= limits.permitido) {
                alert(`Limite de armas de Uso Permitido excedido para o acervo de ${acervo} (Máximo permitido: ${limits.permitido}).`);
                return;
            }
            if (classsificacao === 'Restrito' && restritasCount >= limits.restrito) {
                alert(`Limite de armas de Uso Restrito excedido para o acervo de ${acervo} (Máximo restrito: ${limits.restrito}).`);
                return;
            }
        }
        // ------------------------

        const w: Weapon = {
            id: crypto.randomUUID(),
            userId: user.id,
            tipo: newWeapon.tipo as TipoArma,
            fabricante: newWeapon.fabricante || '',
            modelo: newWeapon.modelo || '',
            calibre: newWeapon.calibre as Calibre,
            numeroSerie: newWeapon.numeroSerie || '',
            registroSistema: newWeapon.registroSistema as 'SIGMA' | 'SINARM',
            numeroSigma: newWeapon.registroSistema === 'SIGMA' ? newWeapon.numeroSigma : undefined,
            numeroSinarm: newWeapon.registroSistema === 'SINARM' ? newWeapon.numeroSinarm : undefined,
            tipoFuncionamento: newWeapon.tipoFuncionamento as 'Repetição' | 'Semi-Auto',
            vencimentoCRAF: newWeapon.vencimentoCRAF || '',
            tipoAcervo: newWeapon.tipoAcervo as TipoAcervo,
            imageUrl: newWeapon.imageUrl
        };
        onAddWeapon(w);
        setIsAddingWeapon(false);
        setNewWeapon(BLANK_WEAPON);
    };

    // ── Edit weapon ────────────────────────────────────────────
    const handleSaveEditWeapon = (e: React.FormEvent) => {
        e.preventDefault();
        const original = weapons.find(w => w.id === editingWeaponId)!;
        const updated: Weapon = {
            ...original,
            tipo: editWeapon.tipo as TipoArma || original.tipo,
            fabricante: editWeapon.fabricante ?? original.fabricante,
            modelo: editWeapon.modelo ?? original.modelo,
            calibre: editWeapon.calibre as Calibre || original.calibre,
            numeroSerie: editWeapon.numeroSerie ?? original.numeroSerie,
            registroSistema: (editWeapon.registroSistema as 'SIGMA' | 'SINARM') || original.registroSistema,
            numeroSigma: editWeapon.registroSistema === 'SIGMA' ? editWeapon.numeroSigma : undefined,
            numeroSinarm: editWeapon.registroSistema === 'SINARM' ? editWeapon.numeroSinarm : undefined,
            tipoFuncionamento: editWeapon.tipoFuncionamento as 'Repetição' | 'Semi-Auto' || original.tipoFuncionamento,
            vencimentoCRAF: editWeapon.vencimentoCRAF ?? original.vencimentoCRAF,
            tipoAcervo: editWeapon.tipoAcervo as TipoAcervo || original.tipoAcervo,
            imageUrl: editWeapon.imageUrl ?? original.imageUrl
        };
        onUpdateWeapon(updated);
        setEditingWeaponId(null);
    };

    // ── Delete weapon ──────────────────────────────────────────
    const doDeleteWeapon = () => {
        if (confirmDeleteWeapon) {
            onDeleteWeapon(confirmDeleteWeapon);
            setConfirmDeleteWeapon(null);
            setExpandedWeaponId(null);
        }
    };

    // ── Guide ──────────────────────────────────────────────────
    const isCacaGuia = (tipo?: string) => tipo?.includes('Caça');

    React.useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(r => r.json()).then(setGuiaEstados).catch(() => { });
    }, []);

    React.useEffect(() => {
        if (guiaEstado) {
            setGuiaCidade('');
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${guiaEstado}/municipios?orderBy=nome`)
                .then(r => r.json()).then(setGuiaMunicipios).catch(() => { });
        } else {
            setGuiaMunicipios([]);
        }
    }, [guiaEstado]);

    const handleSaveGuide = (e: React.FormEvent) => {
        e.preventDefault();
        const destino = isCacaGuia(newGuide.tipoGuia)
            ? (guiaCidade && guiaEstado ? `${guiaCidade} - ${guiaEstado}` : newGuide.destino || '')
            : newGuide.destino || '';
        const g: TrafficGuide = {
            id: crypto.randomUUID(),
            weaponId: addingGuideForWeapon!,
            tipoGuia: newGuide.tipoGuia as TipoGuia,
            vencimentoGT: newGuide.vencimentoGT || '',
            destino,
            observacoes: newGuide.observacoes || ''
        };
        onAddGuide(g);
        setAddingGuideForWeapon(null);
        setNewGuide({ tipoGuia: 'Tiro Desportivo', vencimentoGT: '', destino: '', observacoes: '' });
        setGuiaEstado('');
        setGuiaCidade('');
    };

    const doDeleteGuide = () => {
        if (confirmDeleteGuide) {
            onDeleteGuide(confirmDeleteGuide);
            setConfirmDeleteGuide(null);
        }
    };

    // ── JSX ───────────────────────────────────────────────────────
    return (
        <div className="p-4 animate-fade-in" id="modulo-acervo">

            {/* Confirm Dialogs */}
            {confirmDeleteWeapon && (
                <ConfirmDialog
                    message="⚠️ Tem certeza que deseja EXCLUIR esta arma do acervo? Essa ação não pode ser desfeita."
                    onConfirm={doDeleteWeapon}
                    onCancel={() => setConfirmDeleteWeapon(null)}
                />
            )}
            {confirmDeleteGuide && (
                <ConfirmDialog
                    message="⚠️ Deseja realmente EXCLUIR esta Guia de Tráfego? Essa ação não pode ser desfeita."
                    onConfirm={doDeleteGuide}
                    onCancel={() => setConfirmDeleteGuide(null)}
                />
            )}

            {/* ── PERFIL ─── */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="section-title mb-0 border-b-0">PERFIL</h2>
                <button className="btn btn-secondary text-sm" onClick={() => setIsEditingProfile(v => !v)}>
                    {isEditingProfile ? 'Cancelar' : 'Editar Perfil'}
                </button>
            </div>

            <div className="glass-panel p-6 mb-8">
                {!isEditingProfile ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{user.nome}</h3>
                            <span className="badge badge-success">ATIVO: {user.atividadesCR.join(', ')}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <p><strong>CPF:</strong> {maskCPF(user.cpf)}</p>
                            <p><strong>Senha GOV.br:</strong> {user.senhaGovBr || 'Não informada'}</p>
                            <p><strong>CR Nº:</strong> {user.numeroCR}</p>
                            <p><strong>Vencimento CR:</strong> {formatDateBR(user.vencimentoCR)}
                                {isExpiringSoon(user.vencimentoCR, 30) && <span className="ml-2 text-danger font-bold">(Alerta)</span>}
                            </p>
                            <p><strong>Clube:</strong> {user.clubeFiliado || 'Não informado'}</p>
                            <p><strong>Telefone:</strong> {maskPhone(user.telefone)}</p>
                            {user.atividadesCR.includes('Atirador Desportivo') && (
                                <p><strong>Nível de Atirador:</strong> {user.nivelAtirador ? `Nível ${user.nivelAtirador}` : 'Não informado'}</p>
                            )}
                        </div>
                    </>
                ) : (
                    <form className="flex flex-col gap-4 animate-fade-in" onSubmit={handleSaveProfile}>
                        <h3 className="font-bold text-accent-primary mb-2">Editando Dados Cadastrais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-bold block mb-1">Nome Completo</label>
                                <input type="text" value={editUser.nome} onChange={e => setEditUser(p => ({ ...p, nome: e.target.value }))} /></div>
                            <div><label className="text-sm font-bold block mb-1">CPF</label>
                                <input type="text" value={maskCPF(editUser.cpf)} onChange={e => setEditUser(p => ({ ...p, cpf: e.target.value }))} /></div>
                            <div><label className="text-sm font-bold block mb-1">Contato (WhatsApp)</label>
                                <input type="text" value={maskPhone(editUser.telefone)} onChange={e => setEditUser(p => ({ ...p, telefone: e.target.value }))} /></div>
                            <div><label className="text-sm font-bold block mb-1">Senha GOV.br</label>
                                <input type="text" value={editUser.senhaGovBr || ''} onChange={e => setEditUser(p => ({ ...p, senhaGovBr: e.target.value }))} /></div>
                            <div><label className="text-sm font-bold block mb-1">Nº do CR</label>
                                <input type="text" value={editUser.numeroCR} onChange={e => setEditUser(p => ({ ...p, numeroCR: e.target.value }))} /></div>
                            <div><label className="text-sm font-bold block mb-1">Validade do CR</label>
                                <input type="date" value={editUser.vencimentoCR} onChange={e => setEditUser(p => ({ ...p, vencimentoCR: e.target.value }))} /></div>
                            <div><label className="text-sm font-bold block mb-1">Clube de Tiro</label>
                                <input type="text" value={editUser.clubeFiliado} onChange={e => setEditUser(p => ({ ...p, clubeFiliado: e.target.value }))} /></div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-bold block mb-2">Atividades Ativas no CR *</label>
                                <div className="flex gap-4 p-3 bg-black bg-opacity-20 rounded-md border border-color-light flex-wrap">
                                    {['Atirador Desportivo', 'Caçador', 'Colecionador'].map(a => (
                                        <label key={a} className="flex items-center gap-2 cursor-pointer text-sm">
                                            <input type="checkbox" checked={editUser.atividadesCR.includes(a)} onChange={e => handleAtividadeChange(a, e.target.checked)} /> {a}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {editUser.atividadesCR.includes('Atirador Desportivo') && (
                                <div className="md:col-span-2">
                                    <label className="text-sm font-bold block mb-1">Nível de Atirador (1 a 3)</label>
                                    <select value={editUser.nivelAtirador || ''} onChange={e => setEditUser(p => ({ ...p, nivelAtirador: e.target.value as '1' | '2' | '3' }))}>
                                        <option value="" disabled>Selecione o nível</option>
                                        <option value="1">Nível 1 (Iniciante)</option>
                                        <option value="2">Nível 2</option>
                                        <option value="3">Nível 3 (Avançado)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="mt-2 flex justify-end">
                            <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                        </div>
                    </form>
                )}
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="section-title mb-0 border-b-0">ARMAS</h2>
                <button className="btn btn-primary text-sm"
                    onClick={() => { setIsAddingWeapon(v => !v); setNewWeapon({ ...BLANK_WEAPON }); }}>
                    {isAddingWeapon ? 'X Cancelar' : '+ Inserir Nova Arma'}
                </button>
            </div>

            {/* Dashboard de Armas */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {(['Atirador', 'Caçador', 'Colecionador'] as TipoAcervo[]).map(acervo => {
                    const ws = weapons.filter(w => w.tipoAcervo === acervo);
                    const permitidas = ws.filter(w => getClassificacaoCalibre(w.calibre, w.tipo, w.modelo, w.tipoFuncionamento) === 'Permitido').length;
                    const restritas = ws.filter(w => getClassificacaoCalibre(w.calibre, w.tipo, w.modelo, w.tipoFuncionamento) === 'Restrito').length;
                    const limit = getWeaponLimits(acervo, user.nivelAtirador);

                    if (ws.length === 0 && !user.atividadesCR.includes(acervo === 'Atirador' ? 'Atirador Desportivo' : acervo)) return null;

                    return (
                        <div key={acervo} className="glass-panel border-accent-primary border-opacity-30 text-center flex flex-col justify-center items-center"
                            style={{ padding: '0.75rem 1.25rem', minWidth: '160px', maxWidth: '200px' }}>
                            <h4 className="font-bold text-accent-primary uppercase" style={{ fontSize: '0.85rem', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>{acervo}</h4>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div className="flex flex-col items-center">
                                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', lineHeight: 1 }}>{permitidas}</span>
                                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>Permitidas<br />(Máx: {limit.permitido === 999 ? '∞' : limit.permitido})</span>
                                </div>
                                <div className="border-r border-color-light" style={{ height: '2.5rem' }}></div>
                                <div className="flex flex-col items-center">
                                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', lineHeight: 1 }}>{restritas}</span>
                                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>Restritas<br />(Máx: {limit.restrito === 999 ? '∞' : limit.restrito})</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Form nova arma */}
            {isAddingWeapon && (
                <div className="glass-panel p-5 mb-6 animate-fade-in border-accent-primary">
                    <h3 className="font-bold text-lg mb-2">Cadastro de Nova Arma</h3>
                    <WeaponForm
                        data={newWeapon}
                        onChange={handleNewWeaponChange}
                        onSubmit={handleAddWeapon}
                        submitLabel="Salvar Nova Arma"
                        onCancel={() => { setIsAddingWeapon(false); setNewWeapon({ ...BLANK_WEAPON }); }}
                        formId="new"
                    />
                </div>
            )}

            {/* Weapon list */}
            <div className="flex flex-col gap-4">
                {weapons.length === 0 && (
                    <p className="text-muted text-center py-8">Nenhuma arma cadastrada. Clique em "+ Inserir Nova Arma".</p>
                )}
                {weapons.map(arma => {
                    const isExpanded = expandedWeaponId === arma.id;
                    const armaGuides = guides.filter(g => g.weaponId === arma.id);
                    const crafAlert = isExpiringSoon(arma.vencimentoCRAF, 60);
                    const isEditing = editingWeaponId === arma.id;
                    const isAddingGuide = addingGuideForWeapon === arma.id;
                    const classsificacao = getClassificacaoCalibre(arma.calibre, arma.tipo, arma.modelo, arma.tipoFuncionamento);

                    return (
                        <div key={arma.id} className={`glass-panel overflow-hidden transition-all duration-300 ${isExpanded ? 'border-accent-primary' : ''}`}>
                            {/* Header */}
                            <div className={`p-4 cursor-pointer flex justify-between items-center flex-wrap gap-4 ${isExpanded ? 'bg-black bg-opacity-20' : ''}`}
                                onClick={() => { setExpandedWeaponId(prev => prev === arma.id ? null : arma.id); setEditingWeaponId(null); setAddingGuideForWeapon(null); }}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div
                                        className="rounded overflow-hidden flex-shrink-0 flex items-center w-[100px] h-[100px] justify-center bg-white border border-color-light"
                                        style={{ width: '100px', height: '100px', minWidth: '100px', minHeight: '100px', padding: '2px' }}
                                    >
                                        <img src={getWeaponImage(arma.tipo, arma.modelo, arma.tipoFuncionamento)} alt="Arma"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg leading-tight flex items-center gap-2 flex-wrap">
                                            {arma.tipo} — {arma.fabricante} {arma.modelo} ({arma.calibre})
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${classsificacao === 'Permitido' ? 'border-success text-success' : 'border-danger text-danger'}`}>
                                                USO {classsificacao.toUpperCase()}
                                            </span>
                                        </h4>
                                        <p className="text-sm text-muted">ACERVO: {arma.tipoAcervo} | {arma.registroSistema}: {arma.numeroSigma || arma.numeroSinarm}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${crafAlert ? 'badge-danger' : 'badge-success'}`}>
                                        CRAF: {formatDateBR(arma.vencimentoCRAF)} {crafAlert ? '(Vence Logo!)' : ''}
                                    </span>
                                    <span className="text-muted text-lg">{isExpanded ? '▼' : '▶'}</span>
                                </div>
                            </div>

                            {/* Expanded section */}
                            {isExpanded && (
                                <div className="border-t border-color-light animate-fade-in">
                                    {/* Guias de Tráfego */}
                                    <div className="p-4 border-b border-color-light bg-black bg-opacity-10">
                                        <div className="flex justify-between items-center mb-3">
                                            <h5 className="font-bold text-accent-primary">Guias de Tráfego</h5>
                                            <button className="btn btn-secondary text-xs"
                                                onClick={e => { e.stopPropagation(); setAddingGuideForWeapon(isAddingGuide ? null : arma.id); setEditingWeaponId(null); }}>
                                                {isAddingGuide ? 'Cancelar' : '+ Adicionar Guia de Tráfego'}
                                            </button>
                                        </div>

                                        {isAddingGuide && (
                                            <form onSubmit={handleSaveGuide} className="mb-4 p-4 bg-black bg-opacity-30 border border-accent-primary rounded-md animate-fade-in" onClick={e => e.stopPropagation()}>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="text-sm font-bold block mb-1">Tipo de Guia *</label>
                                                        <select required value={newGuide.tipoGuia} onChange={e => { setNewGuide(p => ({ ...p, tipoGuia: e.target.value as TipoGuia, destino: '' })); setGuiaEstado(''); setGuiaCidade(''); }}>
                                                            {TIPOS_GUIA.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold block mb-1">Vencimento *</label>
                                                        <input type="date" required value={newGuide.vencimentoGT} onChange={e => setNewGuide(p => ({ ...p, vencimentoGT: e.target.value }))} />
                                                    </div>
                                                    {isCacaGuia(newGuide.tipoGuia) ? (
                                                        <>
                                                            <div>
                                                                <label className="text-sm font-bold block mb-1">Estado (UF) *</label>
                                                                <select required value={guiaEstado} onChange={e => setGuiaEstado(e.target.value)}>
                                                                    <option value="" disabled>Selecione o Estado</option>
                                                                    {guiaEstados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome} ({est.sigla})</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-bold block mb-1">Município (Destino) *</label>
                                                                <select required value={guiaCidade} onChange={e => setGuiaCidade(e.target.value)} disabled={!guiaEstado || guiaMunicipios.length === 0}>
                                                                    <option value="" disabled>{guiaEstado ? 'Selecione o Município' : 'Selecione o Estado primeiro'}</option>
                                                                    {guiaMunicipios.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
                                                                </select>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="md:col-span-2">
                                                            <label className="text-sm font-bold block mb-1">Destino *</label>
                                                            <input type="text" required placeholder="Ex: Clube de Tiro São Paulo - SP" value={newGuide.destino} onChange={e => setNewGuide(p => ({ ...p, destino: e.target.value }))} />
                                                        </div>
                                                    )}
                                                    <div className="md:col-span-4">
                                                        <label className="text-sm font-bold block mb-1">Observações</label>
                                                        <input type="text" placeholder="Opcional" value={newGuide.observacoes} onChange={e => setNewGuide(p => ({ ...p, observacoes: e.target.value }))} />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 mt-3">
                                                    <button type="submit" className="btn btn-primary flex-1">Salvar Guia</button>
                                                    <button type="button" className="btn btn-secondary" onClick={e => { e.stopPropagation(); setAddingGuideForWeapon(null); }}>Cancelar</button>
                                                </div>
                                            </form>
                                        )}

                                        {armaGuides.length === 0 && !isAddingGuide ? (
                                            <p className="text-muted text-sm">Nenhuma guia registrada para esta arma.</p>
                                        ) : (
                                            <div className="flex flex-col gap-2 mt-4">
                                                {armaGuides.map((gt, index) => {
                                                    const gtAlert = isExpiringSoon(gt.vencimentoGT, 30);
                                                    return (
                                                        <div key={gt.id} className="pt-2">
                                                            <div className={`p-4 ${gtAlert ? 'border-danger border-2 rounded bg-black bg-opacity-20' : ''}`}>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <strong className="text-lg text-accent-primary">Tipo de Guia: {gt.tipoGuia}</strong>
                                                                    <button className="btn btn-secondary text-xs text-danger hover:bg-danger hover:text-white border-transparent bg-black bg-opacity-30"
                                                                        onClick={e => { e.stopPropagation(); setConfirmDeleteGuide(gt.id); }}>
                                                                        Excluir Guia
                                                                    </button>
                                                                </div>
                                                                <div className="flex flex-col gap-1 text-sm text-gray-300">
                                                                    <p><strong className="text-muted">Vencimento:</strong> <span className={`${gtAlert ? 'text-danger font-bold' : 'text-success font-bold'}`}>{formatDateBR(gt.vencimentoGT)} {gtAlert && '(Próximo do Vencimento)'}</span></p>
                                                                    <p><strong className="text-muted">Local:</strong> {gt.destino}</p>
                                                                    {gt.observacoes && <p><strong className="text-muted">Observações:</strong> {gt.observacoes}</p>}
                                                                </div>
                                                            </div>
                                                            {index !== armaGuides.length - 1 && (
                                                                <hr className="my-5 border-t-4 border-gray-600 mx-1 rounded-full" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Ações da arma */}
                                    <div className="p-4 bg-black bg-opacity-20">
                                        <div className="flex justify-end gap-2 mb-3">
                                            <button className="btn btn-secondary text-sm"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    if (isEditing) { setEditingWeaponId(null); }
                                                    else { setEditingWeaponId(arma.id); setEditWeapon({ ...arma }); setAddingGuideForWeapon(null); }
                                                }}>
                                                {isEditing ? 'Cancelar Edição' : 'Editar Arma'}
                                            </button>
                                            <button className="btn btn-secondary text-sm text-danger border-danger"
                                                onClick={e => { e.stopPropagation(); setConfirmDeleteWeapon(arma.id); }}>
                                                Excluir Arma
                                            </button>
                                        </div>

                                        {isEditing && (
                                            <WeaponForm
                                                data={editWeapon}
                                                onChange={handleEditWeaponChange}
                                                onSubmit={handleSaveEditWeapon}
                                                submitLabel="Salvar Alterações"
                                                onCancel={() => { setEditingWeaponId(null); }}
                                                formId={`edit-${arma.id}`}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div >
        </div >
    );
};
