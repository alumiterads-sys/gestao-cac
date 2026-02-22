import type { UserProfile, Weapon, TrafficGuide, IbamaDoc } from './types';

// O ano atual no contexto é 2026. Vamos criar datas próximas para simular alertas de 90 dias.
// Hoje: 2026-02-19

export const mockUserProfile: UserProfile = {
    id: 'user-1',
    nome: 'João da Silva',
    cpf: '123.456.789-00',
    telefone: '(11) 98765-4321',
    senhaGovBr: '********',
    numeroCR: '987654321',
    atividadesCR: ['Atirador', 'Caçador', 'Colecionador'],
    vencimentoCR: '2026-03-15', // Vence em menos de 90 dias (Alerta)
    clubeFiliado: 'Clube de Tiro Exemplo',
    observacoesGlobais: 'Renovação do CR em andamento via despachante.'
};

export const mockWeapons: Weapon[] = [
    {
        id: 'wp-1',
        userId: 'user-1',
        tipo: 'Pistola',
        fabricante: 'Glock',
        modelo: 'G19',
        calibre: '9mm',
        numeroSerie: 'GLK12345',
        registroSistema: 'SIGMA',
        numeroSigma: 'SIG111222',
        vencimentoCRAF: '2026-04-10', // Vence em menos de 30 dias (Alerta)
        tipoAcervo: 'Atirador'
    },
    {
        id: 'wp-2',
        userId: 'user-1',
        tipo: 'Carabina/Fuzil',
        fabricante: 'Taurus',
        modelo: 'T4',
        calibre: '.308 Win',
        numeroSerie: 'T4567890',
        registroSistema: 'SIGMA',
        numeroSigma: 'SIG333444',
        vencimentoCRAF: '2028-12-01', // Seguro
        tipoAcervo: 'Caçador'
    }
];

export const mockTrafficGuides: TrafficGuide[] = [
    {
        id: 'gt-1',
        weaponId: 'wp-1',
        tipoGuia: 'Tiro Desportivo',
        vencimentoGT: '2026-05-05', // Vence em menos de 90 dias (Alerta)
        destino: 'Clube de Tiro Exemplo e competições regionais',
        observacoes: 'Guia válida apenas para o estado de SP.'
    },
    {
        id: 'gt-2',
        weaponId: 'wp-2',
        tipoGuia: 'Caça',
        vencimentoGT: '2027-02-20', // Seguro
        destino: 'Fazenda Boa Esperança, PR',
        observacoes: 'Autorização do proprietário em anexo.'
    }
];

export const mockIbamaDoc: IbamaDoc = {
    id: 'ib-1',
    userId: 'user-1',
    numeroCRIbama: '888777666',
    vencimentoCR: '2026-05-19', // Simula +3 meses do dia atual
    propriedades: [
        {
            id: 'prop-1',
            proprietario: 'João da Silva',
            nomeFazenda: 'Fazenda Santa Tereza',
            numeroCAR: 'CAR-MG-12345',
            municipio: 'Belo Horizonte',
            vencimentoManejo: '2026-02-28' // Vence em menos de 10 dias
        }
    ]
};
