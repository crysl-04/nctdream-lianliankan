'use strict';
/* ============================================================
 * NCT DREAM 连连看 - UI 层（渲染 / 动画 / 弹窗 / 交互）
 * ============================================================ */

const UI = {
  els: {},
  tileEls: new Map(),
  cellSize: 48,
  toastTimer: null,

  /* ---------- 初始化 ---------- */
  init() {
    const $ = id => document.getElementById(id);
    this.els = {
      screenMenu: $('screen-menu'), screenGame: $('screen-game'),
      btnClassic: $('btn-classic'), btnEndless: $('btn-endless'),
      btnDaily: $('btn-daily'), btnAchievements: $('btn-achievements'),
      btnLevels: $('btn-levels'), btnAbout: $('btn-about'), btnSettings: $('btn-settings'),
      menuStats: $('menu-stats'),
      btnExit: $('btn-exit'), hudLevelName: $('hud-level-name'), hudMode: $('hud-mode'),
      hudScore: $('hud-score'), hudCombo: $('hud-combo'), btnSound: $('btn-sound'),
      timerFill: $('timer-fill'), timerText: $('timer-text'),
      boardWrap: $('board-wrap'), board: $('board'), lineLayer: $('line-layer'),
      btnHint: $('btn-hint'), cntHint: $('cnt-hint'),
      btnShuffle: $('btn-shuffle'), cntShuffle: $('cnt-shuffle'),
      btnClock: $('btn-clock'), cntClock: $('cnt-clock'),
      btnRestart: $('btn-restart'),
      modalMask: $('modal-mask'), modal: $('modal'), toast: $('toast'),
      confetti: $('confetti'), bgDeco: $('bg-deco')
    };

    Save.load();
    SFX.enabled = Save.data.settings.sfx;
    SFX.musicOn = Save.data.settings.music;
    this.updateSoundIcon();

    this.spawnBgDeco();
    this.bindEvents();
    this.renderMenuStats();
    this.showScreen('menu');
  },

  bindEvents() {
    this.els.btnClassic.addEventListener('click', () => { SFX.ensure(); this.startClassic(Math.min(Save.data.unlocked, LEVELS.length - 1)); });
    this.els.btnEndless.addEventListener('click', () => { SFX.ensure(); this.startEndlessRun(); });
    this.els.btnDaily.addEventListener('click', () => { SFX.ensure(); this.startDailyRun(); });
    this.els.btnAchievements.addEventListener('click', () => this.showAchievementsModal());
    this.els.btnLevels.addEventListener('click', () => this.showLevelsModal());
    this.els.btnAbout.addEventListener('click', () => this.showAboutModal());
    this.els.btnSettings.addEventListener('click', () => this.showSettingsModal());
    this.els.btnExit.addEventListener('click', () => this.exitToMenu());
    this.els.btnSound.addEventListener('click', () => {
      SFX.ensure();
      Save.data.settings.sfx = SFX.toggleSfx();
      Save.write(); this.updateSoundIcon();
      this.toast(SFX.enabled ? '音效已开启 🔊' : '音效已关闭 🔇');
    });
    this.els.btnHint.addEventListener('click', () => this.hintAction());
    this.els.btnShuffle.addEventListener('click', () => this.shuffleAction());
    this.els.btnClock.addEventListener('click', () => this.clockAction());
    this.els.btnRestart.addEventListener('click', () => this.restartAction());
    this.els.modal.addEventListener('click', e => this.onModalClick(e));
    this.els.modalMask.addEventListener('click', e => { if (e.target === this.els.modalMask) this.closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.els.modal && !this.els.modal.classList.contains('hidden')) this.closeModal();
    });
  },

  spawnBgDeco() {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.textContent = BG_EMOJIS[i % BG_EMOJIS.length];
      s.style.left = (Math.random() * 96) + '%';
      s.style.animationDuration = (14 + Math.random() * 18) + 's';
      s.style.animationDelay = (-Math.random() * 20) + 's';
      s.style.fontSize = (16 + Math.random() * 22) + 'px';
      s.style.opacity = 0.25 + Math.random() * 0.3;
      this.els.bgDeco.appendChild(s);
    }
  },

  /* ---------- 屏幕切换 ---------- */
  showScreen(name) {
    this.els.screenMenu.classList.toggle('hidden', name !== 'menu');
    this.els.screenGame.classList.toggle('hidden', name !== 'game');
  },

  startClassic(idx) {
    Game.startClassic(idx);
    this.enterGame();
  },

  startEndlessRun() {
    Game.score = 0; Game.maxCombo = 0; Game.boardsCleared = 0;
    Game.startEndless(1);
    this.enterGame();
  },

  startDailyRun() {
    Game.score = 0; Game.maxCombo = 0;
    Game.startDaily(todayKey());
    this.enterGame();
  },

  enterGame() {
    this.showScreen('game');
    this.renderBoard();
    this.updateHUD();
    this.updateItems();
    this.onTick();
    SFX.ensure();
    if (SFX.musicOn) SFX.startMusic();
  },

  exitToMenu() {
    Game.stopTimer();
    Game.state = 'idle';
    this.closeModal();
    this.renderMenuStats();
    this.showScreen('menu');
  },

  /* ---------- 棋盘渲染 ---------- */
  renderBoard() {
    const board = this.els.board;
    board.innerHTML = '';
    this.tileEls.clear();
    const R = Game.R(), C = Game.C();
    board.style.gridTemplateColumns = `repeat(${C}, var(--cell))`;
    board.style.gridTemplateRows = `repeat(${R}, var(--cell))`;

    for (const t of Game.tiles) {
      const m = memberByType(t.type);
      const btn = document.createElement('button');
      btn.className = 'tile';
      btn.style.gridRow = (t.r + 1);
      btn.style.gridColumn = (t.c + 1);
      btn.style.setProperty('--mcolor', m.color);
      btn.style.setProperty('--mcolor-light', m.light);
      btn.setAttribute('aria-label', m.cn + ' ' + m.name);
      btn.innerHTML = `<span class="tile-inner">${avatarSVG(m, 60)}<span class="tile-name">${m.name}</span></span>`;
      btn.addEventListener('click', () => this.onTileClick(t));
      board.appendChild(btn);
      this.tileEls.set(t, btn);
    }
    this.layoutBoard();
  },

  layoutBoard() {
    if (!Game.rows || this.els.screenGame.classList.contains('hidden')) return;
    const R = Game.R(), C = Game.C();
    const availW = Math.min(window.innerWidth - 20, 1060);
    const availH = window.innerHeight - 200;
    const cell = Math.max(20, Math.min(Math.floor(availW / C), Math.floor(availH / R), 74));
    this.cellSize = cell;
    this.els.board.style.setProperty('--cell', cell + 'px');
    this.els.board.classList.toggle('compact', cell < 46);
    const svg = this.els.lineLayer;
    svg.setAttribute('width', C * cell);
    svg.setAttribute('height', R * cell);
    svg.setAttribute('viewBox', `0 0 ${C * cell} ${R * cell}`);
  },

  refreshAllTiles() {
    for (const t of Game.tiles) {
      const el = this.tileEls.get(t);
      if (!el) continue;
      const m = memberByType(t.type);
      el.style.setProperty('--mcolor', m.color);
      el.style.setProperty('--mcolor-light', m.light);
      el.setAttribute('aria-label', m.cn + ' ' + m.name);
      el.innerHTML = `<span class="tile-inner">${avatarSVG(m, 60)}<span class="tile-name">${m.name}</span></span>`;
    }
    this.updateSelection();
  },

  updateSelection() {
    for (const [t, el] of this.tileEls) {
      el.classList.toggle('selected', Game.selected === t && t.alive);
    }
  },

  /* ---------- 点击卡片 ---------- */
  onTileClick(t) {
    if (Game.state !== 'playing' || !t.alive) return;
    SFX.ensure();
    const res = Game.tryMatch(t);

    if (res.status === 'select' || res.status === 'deselect') {
      SFX.select();
      this.updateSelection();
      return;
    }

    if (res.status === 'matched') {
      const aEl = this.tileEls.get(res.a), bEl = this.tileEls.get(res.b);
      const color = memberByType(res.a.type).color;
      SFX.match(res.combo);
      this.drawPath(res.path, color);
      if (aEl) aEl.classList.add('matched');
      if (bEl) bEl.classList.add('matched');
      this.updateSelection();
      const mx = (aEl.offsetLeft + bEl.offsetLeft) / 2 + this.cellSize / 2;
      const my = (aEl.offsetTop + bEl.offsetTop) / 2 + this.cellSize / 2;
      this.comboPopup(mx, my, res);
      this.updateHUD();

      setTimeout(() => {
        if (aEl) aEl.classList.add('dead');
        if (bEl) bEl.classList.add('dead');
        if (Game.remaining() === 0) { this.onWin(); return; }
        if (Game.autoShuffleIfNeeded()) {
          this.refreshAllTiles();
          this.toast('无路可走，自动洗牌 🔀');
        }
      }, 300);
      return;
    }

    /* mismatch */
    SFX.mismatch();
    const fa = this.tileEls.get(res.a), fb = this.tileEls.get(res.b);
    if (fa) { fa.classList.add('shake'); setTimeout(() => fa.classList.remove('shake'), 350); }
    if (fb) { fb.classList.add('shake'); setTimeout(() => fb.classList.remove('shake'), 350); }
    this.updateSelection();
  },

  /* ---------- 连线动画 ---------- */
  drawPath(path, color) {
    const svg = this.els.lineLayer;
    const cell = this.cellSize;
    const pts = path.map(p => `${(p.c + 0.5) * cell},${(p.r + 0.5) * cell}`).join(' ');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'line-group');
    g.innerHTML = `
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="5"
        stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      <polyline points="${pts}" fill="none" stroke="#ffffff" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`;
    svg.appendChild(g);
    setTimeout(() => g.remove(), 520);
  },

  comboPopup(x, y, res) {
    const div = document.createElement('div');
    div.className = 'combo-pop';
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    if (Game.sameTypeStreak >= 3) {
      /* 彩蛋：连续消除同一成员触发专属欢呼 */
      const m = memberByType(res.a.type);
      div.textContent = `${m.name} TIME! x${Game.sameTypeStreak} ${m.emoji}`;
      div.classList.add('hot');
    } else if (res.combo >= 2) {
      const phrase = PHRASES[(Math.random() * PHRASES.length) | 0];
      div.textContent = `${res.combo} 连击 · ${phrase}`;
      div.classList.add('hot');
    } else {
      div.textContent = '+' + res.gain;
    }
    this.els.boardWrap.appendChild(div);
    setTimeout(() => div.remove(), 950);
  },

  /* ---------- HUD ---------- */
  updateHUD() {
    if (Game.mode === 'classic') {
      const L = LEVELS[Game.levelIdx];
      this.els.hudLevelName.textContent = `第 ${Game.levelIdx + 1} 关 · ${L.song}`;
      this.els.hudMode.textContent = '闯关模式';
    } else if (Game.mode === 'daily') {
      this.els.hudLevelName.textContent = `每日挑战 · ${Game.dailyDate}`;
      this.els.hudMode.textContent = '每日挑战';
    } else {
      this.els.hudLevelName.textContent = `第 ${Game.endlessRound} 轮`;
      this.els.hudMode.textContent = '无尽模式';
    }
    this.els.hudScore.textContent = Game.score;
    this.els.hudCombo.textContent = 'x' + Game.combo;
    this.els.hudCombo.classList.toggle('lit', Game.combo >= 2);
  },

  updateItems() {
    this.els.cntHint.textContent = Game.items.hint;
    this.els.cntShuffle.textContent = Game.items.shuffle;
    this.els.cntClock.textContent = Game.items.clock;
    this.els.btnHint.classList.toggle('empty', Game.items.hint <= 0);
    this.els.btnShuffle.classList.toggle('empty', Game.items.shuffle <= 0);
    this.els.btnClock.classList.toggle('empty', Game.items.clock <= 0);
  },

  onTick() {
    if (Game.state !== 'playing') return;
    const ratio = Math.max(0, Game.timeLeft / Game.levelSeconds);
    this.els.timerFill.style.width = (ratio * 100) + '%';
    this.els.timerFill.classList.toggle('danger', ratio < 0.28);
    const m = Math.floor(Math.max(0, Game.timeLeft) / 60);
    const s = Math.max(0, Game.timeLeft) % 60;
    this.els.timerText.textContent = `${m}:${String(s).padStart(2, '0')}`;
  },

  updateSoundIcon() {
    this.els.btnSound.textContent = SFX.enabled ? '🔊' : '🔇';
  },

  /* ---------- 道具 ---------- */
  hintAction() {
    const pair = Game.useHint();
    if (!pair) { this.toast(Game.items.hint <= 0 ? '提示次数已用完 💡' : '暂时没有可消除的'); return; }
    SFX.hintFx();
    this.updateItems();
    for (const t of pair) {
      const el = this.tileEls.get(t);
      if (el) { el.classList.add('hinted'); setTimeout(() => el.classList.remove('hinted'), 2200); }
    }
  },

  shuffleAction() {
    if (!Game.useShuffle()) { this.toast('洗牌次数已用完 🔀'); return; }
    SFX.shuffleFx();
    this.els.board.classList.add('shuffling');
    this.refreshAllTiles();
    setTimeout(() => this.els.board.classList.remove('shuffling'), 500);
    this.updateItems();
  },

  clockAction() {
    if (!Game.useClock()) { this.toast('加时道具已用完 ⏰'); return; }
    SFX.clockFx();
    this.toast('时间 +20 秒 ⏰');
    this.onTick();
    this.updateItems();
  },

  restartAction() {
    if (Game.mode === 'classic') Game.startClassic(Game.levelIdx);
    else if (Game.mode === 'daily') Game.startDaily(Game.dailyDate);
    else Game.startEndless(Game.endlessRound);
    this.renderBoard();
    this.updateHUD();
    this.updateItems();
    this.onTick();
    this.closeModal();
    this.toast('已重新开始 ↻');
  },

  /* ---------- 分享战绩 ---------- */
  shareScore() {
    let text = '';
    const site = location.origin + location.pathname;
    if (Game.mode === 'classic') {
      const L = LEVELS[Game.levelIdx];
      const stars = '⭐'.repeat(Game.stars());
      text = `🌈 NCT DREAM 连连看\n🎶 第${Game.levelIdx + 1}关《${L.song}》${stars}\n💯 得分 ${Game.score} · 最高连击 x${Game.maxCombo}${Game.itemsUsed ? '' : ' · 零道具通关!'}`;
    } else if (Game.mode === 'daily') {
      const stars = '⭐'.repeat(Game.stars());
      text = `🌈 NCT DREAM 连连看 · 每日挑战\n📅 ${Game.dailyDate} ${stars}\n💯 得分 ${Game.score} · 最高连击 x${Game.maxCombo}`;
    } else {
      text = `🌈 NCT DREAM 连连看 · 无尽模式\n♾️ 通过 ${Game.boardsCleared} 轮\n💯 总分 ${Game.score}`;
    }
    text += `\n▶ ${site}`;
    const done = () => this.toast('战绩已复制，去分享吧 📋');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text, done));
    } else {
      this.fallbackCopy(text, done);
    }
  },

  fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { this.toast('复制失败，请手动截图分享'); }
    ta.remove();
  },

  /* ---------- 成就 ---------- */
  checkAchievements(context) {
    const d = Save.data;
    const totalStars = Object.values(d.stars).reduce((a, b) => a + b, 0);
    const clearedCount = Object.keys(d.stars).length;
    const ids = [];
    if (context === 'win' || context === 'daily') {
      if (clearedCount >= 1 || context === 'daily') ids.push('first_win');
      if (Game.maxCombo >= 5) ids.push('combo5');
      if (Game.maxCombo >= 10) ids.push('combo10');
      if (Game.score > 500) ids.push('score500');
      if (Game.itemsUsed === 0) ids.push('no_item');
    }
    if (context === 'win' && Game.mode === 'classic') {
      if (Game.levelIdx >= 6) ids.push('level7');
      if (Game.levelIdx >= LEVELS.length - 1) ids.push('clear_all');
    }
    if (context === 'daily') ids.push('daily');
    if (context === 'endless') {
      if (Game.boardsCleared >= 3) ids.push('endless3');
      if (Game.boardsCleared >= 6) ids.push('endless6');
    }
    if (totalStars >= 12) ids.push('stars12');
    if (LEVELS.length > 0 && Object.values(d.stars).filter(s => s === 3).length >= LEVELS.length) ids.push('all_stars');
    const fresh = Save.unlockAchievements(ids);
    if (fresh.length) {
      const names = fresh.map(id => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        return a ? `${a.icon}${a.name}` : id;
      });
      setTimeout(() => this.toast('🏅 成就解锁：' + names.join('、')), 600);
      this.renderMenuStats();
    }
  },

  showAchievementsModal() {
    const got = Save.data.achievements;
    const items = ACHIEVEMENTS.map(a => {
      const unlocked = got.includes(a.id);
      return `<div class="ach-card ${unlocked ? 'on' : 'off'}">
        <span class="ach-icon">${unlocked ? a.icon : '🔒'}</span>
        <span class="ach-text"><b>${a.name}</b><small>${a.desc}</small></span>
      </div>`;
    }).join('');
    this.showModal(`
      <h2 class="modal-title">成就 ${got.length}/${ACHIEVEMENTS.length} 🏅</h2>
      <div class="ach-grid">${items}</div>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">关闭</button></div>`);
  },

  /* ---------- 胜负 ---------- */
  onWin() {
    const bonus = Game.finishWin();
    SFX.win();
    this.confetti();
    this.updateHUD();
    this.checkAchievements('win');

    const statsLine = `<p class="modal-lines">消除奖励 <b>+${bonus}</b> · 总分 <b>${Game.score}</b> · 最高连击 <b>x${Game.maxCombo}</b>${Game.itemsUsed ? ` · 用了 ${Game.itemsUsed} 个道具` : ' · 零道具'}</p>`;

    if (Game.mode === 'classic') {
      const stars = Game.stars();
      Save.recordWin(Game.levelIdx, stars, Game.score);
      const isLast = Game.levelIdx >= LEVELS.length - 1;
      const starStr = '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
      this.showModal(`
        <div class="win-face">${avatarSVG(MEMBERS[Game.levelIdx % MEMBERS.length], 90)}</div>
        <h2 class="modal-title">${isLast ? '全部关卡完成！🎉' : '关卡完成！'}</h2>
        <div class="stars">${starStr}</div>
        ${statsLine}
        <p class="modal-sub">最佳成绩：${Save.data.best[Game.levelIdx] || Game.score}</p>
        <div class="modal-actions">
          ${isLast ? '' : '<button class="btn primary" data-action="next-level">下一关 ▶</button>'}
          <button class="btn ghost" data-action="share-score">📋 分享</button>
          <button class="btn ghost" data-action="replay">再玩一次 ↻</button>
          <button class="btn ghost" data-action="menu">返回菜单 🏠</button>
        </div>`);
    } else if (Game.mode === 'daily') {
      const stars = Game.stars();
      const isNewBest = Save.recordDaily(Game.dailyDate, Game.score, stars);
      this.checkAchievements('daily');
      const starStr = '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
      this.showModal(`
        <div class="win-face">${avatarSVG(MEMBERS[djb2Hash(Game.dailyDate) % MEMBERS.length], 90)}</div>
        <h2 class="modal-title">每日挑战完成！📅</h2>
        <div class="stars">${starStr}</div>
        ${statsLine}
        <p class="modal-sub">${isNewBest ? '🎊 刷新今日最佳！' : '今日最佳：' + Save.data.daily[Game.dailyDate].score}</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="share-score">📋 分享战绩</button>
          <button class="btn ghost" data-action="replay">再挑战一次 ↻</button>
          <button class="btn ghost" data-action="menu">返回菜单 🏠</button>
        </div>`);
    } else {
      Save.recordEndless(Game.boardsCleared, Game.score);
      this.checkAchievements('endless');
      this.showModal(`
        <div class="win-face">${avatarSVG(MEMBERS[(Game.boardsCleared) % MEMBERS.length], 90)}</div>
        <h2 class="modal-title">第 ${Game.endlessRound} 轮完成！</h2>
        <p class="modal-lines">总进度 <b>${Game.boardsCleared}</b> 轮 · 总分 <b>${Game.score}</b> · 最高连击 <b>x${Game.maxCombo}</b></p>
        <p class="modal-sub">无尽最佳：${Save.data.endlessBest} 轮</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="endless-next">下一轮 ▶</button>
          <button class="btn ghost" data-action="menu">返回菜单 🏠</button>
        </div>`);
    }
  },

  onLose() {
    SFX.lose();
    if (Game.mode === 'classic') {
      this.showModal(`
        <div class="lose-face">⏰</div>
        <h2 class="modal-title">时间到啦！</h2>
        <p class="modal-lines">${LEVELS[Game.levelIdx].song} · 得分 <b>${Game.score}</b></p>
        <p class="modal-sub">提示：优先消除被围住的卡片，连击有额外加分</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="replay">再试一次 ↻</button>
          <button class="btn ghost" data-action="menu">返回菜单 🏠</button>
        </div>`);
    } else if (Game.mode === 'daily') {
      this.showModal(`
        <div class="lose-face">⏰</div>
        <h2 class="modal-title">今天的挑战没成功…</h2>
        <p class="modal-lines">每日挑战 · 得分 <b>${Game.score}</b></p>
        <p class="modal-sub">棋盘每天固定，摸清布局明天再战或现在再试一次！</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="replay">再试一次 ↻</button>
          <button class="btn ghost" data-action="menu">返回菜单 🏠</button>
        </div>`);
    } else {
      Save.recordEndless(Game.boardsCleared, Game.score);
      this.showModal(`
        <div class="lose-face">😴</div>
        <h2 class="modal-title">无尽模式结束</h2>
        <p class="modal-lines">共通过 <b>${Game.boardsCleared}</b> 轮 · 总分 <b>${Game.score}</b></p>
        <p class="modal-sub">历史最佳：${Save.data.endlessBest} 轮</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="endless-again">再来一局 ▶</button>
          <button class="btn ghost" data-action="menu">返回菜单 🏠</button>
        </div>`);
    }
  },

  /* ---------- 弹窗 ---------- */
  showModal(html) {
    this.els.modal.innerHTML = html;
    this.els.modal.classList.remove('hidden');
    this.els.modalMask.classList.remove('hidden');
  },

  closeModal() {
    this.els.modal.classList.add('hidden');
    this.els.modalMask.classList.add('hidden');
  },

  onModalClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const act = btn.dataset.action;
    switch (act) {
      case 'next-level': {
        const next = Game.levelIdx + 1;
        Game.startClassic(next);
        this.renderBoard(); this.updateHUD(); this.updateItems(); this.onTick(); this.closeModal();
        break;
      }
      case 'endless-next':
        Game.startEndless(Game.endlessRound + 1);
        this.renderBoard(); this.updateHUD(); this.updateItems(); this.onTick(); this.closeModal();
        break;
      case 'endless-again':
        Game.score = 0; Game.maxCombo = 0; Game.boardsCleared = 0;
        Game.startEndless(1);
        this.renderBoard(); this.updateHUD(); this.updateItems(); this.onTick(); this.closeModal();
        break;
      case 'replay': this.restartAction(); break;
      case 'menu': this.exitToMenu(); break;
      case 'close-modal': this.closeModal(); break;
      case 'share-score': this.shareScore(); break;
      case 'start-level': this.startClassic(parseInt(btn.dataset.idx, 10)); this.closeModal(); break;
      case 'toggle-sfx': {
        SFX.ensure();
        Save.data.settings.sfx = SFX.toggleSfx();
        Save.write(); this.updateSoundIcon();
        this.showSettingsModal();
        break;
      }
      case 'toggle-music': {
        SFX.ensure();
        Save.data.settings.music = SFX.toggleMusic();
        Save.write();
        this.showSettingsModal();
        break;
      }
      case 'reset-progress': {
        if (btn.dataset.armed) { Save.reset(); this.renderMenuStats(); this.showSettingsModal(); this.toast('进度已重置'); }
        else { btn.dataset.armed = '1'; btn.textContent = '⚠️ 再点一次确认重置'; }
        break;
      }
    }
  },

  showLevelsModal() {
    const unlocked = Save.data.unlocked;
    const items = LEVELS.map((L, i) => {
      const locked = i > unlocked;
      const stars = Save.data.stars[i] || 0;
      const starStr = '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
      return `<button class="level-card ${locked ? 'locked' : ''}" data-action="start-level" data-idx="${i}" ${locked ? 'disabled' : ''}>
        <span class="lv-num">${i + 1}</span>
        <span class="lv-song">${L.song}</span>
        <span class="lv-cn">${L.cn} · ${L.year}</span>
        <span class="lv-stars">${locked ? '🔒' : starStr}</span>
      </button>`;
    }).join('');
    this.showModal(`
      <h2 class="modal-title">选择关卡 🗺️</h2>
      <div class="level-grid">${items}</div>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">关闭</button></div>`);
  },

  showAboutModal() {
    const cards = MEMBERS.map(m => `
      <div class="member-card" style="--mcolor:${m.color};--mcolor-light:${m.light}">
        <div class="member-avatar">${avatarSVG(m, 84)}</div>
        <div class="member-info">
          <h3>${m.name} <small>${m.kr}</small></h3>
          <p class="member-cn">${m.cn} · ${m.emoji}</p>
          <p class="member-meta">🎂 ${m.birth} · ${m.pos}</p>
          <p class="member-fun">${m.fun}</p>
        </div>
      </div>`).join('');
    this.showModal(`
      <h2 class="modal-title">NCT DREAM 成员图鉴 💚</h2>
      <div class="member-list">${cards}</div>
      <p class="modal-sub">NCT DREAM 是 SM 娱乐旗下的七人男子组合，粉丝名 NCTzen。本页面头像是代码绘制的卡通形象，非官方图片。</p>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">关闭</button></div>`);
  },

  showSettingsModal() {
    this.showModal(`
      <h2 class="modal-title">设置 ⚙️</h2>
      <div class="setting-row">
        <span>游戏音效</span>
        <button class="switch ${SFX.enabled ? 'on' : ''}" data-action="toggle-sfx">${SFX.enabled ? 'ON' : 'OFF'}</button>
      </div>
      <div class="setting-row">
        <span>背景音乐</span>
        <button class="switch ${SFX.musicOn ? 'on' : ''}" data-action="toggle-music">${SFX.musicOn ? 'ON' : 'OFF'}</button>
      </div>
      <div class="setting-row">
        <span>重置所有进度</span>
        <button class="btn danger small" data-action="reset-progress">重置</button>
      </div>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">关闭</button></div>`);
  },

  renderMenuStats() {
    const d = Save.data;
    const totalStars = Object.values(d.stars).reduce((a, b) => a + b, 0);
    const today = d.daily[todayKey()];
    const dailyStr = today ? `今日挑战 ⭐${today.stars} ${today.score}分` : '今日挑战未完成';
    this.els.menuStats.textContent =
      `闯关 ${Math.min(d.unlocked + 1, LEVELS.length)}/${LEVELS.length} · ⭐ ${totalStars}/${LEVELS.length * 3} · 无尽 ${d.endlessBest} 轮 · 🏅 ${d.achievements.length}/${ACHIEVEMENTS.length} · ${dailyStr}`;
  },

  /* ---------- 杂项特效 ---------- */
  toast(msg) {
    const t = this.els.toast;
    t.textContent = msg;
    t.classList.remove('hidden');
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { t.classList.remove('show'); t.classList.add('hidden'); }, 1800);
  },

  confetti() {
    const cv = this.els.confetti;
    const ctx = cv.getContext('2d');
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    const colors = MEMBERS.map(m => m.color).concat(['#fbbf24', '#ffffff', '#f472b6']);
    const parts = Array.from({ length: 150 }, () => ({
      x: Math.random() * cv.width,
      y: -30 - Math.random() * cv.height * 0.6,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      vy: 2 + Math.random() * 3.4,
      vx: -1.6 + Math.random() * 3.2,
      rot: Math.random() * Math.PI,
      vr: -0.12 + Math.random() * 0.24,
      color: colors[(Math.random() * colors.length) | 0]
    }));
    let frames = 0;
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (++frames < 230) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    requestAnimationFrame(tick);
  }
};
