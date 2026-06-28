const pool = require('../config/db');

// Crear tabla si no existe
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

// Inicializar
initializeTable();

// ==========================================
// MÉTODOS DEL MODELO
// ==========================================

const User = {
    // Buscar usuario por nombre de usuario
    findByUsername: async (username) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0] || null;
    },

    // Buscar usuario por email
    findByEmail: async (email) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    },

    // Buscar usuario por ID de Google
    findByGoogleId: async (googleId) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
        return rows[0] || null;
    },

    // Buscar usuario por token de verificación
    findByVerificationToken: async (token) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE verification_token = ?', [token]);
        return rows[0] || null;
    },

    // Crear nuevo usuario
    create: async (userData) => {
        const { username, fullname, email, password, institution, country, role, is_verified, verification_token, google_id } = userData;
        const [result] = await pool.query(
            `INSERT INTO users 
            (username, fullname, email, password, institution, country, role, is_verified, verification_token, google_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, fullname, email, password, institution || null, country || null, role || 'user', is_verified || 0, verification_token || null, google_id || null]
        );
        return result.insertId;
    },

    // Verificar usuario
    verifyUser: async (userId) => {
        await pool.query('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [userId]);
    },

    // Actualizar usuario
    update: async (userId, userData) => {
        const { fullname, email, institution, country } = userData;
        const [result] = await pool.query(
            'UPDATE users SET fullname = ?, email = ?, institution = ?, country = ? WHERE id = ?',
            [fullname, email, institution, country, userId]
        );
        return result.affectedRows > 0;
    },

    // Cambiar contraseña
    updatePassword: async (userId, newPassword) => {
        const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        return result.affectedRows > 0;
    },

    // Eliminar usuario
    delete: async (userId) => {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        return result.affectedRows > 0;
    },

    // Obtener todos los usuarios (para admin)
    findAll: async () => {
        const [rows] = await pool.query('SELECT id, username, fullname, email, role, is_verified, created_at FROM users ORDER BY id DESC');
        return rows;
    }
};

module.exports = User;