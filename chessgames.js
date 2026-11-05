'use strict';
/*
 * Cờ vua trực tuyến giữa hai bạn. Máy chủ giữ bàn cờ, tự kiểm tra từng nước đi (dùng chung bộ luật với trình duyệt
 * trong public/chess.js), giữ đồng hồ và quyết định kết quả. Không có trò chuyện tự do, chỉ có lời mời trong khung chat nhanh.
 */
const crypto = require('crypto');
const { Pos } = require('./public/chess.js');

const TCS = new Set([0, 5, 10, 15]);       // số phút mỗi bên; 0 là không tính giờ
const WAIT_MAX_MS = 5 * 60_000;            // chờ bạn quá 5 phút thì huỷ
const KEEP_DONE_MS = 60_000;
const MAX_MOVES = 600;

class ChessManager {
  /* send(peerId, msg); onRoom(peerId, info) gửi lời mời vào chat; who(peerId) trả về {nick, av} đã được lọc */
  constructor(send, onRoom, who, broadcastAll) {
    this.send = send;
    this.broadcastAll = broadcastAll || (() => {});
    this.listDirty = false;
    this.onRoom = onRoom || (() => {});
    this.who = who || (() => ({ nick: 'Bạn nhỏ', av: '🐯' }));
    this.games = new Map();
    this.byPeer = new Map();
    this.dirty = new Set();
    this.timer = setInterval(() => this.tick(), 500);
    this.timer.unref();
  }
  gameOf(peerId) { const id = this.byPeer.get(peerId); return id ? this.games.get(id) : null; }
  isOpen(id) { const g = this.games.get(id); return !!g && g.status === 'waiting'; }
  newGame(peerId, tc) {
    const id = crypto.randomBytes(6).toString('hex');
    const g = { id, status: 'waiting', tc, base: tc * 60_000, host: peerId, white: null, black: null, pos: Pos.start(), moves: [], sans: [],
      clock: { w: tc * 60_000, b: tc * 60_000 }, turnStart: 0, drawOffer: null, result: null, lastMove: null, createdAt: Date.now(), doneAt: 0 };
    this.games.set(id, g);
    this.byPeer.set(peerId, id);
    this.listDirty = true;
    return g;
  }
  start(g, a, b) {
    const whiteFirst = crypto.randomInt(2) === 0;
    const w = whiteFirst ? a : b, k = whiteFirst ? b : a;
    g.white = { pid: w, ...this.who(w) };
    g.black = { pid: k, ...this.who(k) };
    g.status = 'playing';
    this.listDirty = true;
    g.turnStart = Date.now();
    this.byPeer.set(b, g.id);
    this.touch(g);
  }
  sideOf(g, pid) { return g.white && g.white.pid === pid ? 'w' : g.black && g.black.pid === pid ? 'b' : null; }
  /* thời gian còn lại của mỗi bên ở thời điểm now */
  clocks(g, now) {
    const c = { w: g.clock.w, b: g.clock.b };
    if (g.status === 'playing' && g.base) { const mover = g.pos.turn === 1 ? 'w' : 'b'; c[mover] = Math.max(0, c[mover] - (now - g.turnStart)); }
    return c;
  }
  finish(g, winner, reason) {
    if (g.status === 'over') return;
    const now = Date.now();
    g.clock = this.clocks(g, now);
    g.status = 'over'; g.doneAt = now; g.drawOffer = null;
    g.result = { winner, reason };
    this.touch(g);
  }
  leave(peerId) {
    const g = this.gameOf(peerId);
    this.byPeer.delete(peerId);
    if (!g) return;
    if (g.status === 'waiting') { this.remove(g); return; }
    if (g.status === 'playing') {
      const side = this.sideOf(g, peerId);
      if (side) this.finish(g, side === 'w' ? 'b' : 'w', 'abandoned');
    }
  }
  remove(g) {
    if (g.status === 'waiting') this.listDirty = true;
    this.games.delete(g.id);
    for (const p of [g.host, g.white && g.white.pid, g.black && g.black.pid]) if (p && this.byPeer.get(p) === g.id) this.byPeer.delete(p);
  }
  join(g, peerId) {
    if (!g || g.status !== 'waiting') return 'Ván cờ này đã bắt đầu hoặc đã kết thúc rồi.';
    if (g.host === peerId) return null;
    this.start(g, g.host, peerId);
    return null;
  }

  handle(peerId, msg) {
    const err = text => this.send(peerId, { t: 'chess.error', text });
    switch (msg.t) {
      case 'chess.quick':
      case 'chess.create': {
        const tc = TCS.has(msg.tc) ? msg.tc : 10;
        const mine = this.gameOf(peerId);
        if (mine && mine.status === 'playing') return err('Em đang chơi một ván cờ rồi.');
        if (mine && mine.status === 'waiting') { this.touch(mine); return; }
        const open = [...this.games.values()].find(g => g.status === 'waiting' && g.tc === tc && g.host !== peerId);
        if (open) { const e = this.join(open, peerId); if (e) err(e); return; }
        const g = this.newGame(peerId, tc);
        this.touch(g);
        this.onRoom(peerId, { game: 'chess', id: g.id, tc });
        return;
      }
      case 'chess.join': {
        const mine = this.gameOf(peerId);
        if (mine && mine.status === 'playing') return err('Em đang chơi một ván cờ rồi.');
        const g = typeof msg.id === 'string' ? this.games.get(msg.id) : null;
        if (!g || g.status !== 'waiting') return err('Ván cờ này đã bắt đầu hoặc đã kết thúc rồi.');
        if (mine && mine.status === 'waiting' && mine !== g) this.leave(peerId);
        const e = this.join(g, peerId); if (e) err(e);
        return;
      }
      case 'chess.cancel': case 'chess.leave': this.leave(peerId); this.send(peerId, { t: 'chess.left' }); return;
      case 'chess.move': {
        const g = this.gameOf(peerId);
        if (!g || g.status !== 'playing') return;
        const side = this.sideOf(g, peerId);
        if (!side || (g.pos.turn === 1) !== (side === 'w')) return;
        const now = Date.now(), clk = this.clocks(g, now);
        if (g.base && clk[side] <= 0) return this.finish(g, side === 'w' ? 'b' : 'w', 'timeout');
        if (typeof msg.from !== 'string' || typeof msg.to !== 'string' || !/^[a-h][1-8]$/.test(msg.from) || !/^[a-h][1-8]$/.test(msg.to)) return;
        const m = g.pos.find(msg.from, msg.to, typeof msg.pr === 'string' ? msg.pr : undefined);
        if (!m) return err('Nước đi này không đúng luật.');
        g.sans.push(g.pos.san(m));
        g.pos.make(m);
        g.moves.push(g.pos.uci(m));
        g.lastMove = { from: msg.from, to: msg.to };
        g.clock = clk; g.turnStart = now; g.drawOffer = null;
        const st = g.pos.status();
        if (st === 'checkmate') this.finish(g, side, 'checkmate');
        else if (st) this.finish(g, 'd', st);
        else if (g.moves.length >= MAX_MOVES) this.finish(g, 'd', 'fifty');
        else this.touch(g);
        return;
      }
      case 'chess.resign': {
        const g = this.gameOf(peerId), side = g && this.sideOf(g, peerId);
        if (g && g.status === 'playing' && side) this.finish(g, side === 'w' ? 'b' : 'w', 'resign');
        return;
      }
      case 'chess.draw': {
        const g = this.gameOf(peerId), side = g && this.sideOf(g, peerId);
        if (!g || g.status !== 'playing' || !side) return;
        if (msg.a === 'offer') { if (!g.drawOffer && g.moves.length >= 2) { g.drawOffer = side; this.touch(g); } }
        else if (msg.a === 'accept') { if (g.drawOffer && g.drawOffer !== side) this.finish(g, 'd', 'agreed'); }
        else if (msg.a === 'decline') { if (g.drawOffer && g.drawOffer !== side) { g.drawOffer = null; this.touch(g); } }
        return;
      }
      default: return;
    }
  }

  touch(g) { this.dirty.add(g.id); }
  tick() {
    const now = Date.now();
    for (const g of this.games.values()) {
      if (g.status === 'waiting' && now - g.createdAt > WAIT_MAX_MS) { this.send(g.host, { t: 'chess.left', why: 'wait' }); this.remove(g); continue; }
      if (g.status === 'playing' && g.base) {
        const mover = g.pos.turn === 1 ? 'w' : 'b';
        if (this.clocks(g, now)[mover] <= 0) this.finish(g, mover === 'w' ? 'b' : 'w', 'timeout');
      }
      if (g.status === 'over' && now - g.doneAt > KEEP_DONE_MS) this.remove(g);
    }
    for (const id of this.dirty) { const g = this.games.get(id); if (g) this.push(g); }
    this.dirty.clear();
    if (this.listDirty) { this.listDirty = false; this.broadcastAll({ t: 'chess.open', list: this.openList() }); }
  }
  openList() {
    return [...this.games.values()].filter(g => g.status === 'waiting').slice(0, 20).map(g => ({ id: g.id, tc: g.tc, ...this.who(g.host) }));
  }
  push(g) {
    const now = Date.now();
    const pids = new Set([g.host, g.white && g.white.pid, g.black && g.black.pid].filter(Boolean));
    for (const pid of pids) if (this.byPeer.get(pid) === g.id) this.send(pid, { t: 'chess', g: this.view(g, pid, now) });
  }
  view(g, pid, now) {
    const pub = p => (p ? { nick: p.nick, av: p.av } : null);
    return {
      id: g.id, status: g.status, tc: g.tc, you: this.sideOf(g, pid), host: g.host === pid,
      white: pub(g.white), black: pub(g.black), moves: g.moves, sans: g.sans,
      turn: g.pos.turn === 1 ? 'w' : 'b', clocks: this.clocks(g, now), drawOffer: g.drawOffer, result: g.result, lastMove: g.lastMove
    };
  }
}

module.exports = { ChessManager, TCS };
