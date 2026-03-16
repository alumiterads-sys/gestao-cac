export interface UserProfile {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string;
  senhaGovBr: string;
  numeroCR: string;
  atividadesCR: string[];
  vencimentoCR: string; // ISO date YYYY-MM-DD
  clubeFiliado: string;
  nivelAtirador?: '1' | '2' | '3';
  observacoesGlobais: string;
  role: 'admin' | 'user' | 'superadmin'; // admin = despachante, user = CAC, superadmin = gestor app
  ativo?: boolean;
  despachante_id?: string | null;
  gratuidade?: boolean;
}

export type TipoArma = 'Carabina/Fuzil' | 'Revólver' | 'Pistola' | 'Pistolete' | 'Espingarda';
export type Calibre = '.22 LR' | '.357 Mag' | '9mm' | '.308 Win' | '.40 S&W' | '.45 ACP' | '.38 SPL' | '.380 ACP' | '12 GA' | '5.56' | '7.62';
export type TipoAcervo = 'Atirador' | 'Caçador' | 'Colecionador';

export interface Weapon {
  id: string;
  userId: string;
  tipo: TipoArma;
  fabricante: string;
  modelo: string;
  calibre: Calibre;
  numeroSerie: string;
  registroSistema: 'SIGMA' | 'SINARM';
  numeroSigma?: string;
  numeroSinarm?: string;
  tipoFuncionamento: 'Repetição' | 'Semi-Auto';
  vencimentoCRAF: string; // YYYY-MM-DD
  tipoAcervo: TipoAcervo;
  imageUrl?: string;
}

export type TipoGuia = 'Caça' | 'Caça Treino' | 'Caça Manutenção' | 'Tiro Desportivo' | 'Tiro Desportivo Manutenção';

export interface TrafficGuide {
  id: string;
  userId?: string; // cliente_id no Supabase
  weaponId: string;
  armaNome?: string; // arma_nome no Supabase
  tipoGuia: TipoGuia;
  vencimentoGT: string; // YYYY-MM-DD
  destino: string;
  observacoes: string;
}

export interface IbamaProperty {
  id: string;
  proprietario: string;
  nomeFazenda: string;
  numeroCAR: string;
  estado?: string;
  municipio: string;
  vencimentoManejo: string; // YYYY-MM-DD
}

export interface IbamaDoc {
  id: string;
  userId: string;
  numeroCRIbama: string;
  vencimentoCR: string; // YYYY-MM-DD
  propriedades: IbamaProperty[];
}

// ─── Conexões Despachante x CAC ──────────────────────────────

export type ConnectionStatus = 'pending_dispatcher' | 'pending_cac' | 'active';

export interface DispatcherConnection {
  id: string;
  dispatcherId: string;
  cacId: string;
  status: ConnectionStatus;
  createdAt: string;
  // Campos populados pelos JOINs na API:
  dispatcherNome?: string;
  dispatcherCpf?: string;
  cacNome?: string;
  cacCpf?: string;
}

// ─── Tipos do Painel Admin (Despachante) ─────────────────────

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  contato: string;
  senha_gov?: string;
  cr?: string;
  cr_expiry?: string;
  filiado: boolean;
  atividades_cr?: string;
  clube_filiado?: string;
  role: 'admin' | 'user' | 'superadmin';
  ativo?: boolean;
  despachante_id?: string | null;
  gratuidade?: boolean;
  created_at?: string;
}

export interface Servico {
  id: string;
  cliente_id: string;
  data: string;
  status: string;
  servico_executado?: string;
  tipo_servico?: string;
  gru_paga: boolean;
  filiado_pro_tiro: boolean;
  valor?: number;
  pago_ou_pendente: string;
  forma_pagamento?: string;
  Observacoes?: string;
  n_protocolo?: string;
  created_at?: string;
}

export interface ClienteAvulso {
  id: string;
  dispatcher_id: string;
  nome: string;
  cpf: string;
  telefone: string;
  senha_gov_br?: string;
  created_at: string;
}

export interface AvulsoCraf {
  id: string;
  avulso_id: string;
  tipo?: string;
  fabricante?: string;
  modelo_arma?: string;
  calibre?: string;
  n_serie?: string;
  n_sigma?: string;
  tipo_funcionamento?: string;
  vencimento_craf?: string;
  acervo?: string;
  created_at?: string;
}

export interface AvulsoGuia {
  id: string;
  avulso_id: string;
  n_guia?: string;
  data_emissao?: string;
  vencimento_gt?: string;
  origem?: string;
  destino?: string;
  created_at?: string;
}

export interface AvulsoSimaf {
  id: string;
  avulso_id: string;
  cr_ibama?: string;
  venc_cr_ibama?: string;
  created_at?: string;
}

export interface ServicoPreco {
  id: string;
  dispatcher_id: string;
  nome_servico: string;
  descricao?: string;
  preco: number;
  prazo_estimado_dias?: number;
  created_at: string;
}

export interface OrdemServico {
  id: string;
  dispatcher_id: string;
  cac_id?: string;
  cliente_avulso_id?: string;
  servico_id?: string;
  servico_nome: string;
  status: 'aberta' | 'em_andamento' | 'aguardando_cliente' | 'concluida' | 'cancelada';
  valor_cobrado: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;

  // Nomes adicionais carregados via JOIN (se precisarmos)
  cac_nome?: string;
}

// ─── Tipos Financeiros (B2B2C) ─────────────────────

export interface ConfiguracoesGlobais {
  id: string;
  taxa_setup_despachante: number;
  mensalidade_despachante: number;
  plano_cac_semestral: number;
  plano_cac_anual: number;
  meta_cac_desconto: number;
  percentual_desconto_meta: number;
  updated_at?: string;
}

export type TipoPlano = 'despachante_base' | 'cac_semestral' | 'cac_anual';
export type StatusAssinatura = 'ativa' | 'pendente_pagamento' | 'cancelada' | 'atrasada' | 'trial';

export interface Assinatura {
  id: string;
  cliente_id: string;
  tipo_plano: TipoPlano;
  status: StatusAssinatura;
  data_inicio: string;
  data_vencimento: string;
  valor_recorrente: number;
  created_at?: string;
  updated_at?: string;
}

export type StatusFatura = 'aberta' | 'paga' | 'vencida' | 'cancelada';

export interface Fatura {
  id: string;
  assinatura_id?: string;
  cliente_id: string;
  valor_total: number;
  descricao: string;
  status: StatusFatura;
  data_emissao?: string;
  data_vencimento: string;
  data_pagamento?: string;
  gateway_id?: string;
  link_pagamento?: string;
  created_at?: string;
  updated_at?: string;
}
