const db = require('../config/db');

class Project {
  static async getByUserId(userId) {
    const [rows] = await db.query('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT p.*, u.username, u.fullname as author_name
      FROM projects p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
    return rows[0];
  }

  static async getStats() {
    const [totalRows] = await db.query('SELECT COUNT(*) as total FROM projects');
    const [acceptedRows] = await db.query("SELECT COUNT(*) as total FROM projects WHERE status = 'aceptado'");
    const [revisionRows] = await db.query("SELECT COUNT(*) as total FROM projects WHERE status = 'en_revision'");
    const [rejectedRows] = await db.query("SELECT COUNT(*) as total FROM projects WHERE status = 'rechazado'");

    return {
      total: totalRows[0].total,
      accepted: acceptedRows[0].total,
      revision: revisionRows[0].total,
      rejected: rejectedRows[0].total
    };
  }

  static async create(data) {
    const sql = `INSERT INTO projects (user_id, title, authors, abstract, area, institution, country, file_path, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_revision')`;
    const params = [
      data.user_id,
      data.title,
      data.authors,
      data.abstract,
      data.area,
      data.institution || null,
      data.country || null,
      data.file_path || null
    ];
    const [result] = await db.execute(sql, params);
    return result.insertId;
  }

  static async updateStatus(id, status, feedback) {
    const [result] = await db.execute('UPDATE projects SET status = ?, admin_feedback = ? WHERE id = ?', [status, feedback || null, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM projects WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Project;
