const db = require('../config/db');

class User {
  static async findByUsername(username) {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findByGoogleId(googleId) {
    const [rows] = await db.execute('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return rows[0];
  }

  static async findByVerificationToken(token) {
    const [rows] = await db.execute('SELECT * FROM users WHERE verification_token = ?', [token]);
    return rows[0];
  }

  static async getById(id) {
    const [rows] = await db.execute('SELECT id, username, fullname, email, role, institution, country, is_verified FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async getAll() {
    const [rows] = await db.query('SELECT id, username, fullname, email, role, institution, country, is_verified FROM users');
    return rows;
  }

  static async create(data) {
    const sql = `INSERT INTO users (username, fullname, email, password, google_id, institution, country, role, is_verified, verification_token) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      data.username || null,
      data.fullname,
      data.email,
      data.password || '',
      data.google_id || null,
      data.institution || null,
      data.country || null,
      data.role || 'assistant',
      data.is_verified || 0,
      data.verification_token || null
    ];
    
    const [result] = await db.execute(sql, params);
    return result.insertId;
  }

  static async verifyUser(id) {
    const [result] = await db.execute('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async updateRole(id, role) {
    const [result] = await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return result.affectedRows > 0;
  }

  static async countAll() {
    const [rows] = await db.query('SELECT COUNT(*) as total FROM users');
    return rows[0].total;
  }
}

module.exports = User;
