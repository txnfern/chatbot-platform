// ============================================================
//  repositories/wallet.repository.js
//  CRUD สำหรับตาราง wallets และ transactions
// ============================================================

const db = require("../config/db");

// ── WALLET ───────────────────────────────────────────────────

exports.getBalance = async (userId) => {
  const [rows] = await db.query(
    "SELECT balance FROM wallets WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (!rows[0]) throw new Error("wallet not found");
  return rows[0].balance;
};

/**
 * เพิ่ม/ลด coin พร้อม transaction log อย่างปลอดภัย
 * ใช้ FOR UPDATE เพื่อป้องกัน race condition
 */
exports.adjustBalance = async (userId, delta, type, ref = null, note = null) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // lock แถวนี้ก่อนอ่าน
    const [rows] = await conn.query(
      "SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE",
      [userId]
    );
    if (!rows[0]) throw new Error("wallet not found");

    const newBalance = rows[0].balance + delta;
    if (newBalance < 0) throw new Error("insufficient balance");

    // อัปเดต balance
    await conn.query(
      "UPDATE wallets SET balance = ? WHERE user_id = ?",
      [newBalance, userId]
    );

    // บันทึก transaction log ทุกครั้ง — ห้ามข้าม!
    await conn.query(
      `INSERT INTO transactions (user_id, amount, type, status, ref, note)
       VALUES (?, ?, ?, 'success', ?, ?)`,
      [userId, delta, type, ref, note]
    );

    await conn.commit();
    return newBalance;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── TRANSACTIONS ─────────────────────────────────────────────

exports.createPendingTransaction = async (userId, amount, ref, note) => {
  const [result] = await db.query(
    `INSERT INTO transactions (user_id, amount, type, status, ref, note)
     VALUES (?, ?, 'topup', 'pending', ?, ?)`,
    [userId, amount, ref, note]
  );
  return result.insertId;
};

exports.markTransactionSuccess = async (ref) => {
  await db.query(
    "UPDATE transactions SET status = 'success' WHERE ref = ?",
    [ref]
  );
};

exports.markTransactionFailed = async (ref) => {
  await db.query(
    "UPDATE transactions SET status = 'failed' WHERE ref = ?",
    [ref]
  );
};

exports.getTransactionByRef = async (ref) => {
  const [rows] = await db.query(
    "SELECT * FROM transactions WHERE ref = ? LIMIT 1",
    [ref]
  );
  return rows[0] || null;
};

exports.getUserTransactions = async (userId, limit = 20) => {
  const [rows] = await db.query(
    `SELECT id, amount, type, status, note, created_at
     FROM transactions WHERE user_id = ?
     ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
  return rows;
};