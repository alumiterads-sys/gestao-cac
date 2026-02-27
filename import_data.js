import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DADOS_PESSOAIS_PATH = 'C:\\Users\\Benevides\\Desktop\\GCAC\\DADOS PESSOAIS.xlsx';
const SERVICOS_PATH = 'C:\\Users\\Benevides\\Desktop\\GCAC\\PLANILHA SERVIÇOS.xlsx';

function excelDateToJS(serial) {
    if (!serial || isNaN(serial)) return null;
    try {
        const jsDate = new Date((serial - 25569) * 86400 * 1000);
        if (isNaN(jsDate.getTime())) return null;
        return jsDate.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
}

async function importData() {
    console.log('--- Starting Import ---');

    // 1. IMPORT CLIENTES
    console.log('Importing Clientes...');
    const wbPessoais = XLSX.readFile(DADOS_PESSOAIS_PATH);
    const sheetPessoais = wbPessoais.Sheets['DADOS PESSOAIS'];
    const rawClientes = XLSX.utils.sheet_to_json(sheetPessoais);

    // Map of Name -> ID for linking
    const nameToId = {};

    for (const row of rawClientes) {
        const cpf = String(row['CPF'] || '').replace(/\D/g, '');
        if (!cpf) continue;

        const clienteData = {
            nome: row['NOME'],
            cpf: cpf,
            contato: row['FONE'],
            senha_gov: row['SENHA GOV'],
            cr: row['Nº CR'],
            cr_expiry: excelDateToJS(row['VENCIMENTO DO CR']),
            observacoes: row['OBSERVAÇÕES'],
            filiado: false // Default to false, will update if found in other logic
        };

        // Try to find if exists
        const { data: existing } = await supabase.from('clientes').select('id').eq('cpf', cpf).single();

        let clienteId;
        if (existing) {
            console.log(`Cliente ${clienteData.nome} already exists, updating.`);
            const { data } = await supabase.from('clientes').update(clienteData).eq('id', existing.id).select();
            clienteId = data[0].id;
        } else {
            console.log(`Inserting new Cliente: ${clienteData.nome}`);
            const { data, error } = await supabase.from('clientes').insert([clienteData]).select();
            if (error) {
                console.error('Error inserting cliente:', error);
                continue;
            }
            clienteId = data[0].id;
        }
        nameToId[clienteData.nome.trim().toUpperCase()] = clienteId;
    }

    // 2. IMPORT CRAFs
    console.log('Importing CRAFs...');
    const sheetArmas = wbPessoais.Sheets['DADOS ARMAS'];
    const rawArmas = XLSX.utils.sheet_to_json(sheetArmas);
    for (const row of rawArmas) {
        const nameKey = String(row['NOME'] || '').trim().toUpperCase();
        const cliente_id = nameToId[nameKey];
        if (!cliente_id) continue;

        const crafData = {
            cliente_id,
            modelo_arma: row['MODELO ARMA'],
            n_serie: row['Nº DE SÉRIE'],
            n_sigma: row['Nº SIGMA'],
            vencimento_craf: excelDateToJS(row['VENCIMENTO DO CRAF'])
        };
        await supabase.from('crafs').insert([crafData]);
    }

    // 3. IMPORT SERVIÇOS
    console.log('Importing Serviços...');
    const wbServicos = XLSX.readFile(SERVICOS_PATH);

    const importServicoSheet = async (sheetName) => {
        const sheet = wbServicos.Sheets[sheetName];
        if (!sheet) return;
        const raw = XLSX.utils.sheet_to_json(sheet);
        for (const row of raw) {
            const nameKey = String(row['NOME '] || row['NOME'] || '').trim().toUpperCase();
            const cliente_id = nameToId[nameKey];
            if (!cliente_id) continue;

            const servicoData = {
                cliente_id,
                data: excelDateToJS(row['DATA']),
                status: row['STATUS DO SERVIÇO'] || (sheetName === 'HISTÓRICO DE SERVIÇOS' ? 'Concluído' : 'Não Iniciado'),
                tipo_servico: row['SERVIÇOS'],
                gru_paga: row['GRU PAGA?'] === true || String(row['GRU PAGA?']).toUpperCase() === 'SIM',
                filiado_pro_tiro: row['FILIADO NO PRO TIRO?'] === true || String(row['FILIADO NO PRO TIRO?']).toUpperCase() === 'SIM',
                valor: parseFloat(row['VALOR']) || 0,
                pago_ou_pendente: row['PAGO OU PENDENTE'],
                forma_pagamento: row['FORMA DE PAGAMENTO'],
                observacoes: row['OBSERVAÇÕES']
            };
            await supabase.from('servicos').insert([servicoData]);

            // If filiado_pro_tiro is true, update the cliente filiado status
            if (servicoData.filiado_pro_tiro) {
                await supabase.from('clientes').update({ filiado: true }).eq('id', cliente_id);
            }
        }
    }

    await importServicoSheet('SERVIÇOS');
    await importServicoSheet('HISTÓRICO DE SERVIÇOS');

    // 4. IMPORT SIMAF (GUIAS IBAMA)
    console.log('Importing SIMAF...');
    const sheetSimaf = wbPessoais.Sheets['GUIAS IBAMA'];
    if (sheetSimaf) {
        const raw = XLSX.utils.sheet_to_json(sheetSimaf);
        for (const row of raw) {
            const nameKey = String(row['NOME'] || '').trim().toUpperCase();
            const cliente_id = nameToId[nameKey];
            if (!cliente_id) continue;

            const simafData = {
                cliente_id,
                fazenda: row['FAZENDA'],
                proprietario: row['PROPRIETÁRIO'],
                cidade: row['CIDADE'],
                n_car: row['Nº DO CAR'],
                data_vencimento: excelDateToJS(row['DATA DE VENCIMENTO']),
                observacoes: row['OBSERVAÇÕES']
            };
            await supabase.from('simaf').insert([simafData]);
        }
    }

    // 5. IMPORT GUIAS ARMAS
    console.log('Importing Guias...');
    const sheetGuias = wbPessoais.Sheets['GUIAS ARMAS'];
    if (sheetGuias) {
        const raw = XLSX.utils.sheet_to_json(sheetGuias);
        for (const row of raw) {
            const nameKey = String(row['NOME'] || '').trim().toUpperCase();
            const cliente_id = nameToId[nameKey];
            if (!cliente_id) continue;

            const guiasData = {
                cliente_id,
                arma_nome: 'Veja CRAF (Importado)', // The spreadsheet has 'ARMA' id which is hard to map without internal logic
                data_vencimento: excelDateToJS(row['DATA DE VENCIMENTO']),
                tipo_guia: row['TIPO DE GUIA'],
                destino: row['DESTINO']
            };
            await supabase.from('guias').insert([guiasData]);
        }
    }

    console.log('--- Import Finished ---');
}

importData();
