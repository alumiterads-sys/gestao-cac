// =============================================
// G-CAC - GESTÃO DE DADOS CAC
// Data Structures (dados pessoais removidos)
// =============================================

// --- 1. CLIENTES ---
export const clients = [];

// --- 2. SERVIÇOS ---
export const servicos = [];

// --- 3. $ FILIADO (Tabela de Preços) ---
export const tabelaFiliado = [
    { id: "tf1", servico: "Atualização de atividades", taxasGru: 50.0, valor: 300.0, observacoes: "" },
    { id: "tf2", servico: "Atualização de dados pessoais", taxasGru: 50.0, valor: 300.0, observacoes: "" },
    { id: "tf3", servico: "Atualização de endereço", taxasGru: 50.0, valor: 300.0, observacoes: "ATUALIZAÇÃO SEGUNDO ENDEREÇO" },
    { id: "tf4", servico: "Autorização de aquisição de Arma", taxasGru: 25.0, valor: 100.0, observacoes: "" },
    { id: "tf5", servico: "Cancelamento de CR", taxasGru: 50.0, valor: 300.0, observacoes: "" },
    { id: "tf6", servico: "Concessão CR para pessoa física (Atirador)", taxasGru: 100.0, valor: 550.0, observacoes: "+ R$700,00 Dos laudos. Fora a Filiação" },
    { id: "tf7", servico: "Concessão CR para pessoa física (Caça e Tiro)", taxasGru: 100.0, valor: 550.0, observacoes: "+ R$700,00 Dos laudos. Fora a Filiação" },
    { id: "tf8", servico: "Guia de Tráfego", taxasGru: 20.0, valor: 50.0, observacoes: "" },
    { id: "tf9", servico: "IBAMA- Emissão de CR", taxasGru: 0.0, valor: 10.0, observacoes: "" },
    { id: "tf10", servico: "IBAMA- Emissão de Autorização de Manejo", taxasGru: 0.0, valor: 10.0, observacoes: "" },
    { id: "tf11", servico: "IBAMA- Declaração de acesso à propriedade", taxasGru: 0.0, valor: 10.0, observacoes: "" },
    { id: "tf12", servico: "Inclusão de 2º endereço", taxasGru: 50.0, valor: 300.0, observacoes: "" },
    { id: "tf13", servico: "Renovação de CR", taxasGru: 50.0, valor: 550.0, observacoes: "+ R$700,00 Dos laudos." },
    { id: "tf14", servico: "Renovação de CRAF", taxasGru: 50.0, valor: 300.0, observacoes: "" },
    { id: "tf15", servico: "Transferência CAC x CAC", taxasGru: 50.0, valor: 300.0, observacoes: "" },
    { id: "tf16", servico: "Transferência entre Acervo", taxasGru: 50.0, valor: 300.0, observacoes: "" },
];

// --- 4. $ NÃO FILIADO (Tabela de Preços) ---
export const tabelaNaoFiliado = [
    { id: "tn1", servico: "Atualização de atividades", taxasGru: 50.0, valor: 350.0, observacoes: "" },
    { id: "tn2", servico: "Atualização de dados pessoais", taxasGru: 50.0, valor: 350.0, observacoes: "" },
    { id: "tn3", servico: "Atualização de endereço", taxasGru: 50.0, valor: 350.0, observacoes: "" },
    { id: "tn4", servico: "Autorização de aquisição de Arma", taxasGru: 25.0, valor: 250.0, observacoes: "" },
    { id: "tn5", servico: "Cancelamento de CR", taxasGru: 50.0, valor: 300.0, observacoes: "" },
    { id: "tn6", servico: "Concessão CR para pessoa física (Atirador)", taxasGru: 100.0, valor: 650.0, observacoes: "+ R$700,00 Dos laudos. Fora a Filiação" },
    { id: "tn7", servico: "Concessão CR para pessoa física (Caça e Tiro)", taxasGru: 100.0, valor: 650.0, observacoes: "+ R$700,00 Dos laudos. Fora a Filiação" },
    { id: "tn8", servico: "Guia de Tráfego", taxasGru: 20.0, valor: 80.0, observacoes: "" },
    { id: "tn9", servico: "IBAMA- Emissão de CR", taxasGru: 0.0, valor: 10.0, observacoes: "" },
    { id: "tn10", servico: "IBAMA- Emissão de Autorização de Manejo", taxasGru: 0.0, valor: 30.0, observacoes: "" },
    { id: "tn11", servico: "IBAMA- Declaração de acesso à propriedade", taxasGru: 0.0, valor: 15.0, observacoes: "" },
    { id: "tn12", servico: "Inclusão de 2º endereço", taxasGru: 50.0, valor: 350.0, observacoes: "" },
    { id: "tn13", servico: "Renovação de CR", taxasGru: 50.0, valor: 650.0, observacoes: "+ R$700,00 Dos laudos." },
    { id: "tn14", servico: "Renovação de CRAF", taxasGru: 50.0, valor: 350.0, observacoes: "" },
    { id: "tn15", servico: "Transferência CAC x CAC", taxasGru: 50.0, valor: 350.0, observacoes: "" },
    { id: "tn16", servico: "Transferência entre Acervo", taxasGru: 50.0, valor: 350.0, observacoes: "" },
];

// --- 5. HISTÓRICO DE SERVIÇOS ---
export const historicoServicos = [];

// --- 6. CRAFs ---
export const crafs = [];

// --- 7. GUIAS ---
export const guias = [];

// --- 8. SIMAF ---
export const simaf = [];

// --- ENUMS/CONSTANTES ---
export const STATUS_SERVICO = [
    "Não Iniciado",
    "Iniciado, Montando Processo",
    "Aguardando Aprovação",
    "Em Análise pela PF",
    "Concluído",
];

export const TIPOS_SERVICO = [
    "Autorização de Compra",
    "Transferência CAC x CAC",
    "Transferência entre Acervo",
    "Concessão de CR Atirador",
    "Concessão de CR Caça e Tiro",
    "Guia de Tráfego",
    "IBAMA- Autorização de Manejo",
    "IBAMA- Declaração de Acesso a Propriedade",
    "IBAMA- Emissão de CR",
    "Inclusão Segundo Endereço de Acervo",
    "Renovação de CR",
    "Renovação de CRAF",
    "Outros",
];

export const TIPOS_ARMA = ["Carabina / Fuzil", "Pistola", "Revólver", "Espingarda"];
export const CALIBRES = [".22LR", ".308WIN", ".357MAG", ".9MM", ".17HMR", ".380ACP", "12GA", ".40SW", ".45ACP"];
export const TIPOS_ACERVO = ["Tiro Desportivo", "Caça", "Defesa Pessoal", "Não Informado"];
export const TIPOS_GUIA = ["Caça", "Caça Treino", "Tiro Desportivo"];

// --- HELPER: Gerar alertas de vencimento ---
// Retorna vazio pois os dados agora vêm do Supabase
export const getAlertEvents = () => [];
