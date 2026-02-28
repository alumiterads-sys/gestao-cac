const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create the users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            cpf TEXT UNIQUE NOT NULL,
            telefone TEXT NOT NULL,
            senhaHash TEXT NOT NULL,
            senhaGovBr TEXT,
            numeroCR TEXT,
            vencimentoCR TEXT,
            atividadesCR TEXT,
            email TEXT,
            clubeFiliado TEXT,
            nivelAtirador TEXT,
            observacoesGlobais TEXT
        )`, (err) => {
            if (err) console.error('Error creating users table', err.message);
            else {
                console.log('Users table ready.');
                db.run('ALTER TABLE users ADD COLUMN nivelAtirador TEXT', () => { });
            }
        });

        // Create the weapons table
        db.run(`CREATE TABLE IF NOT EXISTS weapons (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            tipo TEXT NOT NULL,
            fabricante TEXT NOT NULL,
            modelo TEXT NOT NULL,
            calibre TEXT NOT NULL,
            numeroSerie TEXT NOT NULL,
            registroSistema TEXT NOT NULL,
            numeroSigma TEXT,
            numeroSinarm TEXT,
            tipoFuncionamento TEXT,
            vencimentoCRAF TEXT NOT NULL,
            tipoAcervo TEXT NOT NULL,
            imageUrl TEXT,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error('Error creating weapons table', err.message);
            else {
                console.log('Weapons table ready.');
                // Add column to existing tables silently if it doesn't exist
                db.run('ALTER TABLE weapons ADD COLUMN tipoFuncionamento TEXT', () => { });
            }
        });

        // Create the traffic guides table
        db.run(`CREATE TABLE IF NOT EXISTS traffic_guides (
            id TEXT PRIMARY KEY,
            weaponId TEXT NOT NULL,
            tipoGuia TEXT NOT NULL,
            vencimentoGT TEXT NOT NULL,
            destino TEXT NOT NULL,
            observacoes TEXT,
            FOREIGN KEY (weaponId) REFERENCES weapons(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error('Error creating traffic_guides table', err.message);
            else console.log('Traffic guides table ready.');
        });

        // Create the ibama docs table
        db.run(`CREATE TABLE IF NOT EXISTS ibama_docs (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            numeroCRIbama TEXT NOT NULL,
            vencimentoCR TEXT NOT NULL,
            propriedades TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error('Error creating ibama_docs table', err.message);
            else console.log('Ibama docs table ready.');
        });
    }
});

module.exports = db;
