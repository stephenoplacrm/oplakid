'use strict';
/* Kiểm tra kho câu hỏi Lớp học chữ (public/lop-hoc-chu.txt): đúng khuôn dạng, không lộ đáp án trong gợi ý, đủ câu cho từng mức. Chạy: node tests/lopchu.test.js */
const assert = require('assert');
const fs = require('fs');
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const txt = fs.readFileSync(__dirname + '/../public/lop-hoc-chu.txt', 'utf8');
const topics = []; let cur = null;
for (const ln of txt.split('\n')) {
  if (ln.startsWith('//')) continue;
  if (ln.startsWith('# ')) { cur = { name: ln.slice(2).trim(), noun: '', items: [] }; topics.push(cur); }
  else if (ln.startsWith('>') && cur) cur.noun = ln.slice(1).trim();
  else if (cur && ln.includes('|')) { const p = ln.split('|').map(x => x.trim()); cur.items.push({ a: p[0], h: p[1], l: +p[2], alt: (p[3] || '').split(',').map(x => x.trim()).filter(Boolean) }); }
}
const seen = new Set();
let total = 0;
for (const t of topics) {
  assert(t.noun, 'chủ đề thiếu dòng ">": ' + t.name);
  for (const it of t.items) {
    total++;
    const L = it.a.replace(/\s+/g, '').length;
    assert(it.a === it.a.toUpperCase(), 'đáp án phải viết hoa: ' + it.a);
    assert(L >= 2 && L <= 16, 'độ dài đáp án: ' + it.a);
    assert(it.h && it.h.length <= 120, 'gợi ý trống hoặc quá dài: ' + it.a);
    assert([1, 2, 3].includes(it.l), 'độ khó 1 đến 3: ' + it.a);
    assert(!fold(it.h).replace(/[^a-z0-9]/g, '').includes(fold(it.a).replace(/[^a-z0-9]/g, '')), 'gợi ý lộ đáp án: ' + it.a);
    const key = t.name + '|' + it.a; assert(!seen.has(key), 'trùng câu: ' + key); seen.add(key);
  }
}
const vi = topics.filter(t => !t.name.startsWith('Tiếng Anh')).flatMap(t => t.items), en = topics.filter(t => t.name.startsWith('Tiếng Anh')).flatMap(t => t.items);
for (const l of [1, 2, 3]) {
  assert(vi.filter(i => i.l === l).length >= 40, 'tiếng Việt mức ' + l + ' còn ít câu');
  assert(en.filter(i => i.l === l).length >= 10, 'tiếng Anh mức ' + l + ' còn ít câu');
}
console.log('Lớp học chữ OK:', total, 'câu,', topics.length, 'chủ đề; tiếng Việt', vi.length, ', tiếng Anh', en.length);
