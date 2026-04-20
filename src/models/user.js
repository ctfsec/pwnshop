const mysql = require('mysql');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pwnshop'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to the database.');
});

class User {
    static createUser(userData, callback) {
        const query = 'INSERT INTO users SET ?';
        db.query(query, userData, (err, results) => {
            if (err) return callback(err);
            callback(null, results.insertId);
        });
    }

    static getUserById(userId, callback) {
        const query = 'SELECT * FROM users WHERE id = ?';
        db.query(query, [userId], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    }

    static updateUser(userId, userData, callback) {
        const query = 'UPDATE users SET ? WHERE id = ?';
        db.query(query, [userData, userId], (err, results) => {
            if (err) return callback(err);
            callback(null, results.affectedRows);
        });
    }

    static deleteUser(userId, callback) {
        const query = 'DELETE FROM users WHERE id = ?';
        db.query(query, [userId], (err, results) => {
            if (err) return callback(err);
            callback(null, results.affectedRows);
        });
    }
}

module.exports = User;