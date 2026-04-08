// ============================================================
//  repositories/user.repository.js
//  CRUD สำหรับตาราง users และ wallets
// ============================================================

const db = require("../config/db");

// ── CREATE ───────────────────────────────────────────────────

/**
 * สร้าง user ใหม่ + wallet เริ่มต้น (balance = 0)
 * ใช้ transaction เพื่อให้ทั้งคู่สำเร็จหรือล้มเหลวพร้อมกัน
 */
exports.createUser = async (email, hashedPassword, name) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, hashedPassword, name]
    );
    const userId = result.insertId;

    // สร้าง wallet คู่กันทันที
    await conn.query(
      "INSERT INTO wallets (user_id, balance) VALUES (?, 0)",
      [userId]
    );

    await conn.commit();
    return userId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── READ ─────────────────────────────────────────────────────

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
};

exports.findById = async (userId) => {
  const [rows] = await db.query(
    "SELECT id, email, name, created_at FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  return rows[0] || null;
};