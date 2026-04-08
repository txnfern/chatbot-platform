// ============================================================
//  repositories/chat.repository.js
//  บันทึก/ดึงประวัติการสนทนา
// ============================================================

const db = require("../config/db");

exports.saveChat = async (userId, bot, message, reply) => {
  const [result] = await db.query(
    "INSERT INTO chats (user_id, bot, message, reply) VALUES (?, ?, ?, ?)",
    [userId, bot, message, reply]
  );
  return result.insertId;
};

exports.getChatHistory = async (userId, bot, limit = 20) => {
  const [rows] = await db.query(
    `SELECT message, reply, created_at
     FROM chats WHERE user_id = ? AND bot = ?
     ORDER BY created_at DESC LIMIT ?`,
    [userId, bot, limit]
  );
  // คืนเป็น format ที่ Claude API ใช้ได้เลย (เรียงเก่า→ใหม่)
  return rows.reverse().flatMap(r => [
    { role: "user",      content: r.message },
    { role: "assistant", content: r.reply   },
  ]);
};