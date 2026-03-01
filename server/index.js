const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// 1. Get all users (for debugging)
app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// 2. Register user
app.post('/api/register', (req, res) => {
    const { profile, senhaHash } = req.body;

    if (!profile || !profile.cpf) {
        return res.status(400).json({ error: "Invalid profile data" });
    }

    const {
        id, nome, cpf, telefone, senhaGovBr,
        numeroCR, vencimentoCR, atividadesCR,
        email, clubeFiliado, observacoesGlobais
    } = profile;

    // Convert array to string for SQLite storage
    const atividadesString = atividadesCR ? JSON.stringify(atividadesCR) : '[]';

    const sql = `INSERT INTO users (
        id, nome, cpf, telefone, senhaHash, senhaGovBr, 
        numeroCR, vencimentoCR, atividadesCR, 
        email, clubeFiliado, observacoesGlobais
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        id, nome, cpf, telefone, senhaHash, senhaGovBr,
        numeroCR, vencimentoCR, atividadesString,
        email, clubeFiliado, '', observacoesGlobais
    ];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: "CPF já cadastrado" });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            message: "User registered successfully",
            id: this.lastID
        });
    });
});

// 3. Update user profile
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const profile = req.body;

    if (!profile) return res.status(400).json({ error: "Missing body" });

    const {
        nome, cpf, telefone, senhaGovBr,
        numeroCR, vencimentoCR, atividadesCR,
        email, clubeFiliado, nivelAtirador, observacoesGlobais
    } = profile;

    const atividadesString = atividadesCR ? JSON.stringify(atividadesCR) : '[]';

    const sql = `UPDATE users SET 
        nome = ?, cpf = ?, telefone = ?, senhaGovBr = ?, 
        numeroCR = ?, vencimentoCR = ?, atividadesCR = ?, 
        email = ?, clubeFiliado = ?, nivelAtirador = ?, observacoesGlobais = ?
        WHERE id = ?`;

    const params = [
        nome, cpf, telefone, senhaGovBr,
        numeroCR, vencimentoCR, atividadesString,
        email, clubeFiliado, nivelAtirador || '', observacoesGlobais,
        id
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User updated successfully" });
    });
});

// 4. Login user
app.post('/api/login', (req, res) => {
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
        return res.status(400).json({ error: "CPF and password are required" });
    }

    const sql = "SELECT * FROM users WHERE cpf = ?";
    db.get(sql, [cpf], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: "CPF NÃO CADASTRADO", code: "NOT_FOUND" });
        }

        if (row.senhaHash !== senha) {
            return res.status(401).json({ error: "Senha incorreta", code: "WRONG_PASSWORD" });
        }

        // Reconstruct user profile
        let atividadesCR = [];
        try {
            atividadesCR = JSON.parse(row.atividadesCR);
        } catch (e) {
            // ignore
        }

        const profile = {
            id: row.id,
            nome: row.nome,
            cpf: row.cpf,
            telefone: row.telefone,
            senhaGovBr: row.senhaGovBr || '',
            numeroCR: row.numeroCR || '',
            vencimentoCR: row.vencimentoCR || '',
            atividadesCR: atividadesCR,
            email: row.email || '',
            clubeFiliado: row.clubeFiliado || '',
            nivelAtirador: row.nivelAtirador || '',
            observacoesGlobais: row.observacoesGlobais || ''
        };

        res.json({
            message: "Login successful",
            profile: profile
        });
    });
});

// 4. Update Password (Recovery)
app.post('/api/recover-password', (req, res) => {
    const { cpf, novaSenha } = req.body;

    if (!cpf || !novaSenha) {
        return res.status(400).json({ error: "CPF and new password are required" });
    }

    const sql = "UPDATE users SET senhaHash = ? WHERE cpf = ?";
    db.run(sql, [novaSenha, cpf], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: "CPF não encontrado" });
        }

        res.json({ message: "Password updated successfully" });
    });
});

// ==========================================
// WEAPONS ROUTES
// ==========================================

// Get all weapons for a user
app.get('/api/weapons/:userId', (req, res) => {
    const { userId } = req.params;
    db.all("SELECT * FROM weapons WHERE userId = ?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Add a weapon
app.post('/api/weapons', (req, res) => {
    const { id, userId, tipo, fabricante, modelo, calibre, numeroSerie, registroSistema, numeroSigma, numeroSinarm, tipoFuncionamento, vencimentoCRAF, tipoAcervo, imageUrl } = req.body;
    const sql = `INSERT INTO weapons(id, userId, tipo, fabricante, modelo, calibre, numeroSerie, registroSistema, numeroSigma, numeroSinarm, tipoFuncionamento, vencimentoCRAF, tipoAcervo, imageUrl)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [id, userId, tipo, fabricante, modelo, calibre, numeroSerie, registroSistema, numeroSigma || '', numeroSinarm || '', tipoFuncionamento || '', vencimentoCRAF, tipoAcervo, imageUrl || ''];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Weapon added successfully" });
    });
});

// Update a weapon
app.put('/api/weapons/:id', (req, res) => {
    const { id } = req.params;
    const { tipo, fabricante, modelo, calibre, numeroSerie, registroSistema, numeroSigma, numeroSinarm, tipoFuncionamento, vencimentoCRAF, tipoAcervo, imageUrl } = req.body;
    const sql = `UPDATE weapons SET tipo =?, fabricante =?, modelo =?, calibre =?, numeroSerie =?, registroSistema =?, numeroSigma =?, numeroSinarm =?, tipoFuncionamento =?, vencimentoCRAF =?, tipoAcervo =?, imageUrl =? WHERE id =? `;
    const params = [tipo, fabricante, modelo, calibre, numeroSerie, registroSistema, numeroSigma || '', numeroSinarm || '', tipoFuncionamento || '', vencimentoCRAF, tipoAcervo, imageUrl || '', id];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Weapon updated successfully" });
    });
});

// Delete a weapon
app.delete('/api/weapons/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM weapons WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Weapon deleted successfully" });
    });
});

// ==========================================
// TRAFFIC GUIDES ROUTES
// ==========================================

// Get all guides for a user
app.get('/api/guides/:userId', (req, res) => {
    const { userId } = req.params;
    // Join with weapons to only get guides for weapons owned by this user
    const sql = `
        SELECT g.* FROM traffic_guides g
        JOIN weapons w ON g.weaponId = w.id
        WHERE w.userId = ?
        `;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Add a guide
app.post('/api/guides', (req, res) => {
    const { id, weaponId, tipoGuia, vencimentoGT, destino, observacoes } = req.body;
    const sql = `INSERT INTO traffic_guides(id, weaponId, tipoGuia, vencimentoGT, destino, observacoes)
    VALUES(?, ?, ?, ?, ?, ?)`;
    const params = [id, weaponId, tipoGuia, vencimentoGT, destino, observacoes || ''];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Guide added successfully" });
    });
});

// Delete a guide
app.delete('/api/guides/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM traffic_guides WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Guide deleted successfully" });
    });
});

// ==========================================
// IBAMA DOCS ROUTES
// ==========================================

// Get ibama doc for a user
app.get('/api/ibama/:userId', (req, res) => {
    const { userId } = req.params;
    db.get("SELECT * FROM ibama_docs WHERE userId = ?", [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.json({ data: null });

        let propriedades = [];
        try {
            propriedades = JSON.parse(row.propriedades);
        } catch (e) { }

        row.propriedades = propriedades;
        res.json({ data: row });
    });
});

// Save or Update ibama doc
app.post('/api/ibama', (req, res) => {
    const { id, userId, numeroCRIbama, vencimentoCR, propriedades } = req.body;
    const propString = JSON.stringify(propriedades || []);

    // UPSERT manually using ON CONFLICT (id is primary key, but userId should be unique ideally. We use id.)
    // Let's use INSERT OR REPLACE
    const sql = `INSERT OR REPLACE INTO ibama_docs(id, userId, numeroCRIbama, vencimentoCR, propriedades)
    VALUES(?, ?, ?, ?, ?)`;
    const params = [id, userId, numeroCRIbama, vencimentoCR, propString];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Ibama doc saved successfully" });
    });
});

// Start Server
// ==========================================
// DISPATCHER <-> CAC CONNECTIONS ROUTES
// ==========================================

// Search user by CPF
app.get('/api/users/search/:cpf', (req, res) => {
    const { cpf } = req.params;
    const cleanCpf = cpf.replace(/\D/g, '');
    db.get("SELECT id, nome, cpf, role FROM users WHERE cpf = ?", [cleanCpf], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "User not found" });
        res.json({ data: row });
    });
});

// Create an invite
app.post('/api/connections/invite', (req, res) => {
    const { id, dispatcherId, cacId, initiatedBy } = req.body;

    // Check if an active or pending connection already exists
    const checkSql = "SELECT * FROM dispatcher_clients WHERE dispatcherId = ? AND cacId = ?";
    db.get(checkSql, [dispatcherId, cacId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            return res.status(409).json({ error: "Connection already exists or is pending", status: row.status });
        }

        const status = initiatedBy === 'admin' ? 'pending_cac' : 'pending_dispatcher';
        const createdAt = new Date().toISOString();

        const sql = `INSERT INTO dispatcher_clients (id, dispatcherId, cacId, status, createdAt) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [id, dispatcherId, cacId, status, createdAt], function (insertErr) {
            if (insertErr) return res.status(500).json({ error: insertErr.message });
            res.status(201).json({ message: "Invite sent successfully" });
        });
    });
});

// Accept an invite
app.put('/api/connections/:id/accept', (req, res) => {
    const { id } = req.params;
    db.run("UPDATE dispatcher_clients SET status = 'active' WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Connection not found" });
        res.json({ message: "Connection accepted" });
    });
});

// Delete a connection / Reject invite
app.delete('/api/connections/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM dispatcher_clients WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Connection removed successfully" });
    });
});

// Get all connection for a Dispatcher
app.get('/api/connections/dispatcher/:dispatcherId', (req, res) => {
    const { dispatcherId } = req.params;
    const sql = `
        SELECT dc.*, u.nome as cacNome, u.cpf as cacCpf 
        FROM dispatcher_clients dc
        JOIN users u ON dc.cacId = u.id
        WHERE dc.dispatcherId = ?
    `;
    db.all(sql, [dispatcherId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Get all connections for a CAC
app.get('/api/connections/cac/:cacId', (req, res) => {
    const { cacId } = req.params;
    const sql = `
        SELECT dc.*, u.nome as dispatcherNome, u.cpf as dispatcherCpf 
        FROM dispatcher_clients dc
        JOIN users u ON dc.dispatcherId = u.id
        WHERE dc.cacId = ?
    `;
    db.all(sql, [cacId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
