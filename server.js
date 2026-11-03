'use strict';
/*
 * OplaKid: máy chủ web.
 * - Tài khoản phụ huynh: đăng ký, đăng nhập, đăng xuất, quên mật khẩu, đổi mật khẩu, xoá tài khoản.
 * - Lưu hồ sơ bé và tiến độ học theo từng tài khoản (SQLite).
 * - WebSocket /ws: ai đang online, phòng đua với bạn.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { promisify } = require('util');
const express = require('express');
const { WebSocketServer } = require('ws');
const Database = require('better-sqlite3');
const { RaceManager, cleanNick } = require('./races');

const scrypt = promisify(crypto.scrypt);

/* ---------------- Cấu hình ---------------- */
const PORT = Number(process.env.PORT) || 3000;
const APP_ORIGIN = (process.env.APP_ORIGIN || `http://localhost:${PORT}`).replace(/\/+$/, '');
const COOKIE_SECURE = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : APP_ORIGIN.startsWith('https://');
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'be-go-phim.sqlite');
const SESSION_DAYS = 30;
const COOKIE = 'bgp_sid';
const MAX_DOC_BYTES = 250 * 1024;
const MAX_DOCS_PER_USER = 60;
const MAX_SOCKETS_PER_USER = 12;

/* ---------------- Cơ sở dữ liệu ---------------- */
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  pw TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  consent_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS resets(
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_email TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS feedback(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'other',
  rating INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL,
  contact_ok INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_time ON feedback(created_at);
CREATE TABLE IF NOT EXISTS docs(
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, name)
);
`);

/* Thêm cột mới cho bảng users (có giá trị mặc định, không đổi hay xoá cột cũ) */
{
  const cols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
  if (!cols.includes('disabled')) db.exec('ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0');
  if (!cols.includes('last_login')) db.exec('ALTER TABLE users ADD COLUMN last_login INTEGER NOT NULL DEFAULT 0');
}

const q = {
  userDisabled: db.prepare('SELECT disabled FROM users WHERE id = ?'),
  userByEmailOrId: db.prepare('SELECT id, email FROM users WHERE id = ?'),
  touchLogin: db.prepare('UPDATE users SET last_login = ? WHERE id = ?'),
  setDisabled: db.prepare('UPDATE users SET disabled = ? WHERE id = ?'),
  insertAdminLog: db.prepare('INSERT INTO admin_log(admin_email, action, target_email, created_at) VALUES(?, ?, ?, ?)'),
  listAdminLog: db.prepare('SELECT admin_email, action, target_email, created_at FROM admin_log ORDER BY id DESC LIMIT 20'),
  adminUsers: db.prepare(`SELECT u.id, u.email, u.created_at, u.last_login, u.disabled,
    (SELECT MAX(updated_at) FROM docs d WHERE d.user_id = u.id) AS last_active,
    (SELECT data FROM docs d WHERE d.user_id = u.id AND d.name = 'profiles') AS profiles,
    (SELECT COUNT(*) FROM feedback f WHERE f.user_id = u.id) AS fb
    FROM users u WHERE u.email LIKE ? ESCAPE '\\' ORDER BY u.created_at DESC LIMIT ? OFFSET ?`),
  adminUserCount: db.prepare("SELECT COUNT(*) AS n FROM users WHERE email LIKE ? ESCAPE '\\'"),
  userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  userById: db.prepare('SELECT id, email, created_at FROM users WHERE id = ?'),
  userPwById: db.prepare('SELECT pw FROM users WHERE id = ?'),
  insertUser: db.prepare('INSERT INTO users(id, email, pw, created_at, consent_at) VALUES(?, ?, ?, ?, ?)'),
  updatePw: db.prepare('UPDATE users SET pw = ? WHERE id = ?'),
  deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
  insertFeedback: db.prepare('INSERT INTO feedback(id, user_id, kind, rating, message, contact_ok, created_at) VALUES(?, ?, ?, ?, ?, ?, ?)'),
  listFeedback: db.prepare('SELECT f.id, f.kind, f.rating, f.message, f.contact_ok, f.created_at, u.email FROM feedback f JOIN users u ON u.id = f.user_id ORDER BY f.created_at DESC LIMIT 200'),
  deleteFeedback: db.prepare('DELETE FROM feedback WHERE id = ?'),
  insertSession: db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?, ?, ?)'),
  sessionUser: db.prepare('SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.disabled = 0'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  deleteUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
  deleteOtherSessions: db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?'),
  purgeSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  insertReset: db.prepare('INSERT INTO resets(token_hash, user_id, expires_at) VALUES(?, ?, ?)'),
  resetUser: db.prepare('SELECT user_id FROM resets WHERE token_hash = ? AND expires_at > ?'),
  deleteResets: db.prepare('DELETE FROM resets WHERE user_id = ?'),
  purgeResets: db.prepare('DELETE FROM resets WHERE expires_at <= ?'),
  getDoc: db.prepare('SELECT data, updated_at FROM docs WHERE user_id = ? AND name = ?'),
  countDocs: db.prepare('SELECT COUNT(*) AS n FROM docs WHERE user_id = ?'),
  upsertDoc: db.prepare(`INSERT INTO docs(user_id, name, data, updated_at) VALUES(?, ?, ?, ?)
    ON CONFLICT(user_id, name) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`),
  deleteDoc: db.prepare('DELETE FROM docs WHERE user_id = ? AND name = ?')
};

/* ---------------- Tiện ích bảo mật ---------------- */
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const newToken = () => crypto.randomBytes(32).toString('base64url');
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(pw, salt, 64, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), hash.toString('base64')].join('$');
}
async function verifyPassword(pw, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, 'base64');
  const got = await scrypt(pw, Buffer.from(salt, 'base64'), expected.length, { N: +N, r: +r, p: +p, maxmem: SCRYPT.maxmem });
  return crypto.timingSafeEqual(expected, got);
}
let DUMMY_HASH = null;
hashPassword(crypto.randomBytes(12).toString('hex')).then(h => { DUMMY_HASH = h; });

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}
function userFromRequest(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token || token.length > 100) return null;
  const row = q.sessionUser.get(sha256(token), Date.now());
  return row ? { id: row.id, email: row.email, tokenHash: sha256(token) } : null;
}
function startSession(res, userId) {
  const token = newToken();
  const expires = Date.now() + SESSION_DAYS * 864e5;
  q.insertSession.run(sha256(token), userId, expires);
  q.touchLogin.run(Date.now(), userId);
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${COOKIE_SECURE ? '; Secure' : ''}`);
}
function clearCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${COOKIE_SECURE ? '; Secure' : ''}`);
}

/* Giới hạn số lần thử (chống dò mật khẩu) */
const buckets = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset <= now) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.n += 1;
  return b.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k); }, 60_000).unref();
setInterval(() => { const now = Date.now(); q.purgeSessions.run(now); q.purgeResets.run(now); }, 3_600_000).unref();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normEmail = e => String(e || '').trim().toLowerCase();
const validEmail = e => e.length <= 254 && EMAIL_RE.test(e);
const validPassword = p => typeof p === 'string' && p.length >= 1 && p.length <= 128;

/* ---------------- Gửi email ---------------- */
let mailer = null;
if (process.env.SMTP_URL) {
  try { mailer = require('nodemailer').createTransport(process.env.SMTP_URL); }
  catch (e) { console.error('Không khởi tạo được SMTP:', e.message); }
}
async function sendResetEmail(to, link) {
  if (!mailer) {
    console.log(`[quên mật khẩu] Chưa cấu hình SMTP_URL. Link đặt lại cho ${to}: ${link}`);
    return;
  }
  await mailer.sendMail({
    from: process.env.MAIL_FROM || 'OplaKid <no-reply@localhost>',
    to,
    subject: 'Đặt lại mật khẩu OplaKid',
    text: `Chào bạn,\n\nBấm vào link dưới đây để đặt mật khẩu mới (link có hiệu lực trong 1 giờ):\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.\n\nOplaKid`
  });
}

/* ---------------- Ứng dụng web ---------------- */
const app = express();
app.disable('x-powered-by');
const TP = process.env.TRUST_PROXY;
app.set('trust proxy', !TP ? 'loopback' : /^\d+$/.test(TP) ? Number(TP) : TP === 'true' ? true : TP);

const wsOrigin = APP_ORIGIN.replace(/^http/, 'ws');
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src 'self' ${wsOrigin}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (COOKIE_SECURE) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});

/* Chống CSRF: yêu cầu thay đổi dữ liệu phải đến từ chính trang web */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (origin) return origin === APP_ORIGIN;
  const site = req.headers['sec-fetch-site'];
  return !site || site === 'same-origin' || site === 'none';
}
/* Thước đo hiệu năng cho trang quản trị: thời gian xử lý /api/* gần nhất, số lỗi 5xx, độ trễ vòng lặp sự kiện */
const { monitorEventLoopDelay } = require('perf_hooks');
const eld = monitorEventLoopDelay({ resolution: 20 }); eld.enable();
const METRICS = { reqs: 0, err5xx: 0, dur: [] };
app.use('/api', (req, res, next) => {
  const t0 = process.hrtime.bigint();
  res.on('finish', () => {
    METRICS.reqs++; if (res.statusCode >= 500) METRICS.err5xx++;
    METRICS.dur.push(Number(process.hrtime.bigint() - t0) / 1e6); if (METRICS.dur.length > 1000) METRICS.dur.shift();
  });
  next();
});
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && !sameOrigin(req)) return res.status(403).json({ error: 'Yêu cầu không hợp lệ.' });
  next();
});
app.use('/api', express.json({ limit: '300kb' }));

function requireUser(req, res, next) {
  const u = userFromRequest(req);
  if (!u) return res.status(401).json({ error: 'Bạn cần đăng nhập.' });
  req.user = u;
  next();
}
const ip = req => req.ip || 'unknown';
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const ADMIN_EMAILS = new Set((process.env.ADMIN_EMAILS || '').split(',').map(normEmail).filter(Boolean));
const isAdmin = u => !!u && ADMIN_EMAILS.has(u.email);
const publicUser = u => ({ id: u.id, email: u.email, admin: isAdmin(u) });

app.get('/api/auth/me', (req, res) => {
  const u = userFromRequest(req);
  if (!u) return res.status(401).json({ error: 'Chưa đăng nhập.' });
  res.json({ user: publicUser(u) });
});

app.post('/api/auth/register', wrap(async (req, res) => {
  const email = normEmail(req.body.email);
  const { password, consent } = req.body;
  if (rateLimited('reg:' + ip(req), 10, 3_600_000)) return res.status(429).json({ error: 'Bạn thử quá nhiều lần. Đợi một lát rồi thử lại.' });
  if (!validEmail(email)) return res.status(400).json({ error: 'Email chưa đúng định dạng.' });
  if (!validPassword(password)) return res.status(400).json({ error: 'Hãy nhập mật khẩu (tối đa 128 ký tự).' });
  if (consent !== true) return res.status(400).json({ error: 'Bạn cần xác nhận là ba mẹ hoặc người giám hộ và đồng ý với chính sách quyền riêng tư.' });
  if (q.userByEmail.get(email)) return res.status(409).json({ error: 'Email này đã có tài khoản. Bạn hãy đăng nhập, hoặc dùng “Quên mật khẩu”.' });
  const id = crypto.randomUUID();
  const now = Date.now();
  q.insertUser.run(id, email, await hashPassword(password), now, now);
  startSession(res, id);
  res.status(201).json({ user: publicUser({ id, email }) });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const email = normEmail(req.body.email);
  const password = String(req.body.password || '');
  if (rateLimited('login:' + ip(req), 30, 900_000) || rateLimited('login:' + email, 10, 900_000)) {
    return res.status(429).json({ error: 'Bạn thử quá nhiều lần. Đợi 15 phút rồi thử lại.' });
  }
  const row = q.userByEmail.get(email);
  const ok = row ? await verifyPassword(password, row.pw) : (DUMMY_HASH && await verifyPassword(password, DUMMY_HASH), false);
  if (!ok) return res.status(401).json({ error: 'Email hoặc mật khẩu chưa đúng.' });
  if (row.disabled) return res.status(403).json({ error: 'Tài khoản này đang bị khoá. Ba mẹ hãy liên hệ OplaKid nhé.' });
  startSession(res, row.id);
  res.json({ user: publicUser(row) });
}));

/* ---------------- Đăng nhập bằng Google (chuyển hướng phía máy chủ, không cần script ngoài) ---------------- */
const GOOGLE_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_ON = !!(GOOGLE_ID && GOOGLE_SECRET);
const GOOGLE_CB = APP_ORIGIN + '/auth/google/callback';
const OAUTH_COOKIE = 'bgp_oauth';
const authFail = (res, code) => { res.setHeader('Set-Cookie', `${OAUTH_COOKIE}=; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=0${COOKIE_SECURE ? '; Secure' : ''}`); res.redirect('/?auth_err=' + code); };

app.get('/api/auth/providers', (req, res) => res.json({ google: GOOGLE_ON }));

app.get('/auth/google/start', (req, res) => {
  if (!GOOGLE_ON) return authFail(res, 'off');
  if (rateLimited('gstart:' + ip(req), 30, 900_000)) return authFail(res, 'many');
  const register = req.query.mode === 'register';
  if (register && req.query.consent !== '1') return authFail(res, 'consent');
  const state = newToken();
  res.setHeader('Set-Cookie', `${OAUTH_COOKIE}=${state}.${register ? 'r' : 'l'}; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=600${COOKIE_SECURE ? '; Secure' : ''}`);
  const qs = new URLSearchParams({ client_id: GOOGLE_ID, redirect_uri: GOOGLE_CB, response_type: 'code', scope: 'openid email', state, prompt: 'select_account' });
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + qs);
});

app.get('/auth/google/callback', wrap(async (req, res) => {
  if (!GOOGLE_ON) return authFail(res, 'off');
  const [state, mode] = String(parseCookies(req.headers.cookie)[OAUTH_COOKIE] || '').split('.');
  if (!state || req.query.state !== state || typeof req.query.code !== 'string') return authFail(res, 'google');
  let email;
  try {
    const tr = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: req.query.code, client_id: GOOGLE_ID, client_secret: GOOGLE_SECRET, redirect_uri: GOOGLE_CB, grant_type: 'authorization_code' }),
      signal: AbortSignal.timeout(10_000)
    });
    const tok = await tr.json();
    if (!tr.ok || !tok.access_token) throw new Error('token');
    const ur = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + tok.access_token }, signal: AbortSignal.timeout(10_000) });
    const info = await ur.json();
    if (!ur.ok || info.email_verified !== true) throw new Error('email');
    email = normEmail(info.email);
    if (!validEmail(email)) throw new Error('email');
  } catch (e) { console.error('Đăng nhập Google thất bại:', e.message); return authFail(res, 'google'); }
  let row = q.userByEmail.get(email);
  if (!row) {
    if (mode !== 'r') return authFail(res, 'nouser'); // chưa có tài khoản: phải đăng ký (có tick đồng ý) trước
    const id = crypto.randomUUID(), now = Date.now();
    q.insertUser.run(id, email, await hashPassword(crypto.randomBytes(24).toString('hex')), now, now); // mật khẩu ngẫu nhiên, đăng nhập bằng Google hoặc “Quên mật khẩu”
    row = { id };
  }
  if (row.disabled) return authFail(res, 'locked');
  startSession(res, row.id);
  res.append('Set-Cookie', `${OAUTH_COOKIE}=; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=0${COOKIE_SECURE ? '; Secure' : ''}`);
  res.redirect('/');
}));

app.post('/api/auth/logout', (req, res) => {
  const u = userFromRequest(req);
  if (u) q.deleteSession.run(u.tokenHash);
  clearCookie(res);
  res.json({ ok: true });
});

app.post('/api/auth/forgot', wrap(async (req, res) => {
  const email = normEmail(req.body.email);
  if (rateLimited('forgot:' + ip(req), 10, 3_600_000) || rateLimited('forgot:' + email, 3, 3_600_000)) {
    return res.status(429).json({ error: 'Bạn yêu cầu quá nhiều lần. Đợi một lát rồi thử lại.' });
  }
  const row = validEmail(email) ? q.userByEmail.get(email) : null;
  if (row) {
    const token = newToken();
    q.insertReset.run(sha256(token), row.id, Date.now() + 3_600_000);
    try { await sendResetEmail(row.email, `${APP_ORIGIN}/?reset=${token}`); }
    catch (e) { console.error('Gửi email thất bại:', e.message); }
  }
  res.json({ ok: true });
}));

app.post('/api/auth/reset', wrap(async (req, res) => {
  const token = String(req.body.token || '');
  const { password } = req.body;
  if (rateLimited('reset:' + ip(req), 20, 3_600_000)) return res.status(429).json({ error: 'Bạn thử quá nhiều lần.' });
  if (!validPassword(password)) return res.status(400).json({ error: 'Hãy nhập mật khẩu (tối đa 128 ký tự).' });
  const row = token ? q.resetUser.get(sha256(token), Date.now()) : null;
  if (!row) return res.status(400).json({ error: 'Link đặt lại đã hết hạn hoặc đã dùng rồi. Bạn hãy yêu cầu link mới.' });
  if (q.userDisabled.get(row.user_id)?.disabled) return res.status(403).json({ error: 'Tài khoản này đang bị khoá. Ba mẹ hãy liên hệ OplaKid nhé.' });
  q.updatePw.run(await hashPassword(password), row.user_id);
  q.deleteResets.run(row.user_id);
  q.deleteUserSessions.run(row.user_id);
  startSession(res, row.user_id);
  const u = q.userById.get(row.user_id);
  res.json({ user: publicUser(u) });
}));

app.post('/api/auth/password', requireUser, wrap(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (rateLimited('pw:' + req.user.id, 10, 900_000)) return res.status(429).json({ error: 'Bạn thử quá nhiều lần.' });
  if (!validPassword(newPassword)) return res.status(400).json({ error: 'Hãy nhập mật khẩu mới (tối đa 128 ký tự).' });
  const row = q.userPwById.get(req.user.id);
  if (!row || !(await verifyPassword(String(oldPassword || ''), row.pw))) return res.status(401).json({ error: 'Mật khẩu hiện tại chưa đúng.' });
  q.updatePw.run(await hashPassword(newPassword), req.user.id);
  q.deleteOtherSessions.run(req.user.id, req.user.tokenHash);
  res.json({ ok: true });
}));

app.post('/api/account/delete', requireUser, wrap(async (req, res) => {
  if (rateLimited('del:' + req.user.id, 5, 900_000)) return res.status(429).json({ error: 'Bạn thử quá nhiều lần.' });
  const row = q.userPwById.get(req.user.id);
  if (!row || !(await verifyPassword(String(req.body.password || ''), row.pw))) return res.status(401).json({ error: 'Mật khẩu chưa đúng.' });
  q.deleteUser.run(req.user.id);
  disconnectUser(req.user.id);
  clearCookie(res);
  res.json({ ok: true });
}));

/* Góp ý và đóng góp cải tiến: chỉ ba mẹ (tài khoản đã đăng nhập) được gửi; chỉ quản trị viên (ADMIN_EMAILS) được xem.
 * Không hiển thị cho các bé hay người dùng khác. Email chỉ lộ cho quản trị viên khi ba mẹ tick đồng ý liên hệ. */
const FB_KINDS = new Set(['idea', 'bug', 'praise', 'other']);
const FB_KIND_NAME = { idea: 'Ý tưởng cải tiến', bug: 'Báo lỗi', praise: 'Điều em thích', other: 'Khác' };
const FB_CLEAN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g;
app.post('/api/feedback', requireUser, wrap(async (req, res) => {
  if (rateLimited('fb:' + req.user.id, 5, 3_600_000) || rateLimited('fbip:' + ip(req), 20, 3_600_000)) {
    return res.status(429).json({ error: 'Ba mẹ gửi nhiều quá. Đợi một lát rồi gửi tiếp nhé.' });
  }
  const b = req.body || {};
  const kind = FB_KINDS.has(b.kind) ? b.kind : 'other';
  const rating = Number.isInteger(b.rating) && b.rating >= 0 && b.rating <= 5 ? b.rating : 0;
  const message = typeof b.message === 'string' ? b.message.replace(FB_CLEAN, '').trim().slice(0, 1000) : '';
  if (message.length < 5) return res.status(400).json({ error: 'Ba mẹ viết thêm một chút nhé (ít nhất 5 chữ).' });
  const contact = b.contact === true ? 1 : 0;
  q.insertFeedback.run(crypto.randomUUID(), req.user.id, kind, rating, message, contact, Date.now());
  if (mailer && process.env.FEEDBACK_EMAIL) {
    mailer.sendMail({
      from: process.env.MAIL_FROM || 'OplaKid <no-reply@localhost>', to: process.env.FEEDBACK_EMAIL,
      subject: '[OplaKid] Góp ý mới: ' + FB_KIND_NAME[kind],
      text: `Loại: ${FB_KIND_NAME[kind]}\nĐánh giá: ${rating ? rating + '/5' : 'không chấm'}\nLiên hệ lại: ${contact ? req.user.email : 'ba mẹ không đồng ý'}\n\n${message}`
    }).catch(e => console.error('Gửi email góp ý thất bại:', e.message));
  }
  res.status(201).json({ ok: true });
}));
app.get('/api/feedback', requireUser, (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Chỉ quản trị viên được xem.' });
  res.json({ items: q.listFeedback.all().map(r => ({ id: r.id, kind: r.kind, rating: r.rating, message: r.message, createdAt: r.created_at, email: r.contact_ok ? r.email : null })) });
});
app.delete('/api/feedback/:id', requireUser, (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Chỉ quản trị viên được xoá.' });
  q.deleteFeedback.run(String(req.params.id).slice(0, 64));
  res.json({ ok: true });
});

/* Kho dữ liệu riêng của từng tài khoản: danh sách hồ sơ bé và tiến độ từng bé */
const DOC_RE = /^(profiles|p-[a-z0-9]{4,32})$/;
app.get('/api/docs/:name', requireUser, (req, res) => {
  if (!DOC_RE.test(req.params.name)) return res.status(400).json({ error: 'Tên không hợp lệ.' });
  const row = q.getDoc.get(req.user.id, req.params.name);
  if (!row) return res.json({ exists: false });
  res.json({ exists: true, data: { json: row.data, updatedAt: row.updated_at } });
});
app.put('/api/docs/:name', requireUser, (req, res) => {
  const name = req.params.name;
  if (!DOC_RE.test(name)) return res.status(400).json({ error: 'Tên không hợp lệ.' });
  const { json, updatedAt } = req.body || {};
  if (typeof json !== 'string' || Buffer.byteLength(json) > MAX_DOC_BYTES) return res.status(413).json({ error: 'Dữ liệu quá lớn.' });
  try { JSON.parse(json); } catch { return res.status(400).json({ error: 'Dữ liệu không hợp lệ.' }); }
  if (!q.getDoc.get(req.user.id, name) && q.countDocs.get(req.user.id).n >= MAX_DOCS_PER_USER) {
    return res.status(409).json({ error: 'Tài khoản đã có quá nhiều hồ sơ.' });
  }
  q.upsertDoc.run(req.user.id, name, json, Number.isFinite(updatedAt) ? Math.floor(updatedAt) : Date.now());
  res.json({ ok: true });
});
app.delete('/api/docs/:name', requireUser, (req, res) => {
  if (!DOC_RE.test(req.params.name) || req.params.name === 'profiles') return res.status(400).json({ error: 'Tên không hợp lệ.' });
  q.deleteDoc.run(req.user.id, req.params.name);
  res.json({ ok: true });
});

/* ---------------- Trang quản trị (chỉ email trong ADMIN_EMAILS) ---------------- */
const requireAdmin = (req, res, next) => isAdmin(req.user) ? next() : res.status(403).json({ error: 'Chỉ quản trị viên được dùng.' });
const adminOnly = [requireUser, requireAdmin];
const dayKey = t => new Date(t).toISOString().slice(0, 10);
const pct = (arr, p) => { if (!arr.length) return 0; const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(a.length * p))]; };
const countProfiles = data => { try { const l = JSON.parse(data).list; return Array.isArray(l) ? l.length : 0; } catch { return 0; } };

app.get('/api/admin/stats', adminOnly, (req, res) => {
  const now = Date.now(), DAY = 864e5, n = (sql, ...a) => db.prepare(sql).get(...a).n;
  const signupRows = db.prepare('SELECT created_at FROM users WHERE created_at >= ?').all(now - 14 * DAY);
  const signups = []; for (let i = 13; i >= 0; i--) signups.push({ day: dayKey(now - i * DAY), n: 0 });
  signupRows.forEach(r => { const d = signups.find(x => x.day === dayKey(r.created_at)); if (d) d.n++; });
  let kids = 0; for (const r of db.prepare("SELECT data FROM docs WHERE name = 'profiles' LIMIT 20000").all()) kids += countProfiles(r.data);
  const online = new Set(); for (const p of peers.values()) online.add(p.userId);
  let dbBytes = 0; for (const f of [DB_PATH, DB_PATH + '-wal']) { try { dbBytes += fs.statSync(f).size; } catch {} }
  const mem = process.memoryUsage();
  res.json({
    users: {
      total: n('SELECT COUNT(*) AS n FROM users'), new24h: n('SELECT COUNT(*) AS n FROM users WHERE created_at >= ?', now - DAY),
      new7d: n('SELECT COUNT(*) AS n FROM users WHERE created_at >= ?', now - 7 * DAY), new30d: n('SELECT COUNT(*) AS n FROM users WHERE created_at >= ?', now - 30 * DAY),
      disabled: n('SELECT COUNT(*) AS n FROM users WHERE disabled = 1'),
      active24h: n('SELECT COUNT(DISTINCT user_id) AS n FROM docs WHERE updated_at >= ?', now - DAY),
      active7d: n('SELECT COUNT(DISTINCT user_id) AS n FROM docs WHERE updated_at >= ?', now - 7 * DAY),
      login7d: n('SELECT COUNT(*) AS n FROM users WHERE last_login >= ?', now - 7 * DAY), kids
    },
    online: { users: online.size, sockets: peers.size, races: races.races.size },
    feedback: { total: n('SELECT COUNT(*) AS n FROM feedback'), new7d: n('SELECT COUNT(*) AS n FROM feedback WHERE created_at >= ?', now - 7 * DAY) },
    signups,
    server: {
      uptimeSec: Math.round(process.uptime()), node: process.version, rssMB: Math.round(mem.rss / 1048576), heapMB: Math.round(mem.heapUsed / 1048576), dbMB: Math.round(dbBytes / 1048576 * 10) / 10,
      reqs: METRICS.reqs, err5xx: METRICS.err5xx, avgMs: Math.round(METRICS.dur.reduce((a, b) => a + b, 0) / Math.max(1, METRICS.dur.length) * 10) / 10,
      p95Ms: Math.round(pct(METRICS.dur, .95) * 10) / 10, maxMs: Math.round(Math.max(0, ...METRICS.dur) * 10) / 10, loopP99Ms: Math.round(eld.percentile(99) / 1e5) / 10
    },
    log: q.listAdminLog.all().map(r => ({ admin: r.admin_email, action: r.action, target: r.target_email, at: r.created_at }))
  });
});

app.get('/api/admin/users', adminOnly, (req, res) => {
  const term = String(req.query.q || '').trim().toLowerCase().slice(0, 100).replace(/[\\%_]/g, c => '\\' + c);
  const size = 25, page = Math.max(0, Math.min(10000, parseInt(req.query.page, 10) || 0)), like = '%' + term + '%';
  const rows = q.adminUsers.all(like, size, page * size);
  res.json({
    total: q.adminUserCount.get(like).n, page, size,
    items: rows.map(r => ({ id: r.id, email: r.email, createdAt: r.created_at, lastLogin: r.last_login || null, lastActive: r.last_active || null,
      disabled: !!r.disabled, kids: r.profiles ? countProfiles(r.profiles) : 0, feedback: r.fb, admin: ADMIN_EMAILS.has(r.email) }))
  });
});

function adminTarget(req, res) {
  const t = q.userByEmailOrId.get(String(req.params.id).slice(0, 64));
  if (!t) { res.status(404).json({ error: 'Không tìm thấy tài khoản.' }); return null; }
  if (t.id === req.user.id) { res.status(400).json({ error: 'Không thao tác trên chính tài khoản đang đăng nhập.' }); return null; }
  if (ADMIN_EMAILS.has(t.email)) { res.status(400).json({ error: 'Không thao tác trên tài khoản quản trị khác.' }); return null; }
  return t;
}
const adminLog = (req, action, target) => q.insertAdminLog.run(req.user.email, action, target.email, Date.now());

app.post('/api/admin/users/:id/disable', adminOnly, (req, res) => {
  const t = adminTarget(req, res); if (!t) return;
  const off = req.body && req.body.disabled === true;
  q.setDisabled.run(off ? 1 : 0, t.id);
  if (off) { q.deleteUserSessions.run(t.id); disconnectUser(t.id); }
  adminLog(req, off ? 'khoá tài khoản' : 'mở khoá tài khoản', t);
  res.json({ ok: true, disabled: off });
});
app.post('/api/admin/users/:id/logout', adminOnly, (req, res) => {
  const t = adminTarget(req, res); if (!t) return;
  q.deleteUserSessions.run(t.id); disconnectUser(t.id);
  adminLog(req, 'đăng xuất mọi thiết bị', t);
  res.json({ ok: true });
});
app.post('/api/admin/users/:id/reset-link', adminOnly, (req, res) => {
  const t = adminTarget(req, res); if (!t) return;
  if (rateLimited('adminreset:' + req.user.id, 30, 3_600_000)) return res.status(429).json({ error: 'Tạo quá nhiều link.' });
  const token = newToken();
  q.insertReset.run(sha256(token), t.id, Date.now() + 3_600_000);
  adminLog(req, 'tạo link đặt lại mật khẩu', t);
  res.json({ link: `${APP_ORIGIN}/?reset=${token}`, expiresInMin: 60 });
});
app.delete('/api/admin/users/:id', adminOnly, (req, res) => {
  const t = adminTarget(req, res); if (!t) return;
  if (!req.body || normEmail(req.body.confirm) !== t.email) return res.status(400).json({ error: 'Email xác nhận chưa đúng.' });
  adminLog(req, 'xoá tài khoản', t);
  q.deleteUser.run(t.id); disconnectUser(t.id);
  res.json({ ok: true });
});

app.get('/.well-known/security.txt', (req, res) => {
  res.type('text/plain; charset=utf-8').send(
    `Contact: mailto:namnguyen.opla@gmail.com\nExpires: 2027-11-03T00:00:00.000Z\nPreferred-Languages: vi, en\nCanonical: ${APP_ORIGIN}/.well-known/security.txt\nPolicy: ${APP_ORIGIN}/privacy\n`);
});
app.use('/api', (req, res) => res.status(404).json({ error: 'Không tìm thấy.' }));
app.use('/vendor/three.min.js', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(require.resolve('three/build/three.min.js'));
});
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: '1h' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status === 400 || err.type === 'entity.parse.failed' ? 400 : 500).json({ error: 'Có lỗi xảy ra, bạn thử lại nhé.' });
});

/* ---------------- WebSocket: ai đang online và phòng đua ---------------- */
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 });
const peers = new Map(); // peerId -> { ws, userId, presence, updatedAt, tokens, last }

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, APP_ORIGIN);
  if (url.pathname !== '/ws' || req.headers.origin !== APP_ORIGIN) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return; }
  const user = userFromRequest(req);
  if (!user) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return; }
  let count = 0;
  for (const p of peers.values()) if (p.userId === user.id) count++;
  if (count >= MAX_SOCKETS_PER_USER) { socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n'); socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => { ws.user = user; wss.emit('connection', ws); });
});

const AVATARS = new Set(['🐯', '🐰', '🐼', '🦊', '🐸', '🐱', '🐶', '🐻', '🐨', '🐵', '🦁', '🐮', '🐷', '🐹', '🐭', '🐔', '🐧', '🐦', '🦉', '🦄', '🐲', '🐙', '🦋', '🐢', '🐬', '🐳', '🦖', '🦒', '🐘', '🦓', '🐝', '🐞', '🦀', '🐥', '🦔']);
const STAGES = new Set(['bo', 'di', 'chay', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10']);
const PHASES = new Set(['lobby', 'countdown', 'racing', 'done']);
const KINDS = new Set(['sent', 'long', 'words', 'home', 'keys']);
const ACTS = new Set(['race', 'learn', 'yard', 'parent']);
const WHERE = new Set(['home', 'play', 'game', 'results', 'parent', 'online', 'login', 'world', 'auth', 'cert']);
const BAD_CHARS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g;
const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : undefined);

function cleanPatch(patch) {
  const out = {};
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return out;
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) { out[k] = null; continue; }
    switch (k) {
      case 'nick': if (typeof v === 'string') out.nick = cleanNick(v); break;
      case 'av': if (AVATARS.has(v)) out.av = v; break;
      case 'stage': if (STAGES.has(v)) out.stage = v; break;
      case 'where': if (WHERE.has(v)) out.where = v; break;
      case 'look': if (Array.isArray(v) && v.length === 10 && v.every(n => Number.isInteger(n) && n >= 0 && n <= 15)) out.look = v; break;
      case 'act': if (ACTS.has(v)) out.act = v; break;
      case 'race': if (typeof v === 'string' && /^[a-z0-9]{5}$/.test(v)) out.race = v; break;
      case 'host': if (typeof v === 'boolean') out.host = v; break;
      case 'phase': if (PHASES.has(v)) out.phase = v; break;
      case 'kind': if (KINDS.has(v)) out.kind = v; break;
      case 'round': { const n = num(v, 0, 1e6); if (n !== undefined) out.round = Math.floor(n); break; }
      case 'prog': { const n = num(v, 0, 1); if (n !== undefined) out.prog = n; break; }
      case 'wpm': { const n = num(v, 0, 500); if (n !== undefined) out.wpm = Math.round(n); break; }
      case 'ms': { const n = num(v, 0, 3.6e6); if (n !== undefined) out.ms = Math.round(n); break; }
      case 'acc': { const n = num(v, 0, 100); if (n !== undefined) out.acc = Math.round(n); break; }
      case 'text': if (typeof v === 'string') out.text = v.replace(BAD_CHARS, '').slice(0, 400); break;
      default: break;
    }
  }
  return out;
}

/* Trò chuyện nhanh trong Trường tiểu học: chỉ chọn câu có sẵn (CHAT_GROUPS), tuyệt đối không có ô gõ chữ.
 * Máy chủ chỉ nhận số thứ tự câu, tự ghép biệt danh (đã qua cleanNick) và con vật của người gửi rồi phát cho mọi bạn. */
const CHAT_GROUPS = [
  { name: 'Chào hỏi', items: ['Xin chào các bạn! 👋', 'Chào buổi sáng nhé! ☀️', 'Mình mới vào trường nè!', 'Tạm biệt nha! 👋'] },
  { name: 'Khen bạn', items: ['Giỏi quá! 👍', 'Hay quá! ✨', 'Chúc mừng bạn! 🎉', 'Bạn gõ nhanh ghê! ⚡', 'Cố lên nha! 💪'] },
  { name: 'Rủ chơi', items: ['Cùng chơi nha! 🎮', 'Bạn ơi, đua với mình nhé! 🏁', 'Ai chơi Chuột chũi không? 🐹', 'Mình đang học bài đây ✏️', 'Mình đang nghỉ giải lao 🌳'] },
  { name: 'Lịch sự', items: ['Cảm ơn bạn! 💖', 'Không có gì đâu! 😊', 'Xin lỗi nha! 🙏', 'Bạn dễ thương quá! 🥰'] }
];
const CHAT_LIST = CHAT_GROUPS.flatMap(g => g.items);
const chatLog = [];   // 30 câu gần nhất (trong bộ nhớ), gửi cho bạn mới vào
function handleChat(peer, id, msg, now) {
  const idx = Number.isInteger(msg.id) ? msg.id : -1;
  if (idx < 0 || idx >= CHAT_LIST.length || !peer.presence.stage) return;
  peer.chatTimes = (peer.chatTimes || []).filter(t => now - t < 60_000);
  if (now - (peer.lastChat || 0) < 1500 || peer.chatTimes.length >= 15) return;   // tối đa 1 câu mỗi 1,5 giây và 15 câu mỗi phút
  peer.lastChat = now; peer.chatTimes.push(now);
  const m = { t: 'chat', from: id, nick: cleanNick(peer.presence.nick || '') || 'Một bạn', av: peer.presence.av || '🙂', id: idx, at: now };
  chatLog.push(m); if (chatLog.length > 30) chatLog.shift();
  const s = JSON.stringify(m);
  for (const p of peers.values()) if (p.ws.readyState === 1) p.ws.send(s);
}

/* Mọi bạn đang online thấy con vật, biệt danh (đã qua cleanNick), cấp độ và đang làm gì của nhau.
 * Mã phòng và dữ liệu cuộc đua chỉ hiện cho người cùng tài khoản phụ huynh hoặc cùng phòng đua. */
const RACE_KEYS = ['race', 'host', 'round', 'phase', 'kind', 'prog', 'wpm', 'ms', 'acc', 'text'];
function visiblePresence(p, viewer) {
  const pr = p.presence;
  if (p === viewer || p.userId === viewer.userId) return pr;
  const sameRace = pr.race && viewer.presence.race && pr.race === viewer.presence.race;
  const out = { av: pr.av, nick: pr.nick, stage: pr.stage, where: pr.where, act: pr.act, look: pr.look };
  if (sameRace) { for (const k of RACE_KEYS) if (pr[k] !== undefined) out[k] = pr[k]; }
  return out;
}

let broadcastTimer = null;
function scheduleBroadcast() {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    const list = [...peers.entries()];
    for (const [id, viewer] of list) {
      if (viewer.ws.readyState !== 1) continue;
      const payload = list
        .filter(([, p]) => p.presence.stage)
        .map(([pid, p]) => ({ peer: pid, presence: visiblePresence(p, viewer), updatedAt: p.updatedAt }));
      viewer.ws.send(JSON.stringify({ t: 'peers', peers: payload }));
    }
  }, 60);
}
const races = new RaceManager(
  (peerId, msg) => { const p = peers.get(peerId); if (p && p.ws.readyState === 1) p.ws.send(JSON.stringify(msg)); },
  msg => { const s = JSON.stringify(msg); for (const p of peers.values()) if (p.ws.readyState === 1) p.ws.send(s); }
);
function disconnectUser(userId) {
  for (const p of peers.values()) if (p.userId === userId) p.ws.close(4001, 'account deleted');
}

wss.on('connection', ws => {
  const id = crypto.randomBytes(8).toString('hex');
  const peer = { ws, userId: ws.user.id, presence: {}, updatedAt: Date.now(), tokens: 40, last: Date.now() };
  peers.set(id, peer);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.send(JSON.stringify({ t: 'hello', you: id }));
  ws.send(JSON.stringify({ t: 'chat.init', groups: CHAT_GROUPS, history: chatLog }));
  ws.send(JSON.stringify({ t: 'races', list: races.listFor() }));
  scheduleBroadcast();
  ws.on('message', raw => {
    const now = Date.now();
    peer.tokens = Math.min(40, peer.tokens + (now - peer.last) / 1000 * 20);
    peer.last = now;
    if (peer.tokens < 1) return;
    peer.tokens -= 1;
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg && msg.t === 'presence') {
      const patch = cleanPatch(msg.patch);
      const next = { ...peer.presence };
      for (const [k, v] of Object.entries(patch)) { if (v === null) delete next[k]; else next[k] = v; }
      peer.presence = next;
      peer.updatedAt = now;
      scheduleBroadcast();
    } else if (msg && msg.t === 'chat') {
      handleChat(peer, id, msg, now);
    } else if (msg && typeof msg.t === 'string' && msg.t.startsWith('race.')) {
      races.handle(id, msg);
    }
  });
  ws.on('close', () => { races.leave(id, true); peers.delete(id); scheduleBroadcast(); });
  ws.on('error', () => {});
});
setInterval(() => {
  for (const p of peers.values()) {
    if (!p.ws.isAlive) { p.ws.terminate(); continue; }
    p.ws.isAlive = false;
    p.ws.ping();
  }
}, 30_000).unref();

server.listen(PORT, () => {
  console.log(`OplaKid đang chạy tại ${APP_ORIGIN} (cổng ${PORT})`);
  if (!mailer) console.log('Chưa cấu hình SMTP_URL: link “Quên mật khẩu” sẽ được in ra log thay vì gửi email.');
});
