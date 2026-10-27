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
      btnHistory: $('btn-history'), btnHowto: $('btn-howto'),
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
      confetti: $('confetti'), bgDeco: $('bg-deco'), dailyCal: $('daily-cal')
    };

    Save.load();
    SFX.enabled = Save.data.settings.sfx;
    SFX.musicOn = Save.data.settings.music;
    this.applyTheme();
    this.updateSoundIcon();

    this.spawnBgDeco();
    this.bindEvents();
    this.bindKeyboard();
    this.applyStaticI18n();
    this.renderMenuStats();
    this.showScreen('menu');
  },

  /* 静态文案随语言设置刷新（菜单按钮、HUD、道具栏、页脚） */
  applyStaticI18n() {
    const map = {
      'btn-classic': 'startClassic', 'btn-daily': 'startDaily', 'btn-endless': 'startEndless',
      'btn-levels': 'levels', 'btn-about': 'about', 'btn-howto': 'howto', 'btn-achievements': 'achievements',
      'btn-history': 'history', 'btn-settings': 'settings',
      'menu-slogan': 'slogan', 'menu-foot': 'menuFoot',
      'hud-score-label': 'score', 'hud-combo-label': 'combo',
      'item-hint-label': 'itemHint', 'item-shuffle-label': 'itemShuffle',
      'item-clock-label': 'itemClock', 'item-restart-label': 'itemRestart'
    };
    for (const id in map) {
      const el = document.getElementById(id);
      if (el) el.textContent = t(map[id]);
    }
    const ver = document.getElementById('menu-version');
    if (ver) ver.textContent = 'v2.0 · Made with 💚 for NCTzens';
    this.renderMenuStats(); /* 每日按钮文案也依赖语言 */
  },

  applyTheme() {
    document.body.dataset.theme = Save.data.settings.theme === 'candy' ? 'candy' : 'dream';
  },

  /* 键盘操作：方向键移动光标，空格/回车选中，H 提示，Esc 取消 */
  bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!this.els.modal.classList.contains('hidden')) { this.closeModal(); return; }
        if (!this.els.screenGame.classList.contains('hidden') && Game.selected) {
          Game.selected = null;
          this.updateSelection();
        }
        return;
      }
      if (this.els.screenGame.classList.contains('hidden')) return;
      if (!this.els.modal.classList.contains('hidden')) return;
      if (Game.state !== 'playing') return;

      const move = (dr, dc) => {
        if (!this.cursor) this.cursor = { r: Math.ceil(Game.rows / 2), c: Math.ceil(Game.cols / 2) };
        this.cursor.r = Math.min(Game.rows, Math.max(1, this.cursor.r + dr));
        this.cursor.c = Math.min(Game.cols, Math.max(1, this.cursor.c + dc));
        this.renderCursor();
        e.preventDefault();
      };
      switch (e.key) {
        case 'ArrowUp': move(-1, 0); break;
        case 'ArrowDown': move(1, 0); break;
        case 'ArrowLeft': move(0, -1); break;
        case 'ArrowRight': move(0, 1); break;
        case ' ': case 'Enter': {
          if (!this.cursor) break;
          const cell = Game.cellAt[this.cursor.r + ',' + this.cursor.c];
          if (cell && cell.alive) { e.preventDefault(); this.onTileClick(cell); }
          break;
        }
        case 'h': case 'H': this.hintAction(); break;
      }
    });
  },

  renderCursor() {
    for (const [t, el] of this.tileEls) el.classList.toggle('cursor', !!this.cursor && t.r === this.cursor.r && t.c === this.cursor.c);
  },

  bindEvents() {
    this.els.btnClassic.addEventListener('click', () => { SFX.ensure(); this.startClassic(Math.min(Save.data.unlocked, LEVELS.length - 1)); });
    this.els.btnEndless.addEventListener('click', () => { SFX.ensure(); this.startEndlessRun(); });
    this.els.btnDaily.addEventListener('click', () => { SFX.ensure(); this.startDailyRun(); });
    this.els.btnAchievements.addEventListener('click', () => this.showAchievementsModal());
    this.els.btnHistory.addEventListener('click', () => this.showHistoryModal());
    this.els.btnHowto.addEventListener('click', () => this.showHowtoModal());
    this.els.btnLevels.addEventListener('click', () => this.showLevelsModal());
    this.els.btnAbout.addEventListener('click', () => this.showAboutModal());
    this.els.btnSettings.addEventListener('click', () => this.showSettingsModal());
    this.els.btnExit.addEventListener('click', () => {
      /* 局中退出需确认，防误触 */
      if (Game.state === 'playing' && Game.remaining() > 0 && Game.remaining() < Game.tiles.length) {
        this.showModal(`
          <h2 class="modal-title">${t('exitTitle')}</h2>
          <p class="modal-sub">${t('exitSub')}</p>
          <div class="modal-actions">
            <button class="btn primary" data-action="close-modal">${t('exitNo')}</button>
            <button class="btn ghost" data-action="menu">${t('exitYes')}</button>
          </div>`);
      } else {
        this.exitToMenu();
      }
    });
    this.els.btnSound.addEventListener('click', () => {
      SFX.ensure();
      Save.data.settings.sfx = SFX.toggleSfx();
      Save.write(); this.updateSoundIcon();
      this.toast(SFX.enabled ? t('toastSfxOn') : t('toastSfxOff'));
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
    SFX.startFx();
    if (SFX.musicOn) SFX.startMusic();
    /* 手机竖屏 + 大棋盘时提示横屏 */
    if (window.innerHeight > window.innerWidth && this.cellSize < 30) {
      setTimeout(() => this.toast(t('toastLandscape')), 900);
    }
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
    this.cursor = null;
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
    /* 入场动画：按序号错峰弹出 */
    let idx = 0;
    for (const el of this.tileEls.values()) {
      el.classList.add('enter');
      el.style.animationDelay = Math.min(idx * 8, 640) + 'ms';
      idx++;
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
          this.toast(t('toastAutoShuffle'));
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
      div.textContent = tf('comboN', { n: res.combo, p: phrase });
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
      const hardTag = Game.difficulty === 'hard' ? '🔥 ' : '';
      this.els.hudLevelName.textContent = `${hardTag}${tf('levelLabel', { n: Game.levelIdx + 1, s: L.song })}`;
      this.els.hudMode.textContent = Game.difficulty === 'hard' ? t('hardMode') : t('classicMode');
    } else if (Game.mode === 'daily') {
      this.els.hudLevelName.textContent = tf('dailyLabel', { d: Game.dailyDate });
      this.els.hudMode.textContent = t('dailyMode');
    } else {
      this.els.hudLevelName.textContent = tf('roundLabel', { n: Game.endlessRound });
      this.els.hudMode.textContent = t('endlessMode');
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
    if (!pair) { this.toast(Game.items.hint <= 0 ? t('toastNoHint') : t('toastNoPairHint')); return; }
    SFX.hintFx();
    this.updateItems();
    for (const t of pair) {
      const el = this.tileEls.get(t);
      if (el) { el.classList.add('hinted'); setTimeout(() => el.classList.remove('hinted'), 2200); }
    }
  },

  shuffleAction() {
    if (!Game.useShuffle()) { this.toast(t('toastNoShuffle')); return; }
    SFX.shuffleFx();
    this.els.board.classList.add('shuffling');
    this.refreshAllTiles();
    setTimeout(() => this.els.board.classList.remove('shuffling'), 500);
    this.updateItems();
  },

  clockAction() {
    if (!Game.useClock()) { this.toast(t('toastNoClock')); return; }
    SFX.clockFx();
    this.toast(t('toastClock'));
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
    this.toast(t('toastRestart'));
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
    const done = () => this.toast(t('toastCopied'));
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
    try { document.execCommand('copy'); done(); } catch (e) { this.toast(t('toastCopyFail')); }
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
      if (Game.score > 1000) ids.push('score1000');
      if (Game.itemsUsed === 0) ids.push('no_item');
      if (Game.elapsedSec() > 600) ids.push('marathon');
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) ids.push('night_owl');
    }
    if (context === 'win' && Game.mode === 'classic') {
      if (Game.levelIdx >= 6) ids.push('level7');
      if (Game.levelIdx >= LEVELS.length - 1) ids.push('clear_all');
    }
    if (context === 'daily') {
      ids.push('daily');
      if (Save.dailyStreak() >= 3) ids.push('streak3');
    }
    if (context === 'endless') {
      if (Game.boardsCleared >= 3) ids.push('endless3');
      if (Game.boardsCleared >= 6) ids.push('endless6');
      if (Game.boardsCleared >= 10) ids.push('endless10');
    }
    if (totalStars >= 12) ids.push('stars12');
    if (totalStars >= 30) ids.push('stars30');
    if (LEVELS.length > 0 && Object.values(d.stars).filter(s => s === 3).length >= LEVELS.length) ids.push('all_stars');
    const fresh = Save.unlockAchievements(ids);
    if (fresh.length) {
      const names = fresh.map(id => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        return a ? `${a.icon}${achName(a)}` : id;
      });
      SFX.achieveFx();
      setTimeout(() => this.toast(tf('toastAch', { s: names.join('、')})), 600);
      this.renderMenuStats();
    }
  },

  /* 每日挑战连续打卡天数（以今天或昨天为终点） */
  dailyStreak() {
    return Save.dailyStreak();
  },

  showAchievementsModal() {
    const got = Save.data.achievements;
    const items = ACHIEVEMENTS.map(a => {
      const unlocked = got.includes(a.id);
      return `<div class="ach-card ${unlocked ? 'on' : 'off'}">
        <span class="ach-icon">${unlocked ? a.icon : '🔒'}</span>
        <span class="ach-text"><b>${achName(a)}</b><small>${achDesc(a)}</small></span>
      </div>`;
    }).join('');
    this.showModal(`
      <h2 class="modal-title">${tf('achTitle', { n: got.length, m: ACHIEVEMENTS.length })}</h2>
      <div class="ach-grid">${items}</div>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">${t('closeModal')}</button></div>`);
  },

  showHistoryModal() {
    const h = Save.data.history;
    const items = h.length
      ? h.map(e => `<div class="hist-row ${e.win ? 'win' : 'lose'}">
          <span class="hist-icon">${e.mode === 'daily' ? '📅' : e.mode === 'endless' ? '♾️' : '🚀'}</span>
          <span class="hist-label">${e.label}</span>
          <span class="hist-score">${e.win ? '' : t('histUnfinished')}${e.score} 分${e.elapsed ? ' · ' + e.elapsed + 's' : ''}</span>
          <span class="hist-time">${e.time}</span>
        </div>`).join('')
      : `<p class="modal-sub">${t('histEmpty')}</p>`;
    this.showModal(`
      <h2 class="modal-title">${t('histTitle')}</h2>
      <div class="hist-list">${items}</div>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">${t('closeModal')}</button></div>`);
  },

  /* ---------- 胜负 ---------- */
  onWin() {
    const bonus = Game.finishWin();
    SFX.win();
    this.confetti();
    this.updateHUD();
    this.checkAchievements('win');

    const statsLine = `<p class="modal-lines">${tf('bonusLine', { b: bonus, s: Game.score, c: Game.maxCombo, t: Game.elapsedSec() })}${Game.itemsUsed ? tf('usedItems', { n: Game.itemsUsed }) : t('zeroItems').replace(/^/, ' · ')}</p>`;

    if (Game.mode === 'classic') {
      const stars = Game.stars();
      const hard = Game.difficulty === 'hard';
      Save.recordWin(Game.levelIdx, stars, Game.score, hard);
      Save.pushHistory({ mode: "classic", label: `${hard ? '🔥' : ''}第${Game.levelIdx + 1}关 ${LEVELS[Game.levelIdx].song}`, score: Game.score, elapsed: Game.elapsedSec(), win: true });
      const isLast = Game.levelIdx >= LEVELS.length - 1;
      const starStr = '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
      this.showModal(`
        <div class="win-face">${avatarSVG(MEMBERS[Game.levelIdx % MEMBERS.length], 90)}</div>
        <h2 class="modal-title">${isLast ? t('allClearTitle') : t('winTitle')}</h2>
        <div class="stars">${starStr}</div>
        ${statsLine}
        <p class="modal-sub">${hard ? t('hardBonus') + ' · ' : ''}${tf('bestScore', { s: (hard ? Save.data.bestHard[Game.levelIdx] : Save.data.best[Game.levelIdx]) || Game.score })}</p>
        <div class="modal-actions">
          ${isLast ? '' : `<button class="btn primary" data-action="next-level">${t('nextLevel')}</button>`}
          <button class="btn ghost" data-action="share-score">${t('share')}</button>
          <button class="btn ghost" data-action="replay">${t('replay')}</button>
          <button class="btn ghost" data-action="menu">${t('toMenu')}</button>
        </div>`);
    } else if (Game.mode === 'daily') {
      const stars = Game.stars();
      const isNewBest = Save.recordDaily(Game.dailyDate, Game.score, stars);
      Save.pushHistory({ mode: 'daily', label: `每日挑战 ${Game.dailyDate}`, score: Game.score, elapsed: Game.elapsedSec(), win: true });
      this.checkAchievements('daily');
      const starStr = '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
      this.showModal(`
        <div class="win-face">${avatarSVG(MEMBERS[djb2Hash(Game.dailyDate) % MEMBERS.length], 90)}</div>
        <h2 class="modal-title">${t('dailyWinTitle')}</h2>
        <div class="stars">${starStr}</div>
        ${statsLine}
        <p class="modal-sub">${isNewBest ? t('newDailyBest') : tf('todayBest', { s: Save.data.daily[Game.dailyDate].score })}</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="share-score">${t('shareResult')}</button>
          <button class="btn ghost" data-action="replay">${t('retry')}</button>
          <button class="btn ghost" data-action="menu">${t('toMenu')}</button>
        </div>`);
    } else {
      Save.recordEndless(Game.boardsCleared, Game.score);
      Save.pushHistory({ mode: 'endless', label: `无尽 ${Game.boardsCleared} 轮`, score: Game.score, elapsed: Game.elapsedSec(), win: true });
      this.checkAchievements('endless');
      this.showModal(`
        <div class="win-face">${avatarSVG(MEMBERS[(Game.boardsCleared) % MEMBERS.length], 90)}</div>
        <h2 class="modal-title">${tf('roundWinTitle', { n: Game.endlessRound })}</h2>
        <p class="modal-lines">${tf('totalProgress', { n: Game.boardsCleared, s: Game.score })}</p>
        <p class="modal-sub">${tf('endlessBest', { n: Save.data.endlessBest })}</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="endless-next">${t('endlessNext')}</button>
          <button class="btn ghost" data-action="menu">${t('toMenu')}</button>
        </div>`);
    }
  },

  onLose() {
    SFX.lose();
    if (Game.mode === 'classic') {
      Save.pushHistory({ mode: 'classic', label: `第${Game.levelIdx + 1}关 ${LEVELS[Game.levelIdx].song}`, score: Game.score, elapsed: Game.elapsedSec(), win: false });
      this.showModal(`
        <div class="lose-face">⏰</div>
        <h2 class="modal-title">${t('loseTitle')}</h2>
        <p class="modal-lines">${LEVELS[Game.levelIdx].song} · ${t('score')} <b>${Game.score}</b></p>
        <p class="modal-sub">${t('loseHint')}</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="replay">${t('retry')}</button>
          <button class="btn ghost" data-action="menu">${t('toMenu')}</button>
        </div>`);
    } else if (Game.mode === 'daily') {
      this.showModal(`
        <div class="lose-face">⏰</div>
        <h2 class="modal-title">${t('dailyLoseTitle')}</h2>
        <p class="modal-lines">${t('dailyMode')} · ${t('score')} <b>${Game.score}</b></p>
        <p class="modal-sub">${t('dailyLoseSub')}</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="replay">${t('retry')}</button>
          <button class="btn ghost" data-action="menu">${t('toMenu')}</button>
        </div>`);
    } else {
      Save.recordEndless(Game.boardsCleared, Game.score);
      this.showModal(`
        <div class="lose-face">😴</div>
        <h2 class="modal-title">${t('endlessLoseTitle')}</h2>
        <p class="modal-lines">${tf('totalProgress', { n: Game.boardsCleared, s: Game.score })}</p>
        <p class="modal-sub">${tf('endlessBest', { n: Save.data.endlessBest })}</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="endless-again">${t('endlessAgain')}</button>
          <button class="btn ghost" data-action="menu">${t('toMenu')}</button>
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
      case 'cycle-theme': {
        Save.data.settings.theme = Save.data.settings.theme === 'candy' ? 'dream' : 'candy';
        Save.write();
        this.applyTheme();
        this.showSettingsModal();
        break;
      }
      case 'cycle-lang': {
        Save.data.settings.lang = Save.data.settings.lang === 'en' ? 'zh' : 'en';
        Save.write();
        this.applyStaticI18n();
        this.showSettingsModal();
        break;
      }
      case 'cycle-difficulty': {
        Save.data.settings.difficulty = Save.data.settings.difficulty === 'hard' ? 'normal' : 'hard';
        Save.write();
        this.showSettingsModal();
        break;
      }
      case 'reset-progress': {
        if (btn.dataset.armed) { Save.reset(); this.renderMenuStats(); this.showSettingsModal(); this.toast(t('toastReset')); }
        else { btn.dataset.armed = '1'; btn.textContent = t('resetConfirm'); }
        break;
      }
    }
  },

  showHowtoModal() {
    this.showModal(`
      <h2 class="modal-title">${t('howtoTitle')}</h2>
      <div class="howto">
        <p>${t('howto1')}</p>
        <p>${t('howto2')}</p>
        <p>${t('howto3')}</p>
        <p class="howto-keys">${t('howtoKeys')}</p>
      </div>
      <div class="modal-actions">
        <button class="btn primary" data-action="start-level" data-idx="0">${t('startClassic')}</button>
        <button class="btn ghost" data-action="close-modal">${t('closeModal')}</button>
      </div>`);
  },

  showLevelsModal() {
    const unlocked = Save.data.unlocked;
    const items = LEVELS.map((L, i) => {
      const locked = i > unlocked;
      const stars = Save.data.stars[i] || 0;
      const hardStars = Save.data.starsHard[i] || 0;
      const starStr = '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
      return `<button class="level-card ${locked ? 'locked' : ''}" data-action="start-level" data-idx="${i}" ${locked ? 'disabled' : ''}>
        <span class="lv-num">${i + 1}</span>
        <span class="lv-song">${L.song}</span>
        <span class="lv-cn">${L.cn} · ${L.year}</span>
        <span class="lv-stars">${locked ? '🔒' : starStr}${hardStars ? `<span class="lv-hard">🔥${hardStars}</span>` : ''}</span>
      </button>`;
    }).join('');
    this.showModal(`
      <h2 class="modal-title">${t('levelsTitle')}</h2>
      <div class="level-grid">${items}</div>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">${t('closeModal')}</button></div>`);
  },

  showAboutModal() {
    const cards = MEMBERS.map(m => `
      <div class="member-card" style="--mcolor:${m.color};--mcolor-light:${m.light}">
        <div class="member-avatar">${avatarSVG(m, 84)}</div>
        <div class="member-info">
          <h3>${m.name} <small>${m.kr}</small></h3>
          <p class="member-cn">${m.cn} · ${m.emoji}</p>
          <p class="member-meta">🎂 ${m.birth} · ${m.pos}</p>
          <p class="member-fun">${memberFun(m)}</p>
        </div>
      </div>`).join('');
    this.showModal(`
      <h2 class="modal-title">${t('aboutTitle')}</h2>
      <div class="member-list">${cards}</div>
      <p class="modal-sub">${t('aboutNote')}</p>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">${t('closeModal')}</button></div>`);
  },

  showSettingsModal() {
    const themeNames = { dream: t('themeDream'), candy: t('themeCandy') };
    this.showModal(`
      <h2 class="modal-title">${t('setTitle')}</h2>
      <div class="setting-row">
        <span>${t('sfx')}</span>
        <button class="switch ${SFX.enabled ? 'on' : ''}" data-action="toggle-sfx">${SFX.enabled ? 'ON' : 'OFF'}</button>
      </div>
      <div class="setting-row">
        <span>${t('bgm')}</span>
        <button class="switch ${SFX.musicOn ? 'on' : ''}" data-action="toggle-music">${SFX.musicOn ? 'ON' : 'OFF'}</button>
      </div>
      <div class="setting-row">
        <span>${t('theme')}</span>
        <button class="btn ghost small" data-action="cycle-theme">${themeNames[Save.data.settings.theme] || themeNames.dream}</button>
      </div>
      <div class="setting-row">
        <span>语言 / Language</span>
        <button class="btn ghost small" data-action="cycle-lang">${Save.data.settings.lang === 'en' ? 'English' : '中文'}</button>
      </div>
      <div class="setting-row">
        <span>${t('difficulty')}</span>
        <button class="btn ghost small" data-action="cycle-difficulty">${Save.data.settings.difficulty === 'hard' ? t('difficultyHard') : t('difficultyNormal')}</button>
      </div>
      <div class="setting-row">
        <span>${t('reset')}</span>
        <button class="btn danger small" data-action="reset-progress">${t('resetBtn')}</button>
      </div>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">${t('closeModal')}</button></div>`);
  },

  renderMenuStats() {
    const d = Save.data;
    const totalStars = Object.values(d.stars).reduce((a, b) => a + b, 0);
    const today = d.daily[todayKey()];
    const dailyStr = today ? tf('dailyDoneStat', { s: today.stars, p: today.score }) : t('dailyTodo');
    this.els.menuStats.textContent = tf('menuStats', {
      a: Math.min(d.unlocked + 1, LEVELS.length), b: LEVELS.length,
      c: totalStars, d: LEVELS.length * 3,
      e: d.endlessBest, f: d.achievements.length, g: ACHIEVEMENTS.length,
      daily: dailyStr
    });
    /* 今日已打卡时更新每日挑战按钮文案 */
    if (this.els.btnDaily) {
      this.els.btnDaily.textContent = today ? t('dailyDone') : t('startDaily');
    }
    this.renderDailyCal();
  },

  /* 最近 7 天每日挑战打卡日历 */
  renderDailyCal() {
    const el = this.els.dailyCal;
    if (!el) return;
    const now = new Date();
    const chips = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const rec = Save.data.daily[key];
      chips.push(`<span class="cal-day ${rec ? 'done' : ''} ${i === 0 ? 'today' : ''}" title="${key}${rec ? ' · ' + rec.score + '分' : ''}">${rec ? '⭐' : '·'}<small>${'日一二三四五六'[d.getDay()]}</small></span>`);
    }
    el.innerHTML = chips.join('');
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
