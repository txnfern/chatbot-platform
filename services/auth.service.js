// ============================================================
//  services/auth.service.js
//  Register / Login + JWT
// ============================================================

const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const userRepo = require("../repositories/user.repository");

const JWT_SECRET  = process.env.JWT_SECRET  || "aicafe-secret-change-in-prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// ── REGISTER ─────────────────────────────────────────────────

exports.register = async (email, password, name) => {
  email = email.toLowerCase().trim();

  // เช็ค email ซ้ำ
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new Error("email already exists");

  if (password.length < 6) throw new Error("password too short");

  // hash password ด้วย bcrypt (cost factor 12)
  const hashed = await bcrypt.hash(password, 12);

  const userId = await userRepo.createUser(email, hashed, name);
  const token  = signToken(userId, name);

  return { userId, name, token };
};

// ── LOGIN ────────────────────────────────────────────────────

exports.login = async (email, password) => {
  email = email.toLowerCase().trim();

  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error("invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("invalid credentials");

  const token = signToken(user.id, user.name);
  return { userId: user.id, name: user.name, token };
};

// ── HELPERS ──────────────────────────────────────────────────

function signToken(userId, name) {
  return jwt.sign({ userId, name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET); // throws ถ้า invalid
};