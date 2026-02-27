import XLSX from 'xlsx';

function inspectFile(filePath) {
    console.log(`\n--- Inspecting: ${filePath} ---`);
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet);
        console.log(`Sheet "${name}" has ${data.length} rows.`);
        if (data.length > 0) {
            console.log('Sample data (first row):', JSON.stringify(data[0], null, 2));
        }
    });
}

inspectFile('C:\\Users\\Benevides\\Desktop\\GCAC\\PLANILHA SERVIÇOS.xlsx');
inspectFile('C:\\Users\\Benevides\\Desktop\\GCAC\\DADOS PESSOAIS.xlsx');
