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
  role: 'admin' | 'user'; // admin = despachante, user = CAC
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
  role: 'admin' | 'user';
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
  observacoes?: string;
  n_protocolo?: string;
  created_at?: string;
}
