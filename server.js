const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

/*app.get('/', (req, res) => {
    return res.json("From Baaaa")
});*/

// User routes
app.get('/api/group_todo', (req, res) => {
    db.query('SELECT * FROM group_todo', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.get('/api/group_todo/:group_name/todos', (req, res) => {
    const { group_name } = req.params;
    const query = `
        SELECT * FROM todoitems
        WHERE group_id = ?
    `;
    db.query(query, [group_name], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.post('/api/group_todo', (req, res) => {
    const { group_name } = req.body;

    // Validation des champs
    if (!group_name) {
        return res.status(400).json({ error: 'Le champ group_name est obligatoire.' });
    }

    // Vérifier si le groupe existe déjà
    db.query('SELECT * FROM group_todo WHERE group_name = ?', [group_name], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'Le groupe existe déjà.' });
        }

        // Insérer le groupe
        db.query('INSERT INTO group_todo (group_name) VALUES (?)', [group_name], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            return res.json(results);
        });
    });
});

app.delete('/api/group_todo/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM group_todo WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.put('/api/group_todo/:id', (req, res) => {
    const { id } = req.params;
    const { group_name } = req.body;
    db.query('UPDATE group_todo SET group_name = ? WHERE id = ?', [group_name, id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
    
});

// Todo routes
app.get('/api/todos', (req, res) => {
    const query = `SELECT * FROM todoitems`;
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

//group_id est le nom du groupe
app.post('/api/todos', (req, res) => {
    const { title, group_id  } = req.body;

    // Validation des champs
    if (!title || !group_id) {
        return res.status(400).json({ error: 'Les champs title et group_id sont obligatoires.' });
    }

    // Vérifier si le groupe existe
    db.query('SELECT * FROM group_todo WHERE group_name = ?', [group_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: 'Le groupe spécifié n\'existe pas.' });
        }

        // Insérer le todo
        db.query(
            'INSERT INTO todoitems (title, group_id) VALUES (?, ?)',
            [title, group_id],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                return res.json(results);
            }
        );
    });
});

app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM todoitems WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.put('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const { title, group_id } = req.body;

    let query = 'UPDATE todoitems SET';
    const values = [];

    if (title !== undefined) {
        query += ' title = ?,';
        values.push(title);
    }
    if (group_id !== undefined) {
        // Vérifier si le groupe existe avant de mettre à jour
        db.query('SELECT * FROM group_todo WHERE group_name = ?', [group_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) {
                return res.status(400).json({ error: 'Le groupe spécifié n\'existe pas.' });
            }

            query += ' group_id = ?,';
            values.push(group_id);

            // Finaliser la requête
            query = query.slice(0, -1) + ' WHERE id = ?';
            values.push(id);

            db.query(query, values, (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                return res.json(results);
            });
        });
        return;
    }

    // Finaliser la requête si seul `title` est mis à jour
    query = query.slice(0, -1) + ' WHERE id = ?';
    values.push(id);

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});