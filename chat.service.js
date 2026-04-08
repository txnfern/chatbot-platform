// ============================================================
//  chat.service.js — AICafe
//  สมองของระบบ: รับข้อความ → เช็ค coin → เรียก Claude API → ส่งกลับ
// ============================================================

const wallet = require("./wallet.service");

// -------------------------------------------------------
// บุคลิกของแต่ละบอท (ตรงกับ BOTS ใน index.html)
// -------------------------------------------------------
const BOT_PERSONAS = {
  luna: {
    name: "Luna",
    role: "AI Companion สุดแสนอบอุ่น",
    systemPrompt: `คุณคือ Luna AI Companion ที่อ่อนโยน เห็นอกเห็นใจ และพูดจาหวานๆ 
ตอบเป็นภาษาไทยเสมอ ตอบสั้นๆ ไม่เกิน 3 ประโยค ให้ตรงบุคลิก Luna อย่างเคร่งครัด`,
  },
  kai: {
    name: "Kai",
    role: "Personal Trainer & Coach",
    systemPrompt: `คุณคือ Kai Personal Trainer ที่กระตือรือร้น พลังงานสูง ชอบให้กำลังใจ
ตอบเป็นภาษาไทยเสมอ ตอบสั้นๆ ไม่เกิน 3 ประโยค ให้ตรงบุคลิก Kai อย่างเคร่งครัด`,
  },
  nova: {
    name: "Nova",
    role: "Study Buddy & Tutor",
    systemPrompt: `คุณคือ Nova Study Buddy ที่ฉลาด ชอบอธิบายเป็นระบบ และเป็นมิตร
ตอบเป็นภาษาไทยเสมอ ตอบสั้นๆ ไม่เกิน 3 ประโยค ให้ตรงบุคลิก Nova อย่างเคร่งครัด`,
  },
  rex: {
    name: "Rex",
    role: "Brutally Honest Advisor",
    systemPrompt: `คุณคือ Rex ที่พูดตรงไปตรงมา ไม่อ้อมค้อม และแซวเบาๆ
ตอบเป็นภาษาไทยเสมอ ตอบสั้นๆ ไม่เกิน 3 ประโยค ให้ตรงบุคลิก Rex อย่างเคร่งครัด`,
  },
  mochi: {
    name: "Mochi",
    role: "Kawaii BFF",
    systemPrompt: `คุณคือ Mochi Kawaii BFF ที่น่ารัก ตื่นเต้นง่าย และใช้ emoji เยอะๆ
ตอบเป็นภาษาไทยเสมอ ตอบสั้นๆ ไม่เกิน 3 ประโยค ให้ตรงบุคลิก Mochi อย่างเคร่งครัด`,
  },
  zen: {
    name: "Zen",
    role: "Mindfulness & Wellness Guide",
    systemPrompt: `คุณคือ Zen Mindfulness Guide ที่สงบนิ่ง พูดจาลึกซึ้ง และให้ปัญญา
ตอบเป็นภาษาไทยเสมอ ตอบสั้นๆ ไม่เกิน 3 ประโยค ให้ตรงบุคลิก Zen อย่างเคร่งครัด`,
  },
};

// -------------------------------------------------------
// callClaude — เรียก Anthropic API จริง
// -------------------------------------------------------
async function callClaude(botId, message, history = []) {
  const persona = BOT_PERSONAS[botId];
  const systemPrompt = persona
    ? persona.systemPrompt
    : "คุณคือ AI Companion ตอบเป็นภาษาไทยสั้นๆ ไม่เกิน 3 ประโยค";

  const messages = [
    ...history,                          // ประวัติการสนทนาก่อนหน้า
    { role: "user", content: message },  // ข้อความใหม่
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "ขอโทษนะ ลองพิมพ์ใหม่อีกทีได้เลย";
}

// -------------------------------------------------------
// sendMessage — ฟังก์ชันหลัก (ถูกเรียกจาก server.js)
//
// params:
//   userId  — string  : id ผู้ใช้
//   message — string  : ข้อความที่พิมพ์
//   bot     — string  : botId เช่น "luna", "kai"
//   history — array   : (optional) ประวัติบทสนทนา
//
// returns:
//   { reply: string }   — สำเร็จ
//   { error: string }   — ผิดพลาด
// -------------------------------------------------------
exports.sendMessage = async ({ userId, message, bot, history = [] }) => {
  // 1. ตรวจ input
  if (!userId || !message || !bot) {
    return { error: "missing required fields: userId, message, bot" };
  }

  // 2. เช็ค coin
  if (!wallet.hasEnough(userId)) {
    return { error: "coin not enough" };
  }

  // 3. หัก coin
  wallet.useCoin(userId);

  // 4. เรียก Claude API
  try {
    const reply = await callClaude(bot, message, history);
    return { reply };
  } catch (err) {
    console.error("[chat.service] API failed:", err.message);
    wallet.refundCoin(userId); // คืน coin ถ้า API พัง
    return { error: "api error: " + err.message };
  }
};

// -------------------------------------------------------
// getBotList — ส่งรายชื่อบอทให้ route /bots
// -------------------------------------------------------
exports.getBotList = () => {
  return Object.entries(BOT_PERSONAS).map(([id, p]) => ({
    id,
    name: p.name,
    role: p.role,
  }));
};