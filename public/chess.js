/* Cờ vua cho OplaKid: luật chơi, máy chơi cờ và ghi nước đi.
 * Dùng chung cho trình duyệt (window.OplaChess) và máy chủ (require) để máy chủ tự kiểm tra từng nước đi.
 * Quân cờ: 1 tốt, 2 mã, 3 tượng, 4 xe, 5 hậu, 6 vua. Quân trắng là số dương, quân đen là số âm.
 * Ô cờ đánh số 0 đến 63: 0 là a8, 7 là h8, 56 là a1, 63 là h1. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OplaChess = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
  const FILES = 'abcdefgh';
  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const sqName = i => FILES[i & 7] + (8 - (i >> 3));
  const sqIdx = s => (8 - Number(s[1])) * 8 + FILES.indexOf(s[0]);
  const LETTER = ' PNBRQK';
  const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const ORTHO = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  class Pos {
    constructor() {
      this.b = new Int8Array(64);
      this.turn = 1; this.cr = 0; this.ep = -1; this.half = 0; this.full = 1;
      this.stack = []; this.keys = [];
    }
    static fromFEN(fen) {
      const p = new Pos(), parts = String(fen).trim().split(/\s+/);
      if (parts.length < 4) throw new Error('FEN sai');
      let i = 0;
      for (const ch of parts[0]) {
        if (ch === '/') continue;
        if (/\d/.test(ch)) { i += Number(ch); continue; }
        const t = LETTER.indexOf(ch.toUpperCase());
        if (t < 1 || i > 63) throw new Error('FEN sai');
        p.b[i++] = ch === ch.toUpperCase() ? t : -t;
      }
      if (i !== 64) throw new Error('FEN sai');
      p.turn = parts[1] === 'b' ? -1 : 1;
      p.cr = (parts[2].includes('K') ? 1 : 0) | (parts[2].includes('Q') ? 2 : 0) | (parts[2].includes('k') ? 4 : 0) | (parts[2].includes('q') ? 8 : 0);
      p.ep = parts[3] === '-' ? -1 : sqIdx(parts[3]);
      p.half = Number(parts[4]) || 0; p.full = Number(parts[5]) || 1;
      p.keys = [p.key()];
      return p;
    }
    static start() { return Pos.fromFEN(START_FEN); }
    fen() {
      let s = '';
      for (let r = 0; r < 8; r++) {
        let e = 0;
        for (let f = 0; f < 8; f++) {
          const v = this.b[r * 8 + f];
          if (!v) { e++; continue; }
          if (e) { s += e; e = 0; }
          const c = LETTER[Math.abs(v)];
          s += v > 0 ? c : c.toLowerCase();
        }
        if (e) s += e;
        if (r < 7) s += '/';
      }
      const cr = (this.cr & 1 ? 'K' : '') + (this.cr & 2 ? 'Q' : '') + (this.cr & 4 ? 'k' : '') + (this.cr & 8 ? 'q' : '');
      return s + ' ' + (this.turn === 1 ? 'w' : 'b') + ' ' + (cr || '-') + ' ' + (this.ep < 0 ? '-' : sqName(this.ep)) + ' ' + this.half + ' ' + this.full;
    }
    kingSq(side) { const k = K * side; for (let i = 0; i < 64; i++) if (this.b[i] === k) return i; return -1; }
    /* ô sq có bị quân bên "by" (1 hoặc -1) đang chiếu không */
    attacked(sq, by) {
      const b = this.b, r = sq >> 3, f = sq & 7;
      const pr = r + (by === 1 ? 1 : -1);   // tốt của bên "by" đứng ở hàng này thì ăn được ô sq
      if (pr >= 0 && pr < 8) {
        if (f > 0 && b[pr * 8 + f - 1] === P * by) return true;
        if (f < 7 && b[pr * 8 + f + 1] === P * by) return true;
      }
      for (const [dr, dc] of KNIGHT) { const rr = r + dr, cc = f + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === N * by) return true; }
      for (const [dr, dc] of KING) { const rr = r + dr, cc = f + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === K * by) return true; }
      for (const [dr, dc] of DIAG) {
        let rr = r + dr, cc = f + dc;
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const v = b[rr * 8 + cc]; if (v) { if (v === B * by || v === Q * by) return true; break; } rr += dr; cc += dc; }
      }
      for (const [dr, dc] of ORTHO) {
        let rr = r + dr, cc = f + dc;
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const v = b[rr * 8 + cc]; if (v) { if (v === R * by || v === Q * by) return true; break; } rr += dr; cc += dc; }
      }
      return false;
    }
    inCheck(side) { side = side || this.turn; const k = this.kingSq(side); return k >= 0 && this.attacked(k, -side); }
    /* các nước đi chưa kiểm tra vua có bị chiếu không; capt = chỉ các nước ăn quân và phong cấp */
    gen(capt) {
      const out = [], b = this.b, me = this.turn;
      const add = (f, t, pc, cap, pr, fl) => out.push({ f, t, pc, cap, pr: pr || 0, fl: fl || 0 });
      for (let i = 0; i < 64; i++) {
        const v = b[i];
        if (!v || (v > 0 ? 1 : -1) !== me) continue;
        const pc = Math.abs(v), r = i >> 3, f = i & 7;
        if (pc === P) {
          const dir = me === 1 ? -1 : 1, start = me === 1 ? 6 : 1, last = me === 1 ? 0 : 7, r1 = r + dir;
          if (r1 < 0 || r1 > 7) continue;
          if (!b[r1 * 8 + f] && (!capt || r1 === last)) {
            if (r1 === last) for (const pr of [Q, R, B, N]) add(i, r1 * 8 + f, P, 0, pr);
            else {
              add(i, r1 * 8 + f, P, 0);
              if (r === start && !b[(r + 2 * dir) * 8 + f]) add(i, (r + 2 * dir) * 8 + f, P, 0, 0, 1);   // đi hai ô
            }
          }
          for (const dc of [-1, 1]) {
            const cc = f + dc; if (cc < 0 || cc > 7) continue;
            const t = r1 * 8 + cc, tv = b[t];
            if (tv && (tv > 0 ? 1 : -1) !== me) {
              if (r1 === last) for (const pr of [Q, R, B, N]) add(i, t, P, Math.abs(tv), pr);
              else add(i, t, P, Math.abs(tv));
            } else if (t === this.ep && !tv) add(i, t, P, P, 0, 2);   // ăn tốt qua đường
          }
        } else if (pc === N || pc === K) {
          for (const [dr, dc] of (pc === N ? KNIGHT : KING)) {
            const rr = r + dr, cc = f + dc; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
            const t = rr * 8 + cc, tv = b[t];
            if (!tv) { if (!capt) add(i, t, pc, 0); }
            else if ((tv > 0 ? 1 : -1) !== me) add(i, t, pc, Math.abs(tv));
          }
          if (pc === K && !capt) {   // nhập thành
            const row = me === 1 ? 7 : 0;
            if (i === row * 8 + 4 && !this.attacked(i, -me)) {
              const kbit = me === 1 ? 1 : 4, qbit = me === 1 ? 2 : 8;
              if ((this.cr & kbit) && !b[row * 8 + 5] && !b[row * 8 + 6] && b[row * 8 + 7] === R * me &&
                !this.attacked(row * 8 + 5, -me) && !this.attacked(row * 8 + 6, -me)) add(i, row * 8 + 6, K, 0, 0, 3);
              if ((this.cr & qbit) && !b[row * 8 + 3] && !b[row * 8 + 2] && !b[row * 8 + 1] && b[row * 8] === R * me &&
                !this.attacked(row * 8 + 3, -me) && !this.attacked(row * 8 + 2, -me)) add(i, row * 8 + 2, K, 0, 0, 4);
            }
          }
        } else {
          const dirs = pc === B ? DIAG : pc === R ? ORTHO : DIAG.concat(ORTHO);
          for (const [dr, dc] of dirs) {
            let rr = r + dr, cc = f + dc;
            while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
              const t = rr * 8 + cc, tv = b[t];
              if (!tv) { if (!capt) add(i, t, pc, 0); }
              else { if ((tv > 0 ? 1 : -1) !== me) add(i, t, pc, Math.abs(tv)); break; }
              rr += dr; cc += dc;
            }
          }
        }
      }
      return out;
    }
    make(m) {
      const b = this.b, me = this.turn;
      this.stack.push({ m, cr: this.cr, ep: this.ep, half: this.half, full: this.full });
      b[m.t] = m.pr ? m.pr * me : b[m.f];
      b[m.f] = 0;
      if (m.fl === 2) b[m.t + (me === 1 ? 8 : -8)] = 0;
      else if (m.fl === 3) { b[m.t - 1] = b[m.t + 1]; b[m.t + 1] = 0; }
      else if (m.fl === 4) { b[m.t + 1] = b[m.t - 2]; b[m.t - 2] = 0; }
      this.ep = m.fl === 1 ? (m.f + m.t) >> 1 : -1;
      if (m.pc === K) this.cr &= me === 1 ? ~3 : ~12;
      const touch = i => { if (i === 63) this.cr &= ~1; else if (i === 56) this.cr &= ~2; else if (i === 7) this.cr &= ~4; else if (i === 0) this.cr &= ~8; };
      touch(m.f); touch(m.t);
      this.half = (m.pc === P || m.cap) ? 0 : this.half + 1;
      if (me === -1) this.full++;
      this.turn = -me;
      this.keys.push(this.key());
    }
    undo() {
      const u = this.stack.pop(), m = u.m, b = this.b, me = -this.turn;
      this.turn = me; this.cr = u.cr; this.ep = u.ep; this.half = u.half; this.full = u.full;
      this.keys.pop();
      b[m.f] = m.pr ? P * me : b[m.t];
      if (m.fl === 2) { b[m.t] = 0; b[m.t + (me === 1 ? 8 : -8)] = -P * me; }
      else {
        b[m.t] = m.cap ? -m.cap * me : 0;
        if (m.fl === 3) { b[m.t + 1] = b[m.t - 1]; b[m.t - 1] = 0; }
        else if (m.fl === 4) { b[m.t - 2] = b[m.t + 1]; b[m.t + 1] = 0; }
      }
    }
    legal(capt) {
      const out = [], me = this.turn;
      for (const m of this.gen(capt)) {
        this.make(m);
        const k = this.kingSq(me);
        if (k >= 0 && !this.attacked(k, -me)) out.push(m);
        this.undo();
      }
      return out;
    }
    /* khoá của thế cờ, dùng để đếm lặp lại */
    key() {
      let epk = -1;
      if (this.ep >= 0) {
        const r = this.ep >> 3, f = this.ep & 7, pr = r + (this.turn === 1 ? 1 : -1);
        if ((f > 0 && this.b[pr * 8 + f - 1] === P * this.turn) || (f < 7 && this.b[pr * 8 + f + 1] === P * this.turn)) epk = this.ep;
      }
      return this.b.join(',') + '|' + this.turn + '|' + this.cr + '|' + epk;
    }
    insufficient() {
      const minors = [];
      for (let i = 0; i < 64; i++) {
        const a = Math.abs(this.b[i]);
        if (!a || a === K) continue;
        if (a === P || a === R || a === Q) return false;
        minors.push([a, (i >> 3) + (i & 7) & 1, this.b[i] > 0 ? 1 : -1]);
      }
      if (minors.length <= 1) return true;
      if (minors.every(x => x[0] === B) && minors.every(x => x[1] === minors[0][1])) return true;   // các tượng cùng màu ô
      return false;
    }
    repetitions() { const k = this.keys[this.keys.length - 1]; let n = 0; for (const x of this.keys) if (x === k) n++; return n; }
    /* null nếu ván còn tiếp tục */
    status() {
      const ms = this.legal();
      if (!ms.length) return this.inCheck() ? 'checkmate' : 'stalemate';
      if (this.insufficient()) return 'insufficient';
      if (this.half >= 100) return 'fifty';
      if (this.repetitions() >= 3) return 'repetition';
      return null;
    }
    uci(m) { return sqName(m.f) + sqName(m.t) + (m.pr ? LETTER[m.pr].toLowerCase() : ''); }
    /* tìm nước đi hợp lệ theo ô đi, ô đến và quân phong cấp (mặc định hậu) */
    find(from, to, pr) {
      const f = typeof from === 'string' ? sqIdx(from) : from, t = typeof to === 'string' ? sqIdx(to) : to;
      const ps = typeof pr === 'string' ? LETTER.indexOf(pr.toUpperCase()) : pr;
      return this.legal().find(m => m.f === f && m.t === t && (!m.pr || m.pr === (ps || Q))) || null;
    }
    fromUci(s) { s = String(s); return this.find(s.slice(0, 2), s.slice(2, 4), s[4] || 0); }
    /* ghi nước đi kiểu thường dùng (e4, Nf3, O-O, exd5, e8=Q+); gọi trước khi đi nước đó */
    san(m) {
      let s;
      if (m.fl === 3) s = 'O-O';
      else if (m.fl === 4) s = 'O-O-O';
      else {
        const dest = sqName(m.t);
        if (m.pc === P) s = (m.cap ? FILES[m.f & 7] + 'x' : '') + dest + (m.pr ? '=' + LETTER[m.pr] : '');
        else {
          const others = this.legal().filter(o => o.pc === m.pc && o.t === m.t && o.f !== m.f);
          let dis = '';
          if (others.length) {
            if (!others.some(o => (o.f & 7) === (m.f & 7))) dis = FILES[m.f & 7];
            else if (!others.some(o => (o.f >> 3) === (m.f >> 3))) dis = String(8 - (m.f >> 3));
            else dis = sqName(m.f);
          }
          s = LETTER[m.pc] + dis + (m.cap ? 'x' : '') + dest;
        }
      }
      this.make(m);
      const st = this.legal().length ? (this.inCheck() ? '+' : '') : (this.inCheck() ? '#' : '');
      this.undo();
      return s + st;
    }
    copy() { return Pos.fromFEN(this.fen()); }
  }

  /* ---------- máy chơi cờ ---------- */
  const VAL = [0, 100, 320, 330, 500, 900, 0];
  const CENTER = (() => { const a = []; for (let i = 0; i < 64; i++) { const r = i >> 3, f = i & 7; a.push(3 - Math.max(Math.abs(r - 3.5), Math.abs(f - 3.5)) + 0.5); } return a; })();
  function evaluate(pos) {   // điểm theo góc nhìn của bên đang đi
    let s = 0, men = 0;
    for (let i = 0; i < 64; i++) { const v = pos.b[i]; if (v && Math.abs(v) !== K && Math.abs(v) !== P) men++; }
    for (let i = 0; i < 64; i++) {
      const v = pos.b[i]; if (!v) continue;
      const a = Math.abs(v), side = v > 0 ? 1 : -1, r = i >> 3, rel = side === 1 ? 7 - r : r;   // rel: số hàng đã tiến
      let x = VAL[a];
      if (a === P) x += rel * 7 + CENTER[i] * 4 + (rel === 6 ? 40 : 0);
      else if (a === N || a === B) x += CENTER[i] * 9 - (rel === 0 ? 12 : 0);
      else if (a === R) x += rel === 6 ? 25 : 0;
      else if (a === Q) x += CENTER[i] * 2;
      else if (a === K) x += men > 4 ? (rel === 0 ? 12 : -rel * 10) : CENTER[i] * 12;
      s += side * x;
    }
    return pos.turn * s;
  }
  const LEVELS = { 1: { depth: 1, noise: 160, q: false }, 2: { depth: 2, noise: 30, q: true }, 3: { depth: 3, noise: 0, q: true } };
  function order(ms) {
    return ms.map(m => [m, (m.cap ? 10 * VAL[m.cap] - VAL[m.pc] + 1000 : 0) + (m.pr ? 800 : 0)]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  }
  /* chọn nước đi cho bên đang đi. level 1 đến 3. Trả về nước đi (hoặc null nếu hết nước). */
  function bestMove(pos, level, opts) {
    opts = opts || {};
    const cfg = LEVELS[level] || LEVELS[2], rnd = opts.random || Math.random;
    const root = order(pos.legal());
    if (!root.length) return null;
    if (root.length === 1) return root[0];
    let nodes = 0, abort = false;
    const NODE_CAP = opts.nodeCap || 250000;
    function quiesce(alpha, beta, ply) {
      if (++nodes > NODE_CAP) { abort = true; return 0; }
      const stand = evaluate(pos);
      if (stand >= beta) return beta;
      if (stand > alpha) alpha = stand;
      if (ply > 6) return alpha;
      for (const m of order(pos.legal(true))) {
        pos.make(m);
        const sc = -quiesce(-beta, -alpha, ply + 1);
        pos.undo();
        if (abort) return 0;
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }
    function search(depth, alpha, beta, ply) {
      if (++nodes > NODE_CAP) { abort = true; return 0; }
      if (pos.half >= 100 || pos.repetitions() >= 2) return 0;
      const ms = pos.legal();
      if (!ms.length) return pos.inCheck() ? -30000 + ply : 0;
      if (depth <= 0) return cfg.q ? quiesce(alpha, beta, 0) : evaluate(pos);
      for (const m of order(ms)) {
        pos.make(m);
        const sc = -search(depth - 1, -beta, -alpha, ply + 1);
        pos.undo();
        if (abort) return 0;
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }
    let scored = root.map(m => [m, 0]);
    for (let d = 1; d <= cfg.depth; d++) {
      const cur = [];
      for (const [m] of scored) {   // mỗi nước gốc tìm đủ cửa sổ để điểm các nước so sánh được với nhau
        pos.make(m);
        const sc = -search(d - 1, -Infinity, Infinity, 1);
        pos.undo();
        if (abort) break;
        cur.push([m, sc]);
      }
      if (abort) break;
      scored = cur.sort((a, b) => b[1] - a[1]);
    }
    if (cfg.noise) scored = scored.map(([m, s]) => [m, s + (rnd() * 2 - 1) * cfg.noise]).sort((a, b) => b[1] - a[1]);
    else {   // nước ngang điểm thì chọn ngẫu nhiên cho đỡ nhàm
      const top = scored[0][1], eq = scored.filter(x => x[1] >= top - 1);
      return eq[Math.floor(rnd() * eq.length)][0];
    }
    return scored[0][0];
  }

  const REASONS = {
    checkmate: 'chiếu hết', stalemate: 'hết nước đi (hoà cờ)', insufficient: 'không đủ quân để chiếu hết',
    fifty: 'luật 50 nước', repetition: 'lặp lại 3 lần', timeout: 'hết giờ', resign: 'đầu hàng', agreed: 'hai bên đồng ý hoà', abandoned: 'bạn kia đã rời ván'
  };
  return { Pos, bestMove, evaluate, sqName, sqIdx, START_FEN, REASONS, PIECES: { P, N, B, R, Q, K } };
});
