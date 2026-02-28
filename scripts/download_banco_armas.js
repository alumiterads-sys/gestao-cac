import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Banco de dados manual das principais armas no Brasil com links diretos válidos
const armas = [
    { fabricante: 'Taurus', modelo: 'G2C', calibre: '9mm', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Glock_26.jpg' },
    { fabricante: 'Taurus', modelo: 'PT92', calibre: '9mm', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Taurus_PT92_AF.jpg' },
    { fabricante: 'Taurus', modelo: 'T4', calibre: '5.56', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/AR15_A3_M4_style.jpg' },
    { fabricante: 'Taurus', modelo: 'RT85S', calibre: '.38 SPL', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Taurus_Model_85.jpg' },
    { fabricante: 'Taurus', modelo: 'RT627', calibre: '.357 Mag', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/S%26W_Model_686_-_M%26P.jpg' },
    { fabricante: 'Glock', modelo: 'G19', calibre: '9mm', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Glock_19_9x19mm.jpg' },
    { fabricante: 'Glock', modelo: 'G17', calibre: '9mm', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Glock_17_-_3.jpg' },
    { fabricante: 'Glock', modelo: 'G25', calibre: '.380 ACP', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Glock_25.JPG' },
    { fabricante: 'CBC', modelo: 'Pump Military 3.0', calibre: '12 GA', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Mossberg_500_Pump-Action-Shotgun.jpg' },
    { fabricante: 'Rossi', modelo: '811', calibre: '.38 SPL', arquivo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/RossiModel971.jpg' }
];

const destDir = path.join(__dirname, '../public/banco_armas');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.writeFileSync(path.join(destDir, 'manifest.json'), JSON.stringify(armas, null, 2));
console.log('Manifesto salvo com links diretos!');
