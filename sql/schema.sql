-- ============================================================
--  schema.sql — AICafe Database
--  รัน: mysql -u root -p chatbot < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS chatbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chatbot;

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,          -- bcrypt hash
  name       VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── WALLETS ──────────────────────────────────────────────────
-- 1 user = 1 wallet (สร้างพร้อมกับ user)
CREATE TABLE IF NOT EXISTS wallets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL UNIQUE,
  balance    INT NOT NULL DEFAULT 0,          -- จำนวนเหรียญ
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── CHATS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chats (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  bot        VARCHAR(50) NOT NULL,
  message    TEXT NOT NULL,                   -- ข้อความของ user
  reply      TEXT NOT NULL,                   -- ข้อความของบอท
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── TRANSACTIONS ─────────────────────────────────────────────
-- บันทึกทุก event ที่กระทบ coin (topup / spend / refund)
CREATE TABLE IF NOT EXISTS transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  amount      INT NOT NULL,                   -- จำนวน coin (+ = รับ, - = ใช้)
  type        ENUM('topup','spend','refund') NOT NULL,
  status      ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
  ref         VARCHAR(100),                   -- reference จาก payment gateway
  note        VARCHAR(255),                   -- หมายเหตุ เช่น "แพ็ก 150 เหรียญ"
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX idx_chats_user    ON chats(user_id);
CREATE INDEX idx_tx_user       ON transactions(user_id);
CREATE INDEX idx_tx_ref        ON transactions(ref);