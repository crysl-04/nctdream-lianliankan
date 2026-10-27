'use strict';
/* ============================================================
 * NCT DREAM 连连看 - 核心游戏逻辑（不依赖 DOM，可单独测试）
 * 规则：两张相同成员卡片，可用不超过两次转折的路径连通即可消除，
 *       路径只能经过空格，并允许从棋盘外侧绕行。
 * ============================================================ */

const Game = {
  state: 'idle',            // idle | playing | won | lost
  mode: 'classic',          // classic | endless
  levelIdx: 0,
  endlessRound: 1,
  rows: 0, cols: 0,
  grid: [],                 // (rows+2)x(cols+2)，0=空，>0=成员类型
  tiles: [],                // 所有卡片对象 {r,c,type,alive}
  cellAt: {},               // "r,c" -> 卡片对象
  selected: null,
  score: 0, combo: 0, maxCombo: 0, lastMatchAt: 0,
  timeLeft: 0, levelSeconds: 0, timerId: null,
  items: { hint: 0, shuffle: 0, clock: 0 },
  boardsCleared: 0,

  R() { return this.rows + 2; },
  C() { return this.cols + 2; },

  /* ---------- 开局 ---------- */
  startClassic(idx) {
    this.mode = 'classic';
    this.levelIdx = idx;
    const L = LEVELS[idx];
    const typeCount = Math.min(MEMBERS.length, 4 + Math.floor(idx / 2));
    this._setup(L.rows, L.cols, typeCount, L.time);
    return L;
  },

  startEndless(round) {
    this.mode = 'endless';
    this.endlessRound = round || 1;
    const rows = Math.min(9, 5 + Math.ceil(this.endlessRound / 2));
    let cols = Math.min(12, 5 + this.endlessRound);
    if ((rows * cols) % 2 !== 0) cols++; // 格子总数必须为偶数，否则无法完全消除
    const cells = rows * cols;
    const time = Math.round(60 + cells * 1.4);
    const typeCount = Math.min(MEMBERS.length, 4 + Math.floor(this.endlessRound / 2));
    this._setup(rows, cols, typeCount, time);
  },

  _setup(rows, cols, typeCount, seconds) {
    this.rows = rows;
    this.cols = cols;
    this.state = 'playing';
    this.selected = null;
    this.combo = 0;
    this.lastMatchAt = 0;
    this.items = { hint: 3, shuffle: 2, clock: 1 };

    const cells = rows * cols;
    const pairs = cells / 2;
    const per = Math.floor(pairs / typeCount);
    let rem = pairs % typeCount;
    const pool = [];
    for (let t = 0; t < typeCount; t++) {
      let n = per + (rem-- > 0 ? 1 : 0);
      for (let i = 0; i < n * 2; i++) pool.push(t + 1);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const R = rows + 2, C = cols + 2;
    this.grid = Array.from({ length: R }, () => Array.from({ length: C }, () => 0));
    this.tiles = [];
    this.cellAt = {};
    let k = 0;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const tile = { r, c, type: pool[k++], alive: true };
        this.grid[r][c] = tile.type;
        this.tiles.push(tile);
        this.cellAt[r + ',' + c] = tile;
      }
    }
    this.ensureSolvable();

    this.levelSeconds = seconds;
    this.startTimer(seconds);
  },

  /* ---------- 连通判定：0-1 BFS（直行代价 0，转弯代价 1），≤2 折 ---------- */
  canConnect(a, b, wantPath) {
    if (a.type !== b.type) return wantPath ? null : false;
    const R = this.R(), C = this.C();
    const dirs = [[-1, 0], [0, -1], [1, 0], [0, 1]];
    const INF = 9;
    const best = Array.from({ length: R }, () => Array.from({ length: C }, () => [INF, INF, INF, INF]));
    const deque = [];

    const isB = (r, c) => r === b.r && c === b.c;
    for (let d = 0; d < 4; d++) {
      const nr = a.r + dirs[d][0], nc = a.c + dirs[d][1];
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      if (this.grid[nr][nc] === 0 || isB(nr, nc)) {
        best[nr][nc][d] = 0;
        const node = { r: nr, c: nc, d, turns: 0, prev: null };
        if (isB(nr, nc)) return wantPath ? this._pathFrom(node, a) : true;
        deque.push(node);
      }
    }

    while (deque.length) {
      const cur = deque.shift();
      if (cur.turns > best[cur.r][cur.c][cur.d]) continue;
      for (let nd = 0; nd < 4; nd++) {
        const nr = cur.r + dirs[nd][0], nc = cur.c + dirs[nd][1];
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        const reachB = isB(nr, nc);
        if (!reachB && this.grid[nr][nc] !== 0) continue;
        const turnCost = nd === cur.d ? 0 : 1;
        const nt = cur.turns + turnCost;
        if (nt > 2 || nt >= best[nr][nc][nd]) continue;
        best[nr][nc][nd] = nt;
        const node = { r: nr, c: nc, d: nd, turns: nt, prev: cur };
        if (reachB) return wantPath ? this._pathFrom(node, a) : true;
        if (turnCost === 0) deque.unshift(node); else deque.push(node);
      }
    }
    return wantPath ? null : false;
  },

  _pathFrom(endNode, a) {
    const pts = [];
    let n = endNode;
    while (n) { pts.push({ r: n.r, c: n.c }); n = n.prev; }
    pts.push({ r: a.r, c: a.c });
    pts.reverse();
    return pts; // [a, ...途经格..., b]
  },

  /* ---------- 消除 ---------- */
  tryMatch(cell) {
    if (this.state !== 'playing') return { status: 'ignore' };
    if (!this.selected) {
      this.selected = cell;
      return { status: 'select', cell };
    }
    if (this.selected === cell) {
      this.selected = null;
      return { status: 'deselect' };
    }
    const a = this.selected, b = cell;
    const path = this.canConnect(a, b, true);
    if (path) {
      a.alive = false;
      b.alive = false;
      this.grid[a.r][a.c] = 0;
      this.grid[b.r][b.c] = 0;
      this.selected = null;
      const now = Date.now();
      this.combo = now - this.lastMatchAt < 4000 ? this.combo + 1 : 1;
      this.lastMatchAt = now;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      const gain = 10 + Math.min(this.combo - 1, 9) * 5;
      this.score += gain;
      return { status: 'matched', path, a, b, gain, combo: this.combo };
    }
    this.selected = b; // 消除失败则切换到新卡片
    return { status: 'mismatch', a, b };
  },

  remaining() { return this.tiles.filter(t => t.alive).length; },

  findAnyPair() {
    const byType = {};
    for (const t of this.tiles) {
      if (!t.alive) continue;
      (byType[t.type] = byType[t.type] || []).push(t);
    }
    for (const type in byType) {
      const arr = byType[type];
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (this.canConnect(arr[i], arr[j], false)) return [arr[i], arr[j]];
        }
      }
    }
    return null;
  },

  shufflePositions() {
    const types = this.tiles.filter(t => t.alive).map(t => t.type);
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    let k = 0;
    for (const t of this.tiles) {
      if (!t.alive) continue;
      t.type = types[k++];
      this.grid[t.r][t.c] = t.type;
    }
  },

  /* 保证当前局面至少存在一步可解 */
  ensureSolvable() {
    let guard = 0;
    while (!this.findAnyPair() && guard++ < 80) this.shufflePositions();
    return this.findAnyPair() !== null;
  },

  /* 消除后检查死局：自动洗牌（不消耗道具） */
  autoShuffleIfNeeded() {
    if (this.remaining() === 0) return false;
    if (this.findAnyPair()) return false;
    this.shufflePositions();
    this.ensureSolvable();
    return true;
  },

  /* ---------- 道具 ---------- */
  useHint() {
    if (this.items.hint <= 0 || this.state !== 'playing') return null;
    const pair = this.findAnyPair();
    if (!pair) return null;
    this.items.hint--;
    return pair;
  },

  useShuffle() {
    if (this.items.shuffle <= 0 || this.state !== 'playing') return false;
    this.items.shuffle--;
    this.shufflePositions();
    this.ensureSolvable();
    return true;
  },

  useClock() {
    if (this.items.clock <= 0 || this.state !== 'playing') return false;
    this.items.clock--;
    this.timeLeft += 20;
    return true;
  },

  /* ---------- 计时 ---------- */
  startTimer(seconds) {
    this.timeLeft = seconds;
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (this.state !== 'playing') return;
      this.timeLeft--;
      if (typeof UI !== 'undefined' && UI.onTick) UI.onTick();
      if (this.timeLeft <= 10 && this.timeLeft > 0 && typeof SFX !== 'undefined') SFX.tick();
      if (this.timeLeft <= 0) {
        this.stopTimer();
        this.state = 'lost';
        if (typeof UI !== 'undefined' && UI.onLose) UI.onLose();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  },

  stars() {
    if (this.mode !== 'classic') return 0;
    const ratio = this.timeLeft / this.levelSeconds;
    return ratio >= 0.5 ? 3 : ratio >= 0.25 ? 2 : 1;
  },

  finishWin() {
    this.stopTimer();
    this.state = 'won';
    const bonus = Math.max(0, this.timeLeft) * 2;
    this.score += bonus;
    this.boardsCleared++;
    return bonus;
  }
};

/* ---------- 存档 ---------- */
const Save = {
  KEY: 'nct_dream_llk_v1',
  data: { unlocked: 0, stars: {}, best: {}, endlessBest: 0, settings: { sfx: true, music: true } },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const d = JSON.parse(raw);
        this.data = Object.assign(this.data, d);
        this.data.settings = Object.assign({ sfx: true, music: true }, d.settings || {});
      }
    } catch (e) { /* 忽略损坏存档 */ }
    return this.data;
  },

  write() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* 隐私模式等 */ }
  },

  recordWin(levelIdx, stars, score) {
    const d = this.data;
    if (levelIdx + 1 > d.unlocked) d.unlocked = Math.min(levelIdx + 1, LEVELS.length - 1);
    if (levelIdx >= 0) {
      d.stars[levelIdx] = Math.max(d.stars[levelIdx] || 0, stars);
      d.best[levelIdx] = Math.max(d.best[levelIdx] || 0, score);
    }
    this.write();
  },

  recordEndless(rounds, score) {
    this.data.endlessBest = Math.max(this.data.endlessBest, rounds);
    this.write();
  },

  reset() {
    this.data = { unlocked: 0, stars: {}, best: {}, endlessBest: 0, settings: this.data.settings };
    this.write();
  }
};
