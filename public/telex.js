'use strict';
/*
 * Telex cho các bài gõ tiếng Việt. Ứng dụng tự ghép chữ nên bé tắt bộ gõ tiếng Việt (Unikey, EVKey) của máy.
 *   toInfo(text)  : đổi chữ tiếng Việt thành dãy phím Telex cần gõ (k) và, cho từng chữ trên màn hình, số phím cần gõ xong để chữ đó hoàn thành (cum).
 *   compose(keys) : ghép dãy phím Telex bé đã gõ thành chữ tiếng Việt (để hiện "Em đang gõ").
 * Quy ước gõ: aa=â, aw=ă, ee=ê, oo=ô, ow=ơ, uw=ư, dd=đ; dấu thanh gõ ở cuối tiếng: s=sắc, f=huyền, r=hỏi, x=ngã, j=nặng.
 * Đặt dấu thanh như bộ gõ Unikey mặc định (hòa, khỏe, thủy).
 */
(function (root) {
  var TONE_KEY = { '́': 's', '̀': 'f', '̉': 'r', '̃': 'x', '̣': 'j' };
  var KEY_TONE = { s: '́', f: '̀', r: '̉', x: '̃', j: '̣' };
  var MARK = { '̂': '^', '̆': '(', '̛': '+' };            // mũ (â ê ô), trăng (ă), móc (ơ ư)
  var VOWELS = 'aeiouy';
  var isLetter = function (c) { return /\p{L}/u.test(c); };

  /* Tách một chữ cái tiếng Việt thành chữ gốc, dấu phụ và dấu thanh */
  function split(ch) {
    if (ch === 'đ') return { b: 'd', mod: '-', tone: '', up: false };
    if (ch === 'Đ') return { b: 'd', mod: '-', tone: '', up: true };
    var d = ch.normalize('NFD'), base = d[0], mod = '', tone = '';
    for (var i = 1; i < d.length; i++) { if (MARK[d[i]]) mod = MARK[d[i]]; else if (TONE_KEY[d[i]]) tone = d[i]; }
    return { b: base.toLowerCase(), mod: mod, tone: tone, up: base !== base.toLowerCase() };
  }
  /* Các phím cần gõ cho một chữ (chưa tính dấu thanh) */
  function keysOf(p, lowerMods) {
    var b = p.up ? p.b.toUpperCase() : p.b, m = lowerMods ? '' : '';
    var mk = function (c) { return p.up && !lowerMods ? c.toUpperCase() : c; };
    if (p.mod === '^') return b + mk(p.b);
    if (p.mod === '(') return b + mk('w');
    if (p.mod === '+') return b + mk('w');
    if (p.mod === '-') return b + mk('d');
    return b + m;
  }

  function toInfo(text) {
    text = String(text).normalize('NFC');
    var k = '', cum = [], i = 0, chars = Array.from(text);
    while (i < chars.length) {
      if (!isLetter(chars[i])) { k += chars[i]; cum.push(k.length); i++; continue; }
      var j = i; while (j < chars.length && isLetter(chars[j])) j++;
      var run = chars.slice(i, j), parts = run.map(split), allUp = run.length > 1 && parts.every(function (p) { return p.up; });
      var ends = [], toneKey = '', toneAt = -1, kk = '';
      parts.forEach(function (p, n) {
        kk += keysOf(p, !allUp ? true : false);
        if (allUp) { /* cả tiếng viết hoa: phím phụ cũng viết hoa */ }
        ends.push(kk.length);
        if (p.tone) { toneKey = TONE_KEY[p.tone]; toneAt = n; }
      });
      var tail = toneKey ? (allUp ? toneKey.toUpperCase() : toneKey) : '';
      var base = k.length, total = base + kk.length + tail.length;
      parts.forEach(function (p, n) { cum.push(n === toneAt ? total : base + ends[n]); });
      k += kk + tail; i = j;
    }
    return { k: k, cum: cum, t: text };
  }

  /* Ghép phím Telex thành chữ */
  function compose(keys) {
    var out = '', syl = [], tone = '';
    function flush() {
      if (!syl.length) { tone = ''; return; }
      var idx = toneIndex(syl);
      out += syl.map(function (s, n) { return glyph(s, n === idx ? tone : ''); }).join('');
      syl = []; tone = '';
    }
    function hasVowel() { return syl.some(function (s) { return s.mod !== '-' && VOWELS.indexOf(s.b) >= 0; }); }
    Array.from(String(keys)).forEach(function (c) {
      if (!isLetter(c)) { flush(); out += c; return; }
      var low = c.toLowerCase(), up = c !== low, last = syl[syl.length - 1];
      if (low === 'w' && last && !last.mod && (last.b === 'a' || last.b === 'o' || last.b === 'u')) { last.mod = last.b === 'a' ? '(' : '+'; return; }
      if ((low === 'a' || low === 'e' || low === 'o') && last && !last.mod && last.b === low) { last.mod = '^'; return; }
      if (low === 'd' && last && !last.mod && last.b === 'd') { last.mod = '-'; return; }
      if (KEY_TONE[low] && hasVowel()) { tone = KEY_TONE[low]; return; }
      if (low === 'z' && hasVowel() && tone) { tone = ''; return; }
      syl.push({ b: low, mod: '', up: up });
    });
    flush();
    return out;
  }
  function glyph(s, tone) {
    var c;
    if (s.mod === '-') c = 'đ';
    else if (s.mod === '^') c = ({ a: 'â', e: 'ê', o: 'ô' })[s.b] || s.b;
    else if (s.mod === '(') c = 'ă';
    else if (s.mod === '+') c = ({ o: 'ơ', u: 'ư' })[s.b] || s.b;
    else c = s.b;
    if (tone) c = (c + tone).normalize('NFC');
    return s.up ? c.toUpperCase() : c;
  }
  /* Chỗ đặt dấu thanh trong một tiếng (cách đặt mới) */
  function toneIndex(syl) {
    var v = [];
    syl.forEach(function (s, n) { if (s.mod !== '-' && VOWELS.indexOf(s.b) >= 0) v.push(n); });
    if (syl.length > 1 && syl[0].b === 'q' && syl[1].b === 'u') v = v.filter(function (n) { return n !== 1; });
    if (syl.length > 2 && syl[0].b === 'g' && syl[1].b === 'i' && v.indexOf(1) >= 0 && v.length > 1) v = v.filter(function (n) { return n !== 1; });
    if (!v.length) return -1;
    if (v.length === 1) return v[0];
    var modded = v.filter(function (n) { return syl[n].mod === '^' || syl[n].mod === '(' || syl[n].mod === '+'; });
    if (modded.length) {
      var horns = modded.filter(function (n) { return syl[n].mod === '+'; });
      if (horns.length === 2) return horns[1];                          // ươ: dấu đặt ở ơ
      return modded[modded.length - 1];
    }
    if (v.length >= 3) return v[1];
    var closed = v[v.length - 1] < syl.length - 1;                      // có phụ âm cuối: dấu ở nguyên âm thứ hai (toán); không có: dấu ở nguyên âm đầu (hòa, khỏe, thủy, múa)
    return closed ? v[1] : v[0];
  }

  /* Danh sách chữ cái của một chuỗi: chữ gốc (b), dấu phụ (mod: ^ mũ, ( trăng, + móc, - gạch đ) và dấu thanh (tone), để chọn bài theo dấu */
  function letters(text) { return Array.from(String(text).normalize('NFC')).filter(isLetter).map(split); }
  var api = { toInfo: toInfo, compose: compose, letters: letters };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Telex = api;
})(typeof window !== 'undefined' ? window : globalThis);
