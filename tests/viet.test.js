'use strict';
/* Kiểm tra kho chữ tiếng Việt và bộ gõ Telex: node tests/viet.test.js */
const assert = require('assert');
const T = require('../public/telex.js');
const V = require('../public/vi.js');

const all = [];
(function walk(o, path) {
  if (typeof o === 'string') all.push([path, o]);
  else if (Array.isArray(o)) o.forEach(x => walk(x, path));
  else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => walk(v, path + '.' + k));
})(V, 'VI');

let bad = 0;
for (const [path, text] of all) {
  const info = T.toInfo(text);
  const back = T.compose(info.k);
  if (back !== text.normalize('NFC')) { bad++; console.error('Gõ Telex không ra đúng chữ:', path, JSON.stringify(text), '→', info.k, '→', back); }
  if (info.cum.length !== Array.from(info.t).length) { bad++; console.error('cum sai độ dài:', path, text); }
}
assert.strictEqual(bad, 0, bad + ' chuỗi sai');

/* mỗi nhóm bài theo dấu phải có đủ từ (ít nhất 8) */
const pool = [...new Set([].concat(Object.values(V.topics).flat(), V.extra, V.words2))];
const L = T.letters;
const feats = {
  'â': l => l.b === 'a' && l.mod === '^', 'ê': l => l.b === 'e' && l.mod === '^', 'ô': l => l.b === 'o' && l.mod === '^',
  'ă': l => l.b === 'a' && l.mod === '(', 'ơ': l => l.b === 'o' && l.mod === '+', 'ư': l => l.b === 'u' && l.mod === '+', 'đ': l => l.mod === '-',
  'sắc': l => l.tone === '́', 'huyền': l => l.tone === '̀', 'hỏi': l => l.tone === '̉', 'ngã': l => l.tone === '̃', 'nặng': l => l.tone === '̣'
};
for (const [name, f] of Object.entries(feats)) assert.ok(pool.filter(w => L(w).some(f)).length >= 8, 'Thiếu từ cho nhóm ' + name);

/* vài ví dụ cố định */
assert.strictEqual(T.toInfo('Việt').k, 'Vieetj');
assert.strictEqual(T.toInfo('đường').k, 'dduwowngf');
assert.strictEqual(T.compose('tieengs'), 'tiếng');
assert.strictEqual(T.compose('hoaf'), 'hòa');
assert.strictEqual(T.compose('Nguwowif'), 'Người');
console.log('OK:', all.length, 'chuỗi tiếng Việt gõ đúng bằng Telex.');
