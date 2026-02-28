/**
 * SCRIPT DE LIMPEZA DE DADOS PESSOAIS
 * Apaga todos os dados de: clientes, servicos, crafs, guias, simaf, ibama
 * Mantém: tabela_precos (tabela financeira sem dados pessoais)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://azwnzvnsvqkrmfsqwkkn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6d256dm5zdnFrcm1mc3F3a2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTgyMTksImV4cCI6MjA4NzI5NDIxOX0.rDsM-tUl53pmtft5X11_-x0YrdBUXtJieBPt1Re-VjY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deleteAllFrom(tableName) {
    console.log(`\n🗑️  Deletando tabela: ${tableName}...`);

    // Busca todos os IDs primeiro
    const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('id');

    if (fetchError) {
        console.error(`   ❌ Erro ao buscar dados de ${tableName}:`, fetchError.message);
        return 0;
    }

    if (!data || data.length === 0) {
        console.log(`   ✅ Tabela ${tableName} já está vazia.`);
        return 0;
    }

    console.log(`   📋 Encontrados ${data.length} registros.`);

    // Deleta em lotes de 100
    let deleted = 0;
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize).map(r => r.id);
        const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .in('id', batch);

        if (deleteError) {
            console.error(`   ❌ Erro ao deletar lote de ${tableName}:`, deleteError.message);
        } else {
            deleted += batch.length;
            console.log(`   ✅ Deletados ${deleted}/${data.length} registros de ${tableName}...`);
        }
    }

    return deleted;
}

async function main() {
    console.log('=======================================================');
    console.log('  LIMPEZA DE DADOS PESSOAIS - GESTÃO CAC SUPABASE');
    console.log('=======================================================');
    console.log('⚠️  Esta operação é IRREVERSÍVEL.');
    console.log('   Tabelas que serão limpas:');
    console.log('   - ibama (dados IBAMA dos clientes)');
    console.log('   - guias (guias de tráfego)');
    console.log('   - crafs (armas registradas)');
    console.log('   - simaf (registros SIMAF)');
    console.log('   - servicos (histórico de serviços)');
    console.log('   - clientes (dados pessoais: nome, CPF, senha GOV etc.)');
    console.log('');
    console.log('   Tabelas que NÃO serão afetadas:');
    console.log('   - tabela_precos (mantida)');
    console.log('=======================================================\n');

    // Ordem importa: primeiro as tabelas filhas (FK) depois as pai
    const tabelas = ['ibama', 'guias', 'crafs', 'simaf', 'servicos', 'clientes'];

    let totalDeleted = 0;
    for (const tabela of tabelas) {
        const count = await deleteAllFrom(tabela);
        totalDeleted += count;
    }

    console.log('\n=======================================================');
    console.log(`  ✅ LIMPEZA CONCLUÍDA! Total de ${totalDeleted} registros removidos.`);
    console.log('   O banco de dados está limpo e zerado.');
    console.log('=======================================================');
}

main().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
