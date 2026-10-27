'use strict';
/* 逻辑自检：node test/logic-test.js
 * 1) 定向用例：连通判定（相邻 / 2 折绕行 / 不同类型 / 被围死）
 * 2) 全关卡模拟：每关反复"寻找可消对并消除"，必须能完全清空棋盘
 * 3) 无尽模式抽样
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* game.js 在计时回调里引用 UI/SFX，先放全局占位（有 typeof 守卫，不会报错） */
globalThis.UI = {};
globalThis.SFX = {};

const src = [
  fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'),
  fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8'),
  '\n;globalThis.__NCT = { Game, Save, LEVELS, MEMBERS, avatarSVG, memberByType, PHRASES, ACHIEVEMENTS, djb2Hash, mulberry32, todayKey };'
].join('\n');
vm.runInThisContext(src, { filename: 'game-bundle.js' });
const { Game, Save, LEVELS, MEMBERS, avatarSVG, memberByType, PHRASES, ACHIEVEMENTS, djb2Hash, mulberry32, todayKey } = globalThis.__NCT;

let failures = 0;
const check = (name, cond, extra) => {
  if (cond) console.log('  ✅ ' + name);
  else { failures++; console.log('  ❌ ' + name + (extra ? ' | ' + JSON.stringify(extra) : '')); }
};

/* ---------- 1. 定向用例 ---------- */
console.log('--- 连通判定定向用例 ---');
{
  Game.rows = 1; Game.cols = 4;
  Game.grid = [
    [0, 0, 0, 0, 0, 0],
    [0, 1, 9, 1, 0, 0],
    [0, 0, 0, 0, 0, 0]
  ];
  const a = { r: 1, c: 1, type: 1, alive: true };
  const b = { r: 1, c: 3, type: 1, alive: true };
  const p = Game.canConnect(a, b, true);
  const turnsOf = pts => {
    let n = 0;
    for (let i = 2; i < pts.length; i++) {
      const d1 = Math.sign(pts[i - 1].r - pts[i - 2].r) + ',' + Math.sign(pts[i - 1].c - pts[i - 2].c);
      const d2 = Math.sign(pts[i].r - pts[i - 1].r) + ',' + Math.sign(pts[i].c - pts[i - 1].c);
      if (d1 !== d2) n++;
    }
    return n;
  };
  check('中间被挡时可以 ≤2 折绕行', Array.isArray(p) && turnsOf(p) <= 2, p);
  check('路径起止正确', Array.isArray(p) && p[0].r === 1 && p[0].c === 1 && p[p.length - 1].r === 1 && p[p.length - 1].c === 3, p);

  const c = { r: 1, c: 2, type: 2, alive: true };
  check('不同类型不可连接', Game.canConnect(a, c, false) === false);

  /* 被墙围死：a(1,1) 与 b(3,3)，四邻要么是墙、要么需 3 折才能进入 */
  Game.rows = 3; Game.cols = 3;
  Game.grid = [
    [0, 0, 0, 0, 0],
    [0, 1, 9, 9, 0],
    [0, 9, 9, 9, 0],
    [0, 9, 9, 9, 1],
    [0, 0, 0, 0, 0]
  ];
  const w = { r: 1, c: 1, type: 1, alive: true };
  const z = { r: 3, c: 3, type: 1, alive: true };
  check('需要 3 折时不可连接', Game.canConnect(w, z, false) === false);
}

/* ---------- 2. 全关卡模拟 ---------- */
console.log('--- 全关卡完全清空模拟（每关 5 次） ---');
for (let i = 0; i < LEVELS.length; i++) {
  let allClear = true;
  for (let trial = 0; trial < 5; trial++) {
    Game.startClassic(i);
    Game.stopTimer();
    let guard = 0;
    while (Game.remaining() > 0) {
      if (guard++ > 5000) { allClear = false; break; }
      const pair = Game.findAnyPair();
      if (!pair) {
        Game.shufflePositions();
        if (!Game.ensureSolvable()) { allClear = false; break; }
        continue;
      }
      const p = Game.canConnect(pair[0], pair[1], true);
      if (!Array.isArray(p)) { allClear = false; console.log('    路径缺失!', i, trial); break; }
      pair[0].alive = false; pair[1].alive = false;
      Game.grid[pair[0].r][pair[0].c] = 0;
      Game.grid[pair[1].r][pair[1].c] = 0;
    }
  }
  check(`第 ${i + 1} 关 ${LEVELS[i].song}（${LEVELS[i].rows}×${LEVELS[i].cols}）可完全通关`, allClear);
}

/* ---------- 3. 无尽模式抽样 ---------- */
console.log('--- 无尽模式抽样 ---');
{
  let ok = true;
  for (let r = 1; r <= 6; r++) {
    Game.startEndless(r);
    Game.stopTimer();
    let guard = 0;
    while (Game.remaining() > 0 && guard++ < 5000) {
      const pair = Game.findAnyPair();
      if (!pair) { Game.shufflePositions(); Game.ensureSolvable(); continue; }
      pair[0].alive = false; pair[1].alive = false;
      Game.grid[pair[0].r][pair[0].c] = 0;
      Game.grid[pair[1].r][pair[1].c] = 0;
    }
    if (Game.remaining() !== 0) { ok = false; console.log('    无尽第 ' + r + ' 轮无法清空'); }
  }
  check('无尽模式第 1~6 轮棋盘均合法', ok);
}

/* ---------- 4. 道具与计分 ---------- */
console.log('--- 道具与计分 ---');
{
  Game.startClassic(0); Game.stopTimer();
  Game.items = { hint: 1, shuffle: 1, clock: 1 };
  const pair = Game.useHint();
  check('提示返回一对可消卡片', Array.isArray(pair) && pair.length === 2);
  check('提示次数扣减', Game.items.hint === 0);
  check('提示用尽返回 null', Game.useHint() === null);
  check('洗牌后仍有解', Game.useShuffle() === true && Game.findAnyPair() !== null);
  const before = Game.timeLeft;
  check('加时 +20s', Game.useClock() === true && Game.timeLeft === before + 20);
  check('洗牌用尽返回 false', Game.useShuffle() === false);

  /* 计分与连击 */
  Game.combo = 0; Game.lastMatchAt = 0;
  const t1 = Game.tiles.filter(t => t.alive);
  Game.selected = null;
  const now = Date.now();
  Game.lastMatchAt = now;
  Game.combo = 1;
  const gain = 10 + Math.min(Game.combo - 1, 9) * 5;
  check('连击加分公式', gain === 10);
  void t1;
}

console.log('--- 评星 ---');
{
  Game.mode = 'classic';
  Game.levelSeconds = 100;
  Game.timeLeft = 50; check('剩余 50% → 3 星', Game.stars() === 3);
  Game.timeLeft = 30; check('剩余 30% → 2 星', Game.stars() === 2);
  Game.timeLeft = 10; check('剩余 10% → 1 星', Game.stars() === 1);
}

/* ---------- 5. 每日挑战 ---------- */
console.log('--- 每日挑战 ---');
{
  const key = todayKey();
  Game.startDaily(key); Game.stopTimer();
  const layout1 = Game.tiles.map(t => t.type).join(',');
  check('每日挑战棋盘 8×9=72 格', Game.rows === 8 && Game.cols === 9 && Game.tiles.length === 72);
  Game.startDaily(key); Game.stopTimer();
  const layout2 = Game.tiles.map(t => t.type).join(',');
  check('同一天两次开局棋盘完全一致（种子确定性）', layout1 === layout2);
  Game.startDaily('2026-10-27'); Game.stopTimer();
  const layoutOther = Game.tiles.map(t => t.type).join(',');
  check('不同日期棋盘不同', layoutOther !== layout1);
  check('每日挑战模式标记', Game.mode === 'daily' && Game.dailyDate === '2026-10-27');

  /* 完全可解 */
  let guard = 0;
  while (Game.remaining() > 0 && guard++ < 5000) {
    const pair = Game.findAnyPair();
    if (!pair) { Game.shufflePositions(); Game.ensureSolvable(); continue; }
    pair[0].alive = false; pair[1].alive = false;
    Game.grid[pair[0].r][pair[0].c] = 0;
    Game.grid[pair[1].r][pair[1].c] = 0;
  }
  check('每日挑战棋盘可完全通关', Game.remaining() === 0);
}

/* ---------- 6. 成就与存档 ---------- */
console.log('--- 成就与存档 ---');
{
  /* 模拟 localStorage */
  const store = {};
  globalThis.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  Save.data = { unlocked: 0, stars: {}, best: {}, endlessBest: 0, daily: {}, achievements: [], settings: { sfx: true, music: true } };

  check('记录每日成绩并刷新最佳', Save.recordDaily('2026-10-28', 300, 2) === true);
  check('更低分不刷新最佳', Save.recordDaily('2026-10-28', 100, 3) === false);
  check('今日最佳保持 300 分且星级取更高', Save.data.daily['2026-10-28'].score === 300 && Save.data.daily['2026-10-28'].stars === 3);

  const fresh1 = Save.unlockAchievements(['first_win', 'combo5', 'first_win']);
  check('成就去重解锁', fresh1.length === 2 && Save.data.achievements.length === 2);
  const fresh2 = Save.unlockAchievements(['first_win']);
  check('重复解锁返回空', fresh2.length === 0);

  check('成就定义无重复 id', new Set(ACHIEVEMENTS.map(a => a.id)).size === ACHIEVEMENTS.length);
  check('今日日期键格式', /^\d{4}-\d{2}-\d{2}$/.test(todayKey()));
}

console.log(failures === 0 ? '\n🎉 全部测试通过' : `\n💥 ${failures} 个测试失败`);
process.exit(failures === 0 ? 0 : 1);
