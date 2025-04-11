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
app.get('/api/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.get('/api/users/:id/todos', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT * FROM todoitems
        WHERE user_id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.post('/api/users', (req, res) => {
    const { email, password } = req.body;

            // Vérification de l'existence de l'utilisateur
            db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                if (results.length > 0) {
                    return res.status(400).json({ error: 'L\'utilisateur existe déjà' });
                }
            
            // Validation des champ
            // Ce n'est plus nécessaire si dans le frontend on vérifie si le champ est videt vide
            if (!email || !password) {
                return res.status(400).json({ error: 'Les champs email et password sont obligatoires.' });
            }

            db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                return res.json(results);
        });
    });
});

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { email, password } = req.body;

    let query = 'UPDATE users SET';
    const values = [];

    if (email !== undefined) {
        query += ' email = ?,';
        values.push(email);
    }
    if (password !== undefined) {
        query += ' password = ?,';
        values.push(password);
    }

    query = query.slice(0, -1) + ' WHERE id = ?';
    values.push(id);

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});


// Todo routes
app.get('/api/todos', (req, res) => {
    const query = `
        SELECT todoitems.*, users.email AS user_email
        FROM todoitems
        LEFT JOIN users ON todoitems.user_id = users.id
    `;
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.post('/api/todos', (req, res) => {
    const { title, tasks, status = 'To Do', user_id, group_name = 'default' } = req.body;

        // Validation des champs
        if (!title || !tasks || !user_id) {
            return res.status(400).json({ error: 'Les champs title, tasks et user_id sont obligatoires.' });
        }

        // Vérifier si l'utilisateur existe
        db.query('SELECT * FROM users WHERE id = ?', [user_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) {
                return res.status(400).json({ error: 'Utilisateur non trouvé' });
            }

        // Insérer le todo
        db.query(
            'INSERT INTO todoitems (title, tasks, status, user_id, group_name) VALUES (?, ?, ?, ?, ?)',
            [title, tasks, status, user_id, group_name],
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
    const { title, tasks, status, user_id, group_name } = req.body;

    let query = 'UPDATE todoitems SET';
    const values = [];

    if (title !== undefined) {
        query += ' title = ?,';
        values.push(title);
    }
    if (tasks !== undefined) {
        query += ' tasks = ?,';
        values.push(tasks);
    }
    if (status !== undefined) {
        query += ' status = ?,';
        values.push(status);
    }
    if (user_id !== undefined) {
        query += ' user_id = ?,';
        values.push(user_id);
    }
    if (group_name !== undefined) {
        query += ' group_name = ?,';
        values.push(group_name);
    }

    query = query.slice(0, -1) + ' WHERE id = ?';
    values.push(id);

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

// Requête pour regrouper les todos par Groupe en fonction des status des todos utile pour le tri
// Exemple de requête pour regrouper les todos par status
app.get('/api/todos/grouped-by-status', (req, res) => {
    const query = `
        SELECT status, JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'title', title,
                'tasks', tasks,
                'group_name', group_name,
                'user_id', user_id,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) AS todos
        FROM todoitems
        GROUP BY status
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.get('/api/todos/grouped-by-status/:status', (req, res) => {
    const { status } = req.params;

    const query = `
        SELECT status, JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'title', title,
                'tasks', tasks,
                'group_name', group_name,
                'user_id', user_id,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) AS todos
        FROM todoitems
        WHERE status = ?
        GROUP BY status
    `;

    db.query(query, [status], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

// Requête pour regrouper les todos par Groupe en fonction des groupes des todos utile pour le tri
// Exemple de requête pour regrouper les todos par groupe
app.get('/api/todos/grouped-by-group', (req, res) => {
    const query = `
        SELECT group_name, JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'title', title,
                'tasks', tasks,
                'status', status,
                'user_id', user_id,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) AS todos
        FROM todoitems
        GROUP BY group_name
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.get('/api/todos/grouped-by-group/:group_name', (req, res) => {
    const { group_name } = req.params;

    const query = `
        SELECT group_name, JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'title', title,
                'tasks', tasks,
                'status', status,
                'user_id', user_id,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) AS todos
        FROM todoitems
        WHERE group_name = ?
        GROUP BY group_name
    `;

    db.query(query, [group_name], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});