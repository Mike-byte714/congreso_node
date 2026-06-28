const pool = require('../config/db');

// Función para crear la tabla si no existe
const initializeTable = async () => {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            fullname VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            institution VARCHAR(100),
            country VARCHAR(50),
            role ENUM('admin', 'assistant', 'evaluator', 'user') DEFAULT 'user',
            is_verified BOOLEAN DEFAULT 0,
            verification_token VARCHAR(100),
            google_id VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    try {
        await pool.query(createTableSQL);
        console.log('✅ Tabla users creada/verificada correctamente');
        
        // Verificar si existe admin, si no crearlo
        const [rows] = await pool.query("SELECT * FROM users WHERE username = 'admin'");
        if (rows.length === 0) {
            await pool.query(`
                INSERT INTO users (username, fullname, email, password, role, is_verified)
                VALUES ('admin', 'Administrador', 'admin@tesco.com', 
                       '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.cZxq5D7e5xSTtKxqYQvZxYxYxYx',
                       'admin', 1)
            `);
            console.log('✅ Usuario admin creado');
        }
    } catch (error) {
        console.error('❌ Error al crear tabla users:', error.message);
    }
};

// Ejecutar inicialización
initializeTable();

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
