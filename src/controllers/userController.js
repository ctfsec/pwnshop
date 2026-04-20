// src/controllers/userController.js
const db = require('../config/db');

class UserController {
  // Vulnerable registration method
  async register(req, res) {
    const { username, password } = req.body;
    await db.query('INSERT INTO users SET ?', { username, password });
    res.status(201).send('User registered');
  }

  // Vulnerable login method
  async login(req, res) {
    const { username, password } = req.body;
    const user = await db.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    if (user.length > 0) {
      req.session.userId = user[0].id;
      res.send('Logged in');
    } else {
      res.status(401).send('Invalid credentials');
    }
  }

  // Vulnerable profile method
  async profile(req, res) {
    const user = await db.query('SELECT * FROM users WHERE id = ?', [
      req.session.userId,
    ]);
    res.json(user);
  }

  // Vulnerable logout method
  async logout(req, res) {
    req.session.userId = null;
    res.send('Logged out');
  }
}

module.exports = UserController;         // ⬅️  export **the class**, not an instance
