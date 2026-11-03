'use strict';
/*
 * Quản lý cuộc đua trên máy chủ.
 * - Đua công khai theo cấp độ (Cấp độ 1 đua với Cấp độ 1, Cấp độ 2 với Cấp độ 2, ... Cấp độ 5 với Cấp độ 5): 1 đấu 1, 3 đấu 3, 5 đấu 5.
 * - Đua với máy, phòng riêng có mã để mời bạn.
 * - Máy chủ giữ đồng hồ: tự đếm ngược, tự tính thời gian về đích, tự điền máy vào chỗ trống.
 */
const crypto = require('crypto');

const MODES = {
  '1v1': { cap: 2, teams: false, label: '1 đấu 1' },
  '3v3': { cap: 6, teams: true, label: '3 đấu 3' },
  '5v5': { cap: 10, teams: true, label: '5 đấu 5' },
  bot: { cap: 2, teams: false, label: 'Đua với máy' }
};
const STAGES = new Set(['bo', 'di', 'chay', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10']);
const FILL_AFTER_MS = 40_000;      // chờ quá lâu thì máy vào chơi cùng
const MIN_WAIT_TO_FILL_MS = 8_000; // sau 8 giây, các bé có thể bấm "đua luôn"
const COUNTDOWN_MS = 5_000;
const MAX_RACE_MS = 180_000;
const KEEP_DONE_MS = 120_000;
const BOT_WPM = { bo: [4, 7, 10], di: [6, 10, 14], chay: [8, 13, 18], l4: [10, 15, 20], l5: [12, 18, 24], l6: [14, 20, 26], l7: [16, 22, 28], l8: [18, 25, 32], l9: [20, 28, 36], l10: [22, 30, 40] };
const BOT_NAMES = ['Máy Mít', 'Máy Na', 'Máy Cam', 'Máy Bơ', 'Máy Dừa', 'Máy Xoài', 'Máy Ổi', 'Máy Lê', 'Máy Nho', 'Máy Táo'];
const AVATARS = new Set(['🐯', '🐰', '🐼', '🦊', '🐸', '🐱', '🐶', '🐻', '🐨', '🐵', '🦁', '🐮', '🐷', '🐹', '🐭', '🐔', '🐧', '🐦', '🦉', '🦄', '🐲', '🐙', '🦋', '🐢', '🐬', '🐳', '🦖', '🦒', '🐘', '🦓', '🐝', '🐞', '🦀', '🐥', '🦔']);
const CODE_CH = 'abcdefghjkmnpqrstuvwxyz23456789';

/* Kho chữ cho từng cấp độ */
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const HOME_ROW = 'asdfghjkl';
const WORDS = ('cat dog pig fox ant cow hen bee owl bat duck fish frog bird lion bear goat horse mouse tiger zebra ' +
  'bed cup box key door lamp bowl fork sofa clock chair red blue pink green black white brown one two six ten four five nine ' +
  'eye ear arm leg hand foot nose egg tea milk cake rice corn soup bread candy pear apple grape lemon mango sun sea moon star ' +
  'rain tree snow leaf rock hill cloud mom dad boy baby girl hat cap sock shoe coat dress shirt pen bag book bell ruler ball ' +
  'doll kite drum robot bus car van bike taxi ship boat train plane truck').split(' ');
const SENTENCES = ['we can hop', 'the dog is big', 'the sun is hot', 'my cat can run', 'the fox is red', 'we like cake',
  'the moon is up', 'we go to school', 'my bike is green', 'birds can fly', 'fish can swim', 'the bus is yellow',
  'the frog can jump high', 'my mom has a red bag', 'dad has a blue car', 'look at the big tree', 'the duck is in the pond',
  'my dog likes to play', 'she has a pink hat', 'he can kick the ball', 'we eat rice and fish', 'the pig is in the mud'];
const PARAS = ['I have a cat. Her name is Mimi.', 'The dog runs in the park. It likes to play.', 'Look at the bird! It can fly high.',
  'This is my mom. She is kind.', 'My dad likes to cook. We eat rice and fish.', 'I go to school by bus. My school is big.',
  'My teacher is nice. She reads us a story.', "It is sunny today. Let's go out!", 'It is raining. Where is my coat?',
  'Plants need water. They also need the sun.', 'Fish live in water. They can swim fast.', 'I have 3 apples. Mom gives me 2 more.',
  'A square has 4 sides. A triangle has 3.', 'Wash your hands! They must be clean.', 'Can you swim? Yes, I can.'];

const rnd = n => crypto.randomInt(n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function genText(stage) {
  if (stage === 'bo') {
    const groups = [];
    for (let i = 0; i < 8; i++) { const src = i % 2 ? LETTERS : HOME_ROW; let g = ''; for (let j = 0; j < 3; j++) g += pick(src.split('')); groups.push(g); }
    return groups.join(' ');
  }
  if (stage === 'di') return shuffle(WORDS).slice(0, 6).join(' ');
  if (stage === 'chay') return shuffle(SENTENCES).slice(0, 2).join(' ');
  if (stage === 'l4') return shuffle(SENTENCES).slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1) + '.').join(' ');
  if (stage === 'l5') return shuffle(PARAS).slice(0, 2).join(' ');
  return shuffle(PARAS).slice(0, stage === 'l6' || stage === 'l7' ? 3 : 4).join(' ');   // cấp độ 6 trở lên: đua bằng đoạn văn tiếng Anh dài hơn (gõ tiếng Việt chưa dùng cho đua)
}

/* Biệt danh: bỏ ký tự lạ, chặn vài từ không phù hợp */
const BAD_CHARS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g;
const BLOCK = ['dit', 'đit', 'địt', 'lon', 'lồn', 'cac', 'cặc', 'buoi', 'buồi', 'dm', 'đm', 'vcl', 'vkl', 'cl', 'fuck', 'shit', 'bitch', 'sex', 'dick'];
const fold = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
function cleanNick(v) {
  let s = typeof v === 'string' ? v.replace(BAD_CHARS, '').trim().slice(0, 12) : '';
  const words = fold(s).split(/[^a-z0-9]+/).filter(Boolean);
  if (words.some(w => BLOCK.map(fold).includes(w))) s = '';
  return s || 'Bạn nhỏ';
}

class RaceManager {
  constructor(send, broadcastAll) {
    this.send = send;                 // send(peerId, msg)
    this.broadcastAll = broadcastAll; // broadcastAll(msg)
    this.races = new Map();
    this.byPeer = new Map();
    this.byCode = new Map();
    this.dirty = new Set();
    this.listDirty = true;
    this.lastList = '';
    this.timer = setInterval(() => this.tick(), 100);
    this.timer.unref();
  }

  /* ---------- tạo / vào / rời ---------- */
  newRace(mode, stage, isPublic) {
    const id = crypto.randomBytes(6).toString('hex');
    let code = null;
    if (!isPublic) { do { code = Array.from({ length: 5 }, () => CODE_CH[rnd(CODE_CH.length)]).join(''); } while (this.byCode.has(code)); this.byCode.set(code, id); }
    const race = { id, code, mode, stage, cap: MODES[mode].cap, teams: MODES[mode].teams, isPublic, status: 'waiting',
      createdAt: Date.now(), players: [], text: '', goAt: 0, doneAt: 0, results: null, botSeq: 0 };
    this.races.set(id, race);
    this.listDirty = true;
    return race;
  }
  addHuman(race, peerId, info) {
    this.leave(peerId, true);
    race.players.push({ pid: peerId, nick: cleanNick(info.nick), av: AVATARS.has(info.av) ? info.av : '🐯', team: this.pickTeam(race),
      bot: false, pos: 0, done: false, ms: null, errs: 0, left: false });
    this.byPeer.set(peerId, race.id);
    this.touch(race);
    if (this.humans(race).length + race.players.filter(p => p.bot).length >= race.cap) this.startCountdown(race);
  }
  addBot(race, level) {
    const speeds = BOT_WPM[race.stage];
    const base = level != null ? speeds[level] : speeds[1];
    race.botSeq += 1;
    const used = new Set(race.players.map(p => p.nick));
    const name = BOT_NAMES.find(n => !used.has(n)) || ('Máy ' + race.botSeq);
    race.players.push({ pid: 'bot-' + race.id + '-' + race.botSeq, nick: name, av: '🤖', team: this.pickTeam(race), bot: true,
      wpm: Math.max(2, base * (0.85 + Math.random() * 0.3)), pos: 0, done: false, ms: null, errs: 0, left: false });
  }
  pickTeam(race) {
    if (!race.teams) return null;
    const a = race.players.filter(p => p.team === 'A').length, b = race.players.filter(p => p.team === 'B').length;
    return a <= b ? 'A' : 'B';
  }
  humans(race) { return race.players.filter(p => !p.bot && !p.left); }
  raceOf(peerId) { const id = this.byPeer.get(peerId); return id ? this.races.get(id) : null; }

  leave(peerId, silent) {
    const race = this.raceOf(peerId);
    this.byPeer.delete(peerId);
    if (!race) return;
    const p = race.players.find(x => x.pid === peerId);
    if (p) {
      if (race.status === 'waiting') race.players = race.players.filter(x => x !== p);
      else p.left = true;
    }
    if (!this.humans(race).length && race.status !== 'done') this.remove(race);
    else this.touch(race);
    if (!silent) this.send(peerId, { t: 'race.left' });
  }
  remove(race) {
    this.races.delete(race.id);
    if (race.code) this.byCode.delete(race.code);
    for (const p of race.players) if (!p.bot && this.byPeer.get(p.pid) === race.id) this.byPeer.delete(p.pid);
    this.listDirty = true;
  }

  /* ---------- yêu cầu từ các bé ---------- */
  handle(peerId, msg) {
    const err = text => this.send(peerId, { t: 'race.error', text });
    const stage = STAGES.has(msg.stage) ? msg.stage : 'bo';
    switch (msg.t) {
      case 'race.quick': {
        const mode = ['1v1', '3v3', '5v5'].includes(msg.mode) ? msg.mode : '1v1';
        const mine = this.raceOf(peerId);
        let race = [...this.races.values()].find(r => r.isPublic && r.status === 'waiting' && r.mode === mode && r.stage === stage &&
          r.players.length < r.cap && r !== mine);
        if (!race) race = this.newRace(mode, stage, true);
        this.addHuman(race, peerId, msg);
        return;
      }
      case 'race.create': {
        const mode = ['1v1', '3v3', '5v5'].includes(msg.mode) ? msg.mode : '1v1';
        this.addHuman(this.newRace(mode, stage, false), peerId, msg);
        return;
      }
      case 'race.bot': {
        const level = [0, 1, 2].includes(msg.level) ? msg.level : 1;
        const race = this.newRace('bot', stage, false);
        this.addBot(race, level);
        this.addHuman(race, peerId, msg);
        return;
      }
      case 'race.join': {
        let race = null;
        if (typeof msg.code === 'string') { const id = this.byCode.get(msg.code.toLowerCase()); race = id && this.races.get(id); }
        else if (typeof msg.id === 'string') race = this.races.get(msg.id);
        if (!race) return err('Không tìm thấy cuộc đua này. Có thể cuộc đua đã bắt đầu hoặc đã kết thúc.');
        if (race.players.some(p => p.pid === peerId)) { this.touch(race); return; }
        if (race.status !== 'waiting') return err('Cuộc đua này đã bắt đầu rồi. Em chọn cuộc đua khác nhé.');
        if (race.players.length >= race.cap) return err('Cuộc đua này đã đủ người.');
        if (race.isPublic && race.stage !== stage) return err('Cuộc đua này dành cho các bạn ở cấp độ khác.');
        this.addHuman(race, peerId, msg);
        return;
      }
      case 'race.fill': {
        const race = this.raceOf(peerId);
        if (!race || race.status !== 'waiting') return;
        if (Date.now() - race.createdAt < MIN_WAIT_TO_FILL_MS) return err('Chờ thêm vài giây để các bạn khác kịp vào nhé.');
        this.fillAndStart(race);
        return;
      }
      case 'race.leave': this.leave(peerId); return;
      case 'race.prog': {
        const race = this.raceOf(peerId);
        if (!race || race.status !== 'racing') return;
        const p = race.players.find(x => x.pid === peerId);
        const pos = Number(msg.pos);
        if (!p || p.done || !Number.isInteger(pos) || pos < p.pos || pos > race.text.length) return;
        const maxPos = Math.ceil((Date.now() - race.goAt) / 1000 * 25) + 2; // tối đa khoảng 300 WPM
        p.pos = Math.min(pos, maxPos);
        this.touch(race);
        return;
      }
      case 'race.finish': {
        const race = this.raceOf(peerId);
        if (!race || race.status !== 'racing') return;
        const p = race.players.find(x => x.pid === peerId);
        if (!p || p.done) return;
        const ms = Date.now() - race.goAt;
        if (ms < race.text.length * 40) return; // nhanh hơn 300 WPM: không hợp lệ
        p.pos = race.text.length; p.done = true; p.ms = ms;
        p.errs = Math.max(0, Math.min(9999, Number(msg.errs) || 0));
        this.touch(race);
        this.maybeFinish(race);
        return;
      }
      default: return;
    }
  }

  /* ---------- vòng đời cuộc đua ---------- */
  fillAndStart(race) {
    while (race.players.length < race.cap) this.addBot(race, null);
    this.startCountdown(race);
  }
  startCountdown(race) {
    if (race.status !== 'waiting') return;
    race.status = 'countdown';
    race.text = genText(race.stage);
    race.goAt = Date.now() + COUNTDOWN_MS;
    this.listDirty = true;
    this.touch(race);
  }
  maybeFinish(race) {
    if (Date.now() - race.goAt > MAX_RACE_MS) return this.finalize(race);
    const active = race.players.filter(p => !p.left);
    if (active.every(p => p.done)) return this.finalize(race);
    if (!this.humans(race).some(p => !p.done)) this.finalize(race); // các bé đã về hết: chốt kết quả, máy xếp theo quãng đường đã chạy
  }
  finalize(race) {
    race.status = 'done';
    race.doneAt = Date.now();
    const order = race.players.slice().sort((a, b) => (a.done === b.done ? (a.done ? a.ms - b.ms : b.pos - a.pos) : a.done ? -1 : 1));
    const n = order.length;
    order.forEach((p, i) => { p.rank = i + 1; p.points = n - i; });
    if (race.teams) {
      const score = t => order.filter(p => p.team === t).reduce((s, p) => s + p.points, 0);
      const a = score('A'), b = score('B');
      race.results = { A: a, B: b, winner: a === b ? 'draw' : a > b ? 'A' : 'B' };
    } else race.results = { winner: order[0] ? order[0].pid : null };
    this.touch(race);
  }
  touch(race) { this.dirty.add(race.id); }

  tick() {
    const now = Date.now();
    for (const race of this.races.values()) {
      if (race.status === 'waiting' && race.isPublic && now - race.createdAt >= FILL_AFTER_MS && this.humans(race).length) this.fillAndStart(race);
      if (race.status === 'countdown' && now >= race.goAt) { race.status = 'racing'; this.touch(race); }
      if (race.status === 'racing') {
        const len = race.text.length;
        for (const p of race.players) {
          if (!p.bot || p.done) continue;
          const speed = p.wpm;
          p.pos = Math.min(len, p.pos + speed * 5 / 60 * 0.1 * (0.6 + Math.random() * 0.8));
          if (p.pos >= len) { p.pos = len; p.done = true; p.ms = now - race.goAt; }
          this.touch(race);
        }
        this.maybeFinish(race);
      }
      if (race.status === 'done' && now - race.doneAt > KEEP_DONE_MS) this.remove(race);
    }
    for (const id of this.dirty) { const r = this.races.get(id); if (r) this.pushRace(r); }
    this.dirty.clear();
    if (this.listDirty) this.pushList();
  }
  pushRace(race) {
    const now = Date.now();
    for (const p of race.players) {
      if (p.bot || p.left || this.byPeer.get(p.pid) !== race.id) continue;
      this.send(p.pid, { t: 'race', race: this.view(race, p.pid, now) });
    }
    if (race.isPublic && race.status === 'waiting') this.listDirty = true;
  }
  view(race, me, now) {
    return {
      id: race.id, code: race.code, mode: race.mode, label: MODES[race.mode].label, stage: race.stage, cap: race.cap, teams: race.teams,
      isPublic: race.isPublic, status: race.status,
      text: race.status === 'waiting' ? '' : race.text,
      startIn: race.status === 'countdown' ? race.goAt - now : 0,
      elapsed: race.status === 'racing' ? now - race.goAt : 0,
      fillIn: race.status === 'waiting' && race.isPublic ? Math.max(0, FILL_AFTER_MS - (now - race.createdAt)) : null,
      canFill: race.status === 'waiting' && now - race.createdAt >= MIN_WAIT_TO_FILL_MS,
      age: now - race.createdAt,
      results: race.results,
      players: race.players.map(p => ({ id: p.pid === me ? 'me' : crypto.createHash('sha1').update(race.id + p.pid).digest('hex').slice(0, 10),
        me: p.pid === me, nick: p.nick, av: p.av, team: p.team, bot: p.bot, left: p.left, pos: Math.floor(p.pos), done: p.done, ms: p.ms,
        rank: p.rank || null, points: p.points || null }))
    };
  }
  pushList() {
    this.listDirty = false;
    const now = Date.now();
    const list = [...this.races.values()].filter(r => r.isPublic && r.status === 'waiting').map(r => ({
      id: r.id, mode: r.mode, label: MODES[r.mode].label, stage: r.stage, cap: r.cap, n: r.players.length,
      avs: r.players.map(p => p.av), fillIn: Math.max(0, FILL_AFTER_MS - (now - r.createdAt))
    }));
    const s = JSON.stringify(list.map(x => [x.id, x.n]));
    if (s === this.lastList && list.length === 0) return;
    this.lastList = s;
    this.broadcastAll({ t: 'races', list });
  }
  listFor() {
    const now = Date.now();
    return [...this.races.values()].filter(r => r.isPublic && r.status === 'waiting').map(r => ({
      id: r.id, mode: r.mode, label: MODES[r.mode].label, stage: r.stage, cap: r.cap, n: r.players.length,
      avs: r.players.map(p => p.av), fillIn: Math.max(0, FILL_AFTER_MS - (now - r.createdAt))
    }));
  }
}

module.exports = { RaceManager, cleanNick };
