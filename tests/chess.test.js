'use strict';
/* Kiểm tra luật cờ vua bằng perft (đếm số nước đi) trên các thế cờ chuẩn, cùng vài tình huống kết thúc ván. Chạy: node tests/chess.test.js */
const assert = require('assert');
const { Pos, bestMove } = require('../public/chess.js');

function perft(pos, d) {
  if (d === 0) return 1;
  let n = 0;
  for (const m of pos.legal()) { pos.make(m); n += perft(pos, d - 1); pos.undo(); }
  return n;
}
const CASES = [
  ['thế đầu', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', [20, 400, 8902, 197281]],
  ['Kiwipete (nhập thành, ăn tốt qua đường)', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039, 97862]],
  ['thế 3 (tàn cuộc, ăn qua đường bị chiếu)', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238]],
  ['thế 4 (phong cấp, nhập thành bị chặn)', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467]],
  ['thế 5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379]],
  ['thế 6', 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10', [46, 2079, 89890]]
];
for (const [name, fen, counts] of CASES) {
  counts.forEach((want, i) => {
    const pos = Pos.fromFEN(fen), got = perft(pos, i + 1);
    assert.strictEqual(got, want, name + ' độ sâu ' + (i + 1) + ': được ' + got + ', cần ' + want);
    assert.strictEqual(pos.fen(), fen.split(' ').slice(0, 4).join(' ') + ' ' + fen.split(' ')[4] + ' ' + fen.split(' ')[5], 'đi rồi lùi phải về đúng thế cờ ban đầu');
  });
  console.log('perft ok:', name);
}

/* kết thúc ván */
const play = (moves) => { const p = Pos.start(); for (const u of moves) { const m = p.fromUci(u); assert(m, 'nước đi sai: ' + u); p.make(m); } return p; };
assert.strictEqual(play(['f2f3', 'e7e5', 'g2g4', 'd8h4']).status(), 'checkmate', 'chiếu hết kiểu bé');
assert.strictEqual(Pos.fromFEN('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1').status(), 'stalemate', 'hết nước đi nhưng không bị chiếu');
assert.strictEqual(Pos.fromFEN('8/8/8/4k3/8/3K4/8/8 w - - 0 1').status(), 'insufficient', 'vua đấu vua');
assert.strictEqual(Pos.fromFEN('8/8/8/4k3/8/3K4/8/6R1 w - - 100 80').status(), 'fifty');
assert.strictEqual(play(['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8']).status(), 'repetition', 'lặp lại 3 lần');
{
  const p = Pos.start();
  const m = p.fromUci('e2e4'); assert.strictEqual(p.san(m), 'e4');
  const q = Pos.fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  assert.strictEqual(q.san(q.fromUci('e1g1')), 'O-O'); assert.strictEqual(q.san(q.fromUci('e1c1')), 'O-O-O');
  const r = Pos.fromFEN('7k/P7/8/8/8/8/8/K7 w - - 0 1');
  assert.strictEqual(r.san(r.fromUci('a7a8q')), 'a8=Q+');
  const d = Pos.fromFEN('4k3/8/8/8/8/8/4K3/R6R w - - 0 1');
  assert.strictEqual(d.san(d.find('a1', 'd1')), 'Rad1', 'phân biệt hai xe cùng đi được tới một ô');
}
/* nước phong cấp không có quân thì mặc định là hậu; nước đi sai bị từ chối */
{
  const p = Pos.fromFEN('7k/P7/8/8/8/8/8/K7 w - - 0 1');
  assert.strictEqual(p.find('a7', 'a8').pr, 5);
  assert.strictEqual(p.find('a7', 'a8', 'n').pr, 2);
  assert.strictEqual(Pos.start().find('e2', 'e5'), null);
  assert.strictEqual(Pos.start().find('e7', 'e5'), null, 'không đi quân của đối phương');
}
/* máy chơi: chiếu hết 1 nước, và không đi lung tung */
{
  const p = Pos.fromFEN('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1');
  const m = bestMove(p, 3); assert.strictEqual(p.uci(m), 'a1a8', 'máy khó phải thấy chiếu hết 1 nước');
  const s = Pos.start(); const t0 = Date.now();
  for (let i = 0; i < 6; i++) { const mv = bestMove(s, 3); assert(mv); s.make(mv); const mv2 = bestMove(s, 1); assert(mv2); s.make(mv2); }
  console.log('máy chơi 12 nước hết', Date.now() - t0, 'ms');
}
console.log('chess OK');
