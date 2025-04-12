const mysql = require('mysql2');

    // Configuration de la connexion MySQL
    const db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'todolist',
    });

    // Connexion à MySQL
    db.connect((err) => {
        if (err) {
            console.error('Erreur de connexion à MySQL:', err.stack);
            return;
        }
        console.log('Connecté à MySQL avec l\'ID', db.threadId);
    });

    // Création de la base de données si elle n'existe pas
    db.query('CREATE DATABASE IF NOT EXISTS todolist', (err) => {
        if (err) {
            console.error('Erreur lors de la création de la base de données:', err.stack);
            return;
        }
        console.log('Base de données créée ou déjà existante.');
    });
    
    // Selection de la base de données
    db.changeUser({ database: 'todolist' }, (err) => {
        if (err) {
            console.error('Erreur lors de la sélection de la base de données:', err.stack);
            return;
        }
        console.log('Base de données sélectionnée.');
    });

    // Création des tables si elles n'existent pas
    // Création de la table `group_todo`
    const createGroupTable = `
        CREATE TABLE IF NOT EXISTS group_todo (
            id INT AUTO_INCREMENT PRIMARY KEY,
            group_name VARCHAR(30) NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `;

    // Vérification de l'existence de la table `group_todo` et création si elle n'existe pas
    db.query(createGroupTable, (err) => {
        if (err) {
            console.error('Erreur lors de la création de la table `group_todo`:', err.stack);
            return;
        }
        console.log('Table `group_todo` créée ou déjà existante.');
    });

    // Création de la table `todoitems`
    const createTodoItemsTable = `
        CREATE TABLE IF NOT EXISTS todoitems (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(30) NOT NULL,
            group_id VARCHAR(30) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            Foreign key (group_id) references group_todo(group_name) on delete cascade
        );
    `;

    db.query(createTodoItemsTable, (err) => {
        if (err) {
            console.error('Erreur lors de la création de la table `todoitems`:', err.stack);
            return;
        }
        console.log('Table `todoitems` créée ou déjà existante.');
    });

module.exports = db;