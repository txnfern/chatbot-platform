// ============================================================
//  config/db.js — MariaDB Connection Pool
// ============================================================

const mysql = require("mysql2");

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "chatbot",
  waitForConnections: true,
  connectionLimit:    10,          // max connections พร้อมกัน
  queueLimit:         0,
  charset:            "utf8mb4",
});

// ทดสอบการเชื่อมต่อตอน start
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ MariaDB connected");
  conn.release();
});

// export เป็น promise-based pool
module.exports = pool.promise();