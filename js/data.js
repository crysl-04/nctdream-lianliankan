'use strict';
/* ============================================================
 * NCT DREAM 连连看 - 数据层
 * 成员资料 / 关卡列表 / 通用短语 / SVG 头像绘制
 * 说明：所有头像均为代码绘制的卡通形象，非真实照片。
 * ============================================================ */

const MEMBERS = [
  {
    id: 'mark', name: 'MARK', kr: '마크', cn: '李马克', en: 'Mark Lee',
    color: '#34d399', light: '#d7f8e7',
    emoji: '🐯', birth: '1999.08.02', pos: '队长 / Rapper',
    fun: '加拿大来的综艺魂，被粉丝们亲切地称作"小老虎"'
  },
  {
    id: 'renjun', name: 'RENJUN', kr: '런쥔', cn: '黄仁俊', en: 'Huang Renjun',
    color: '#f59e0b', light: '#fdeecd',
    emoji: '🦊', birth: '2000.03.23', pos: '主唱',
    fun: '来自中国吉林，声音清澈透亮的小狐狸'
  },
  {
    id: 'jeno', name: 'JENO', kr: '제노', cn: '李帝努', en: 'Lee Jeno',
    color: '#3b82f6', light: '#dbeafe',
    emoji: '🐶', birth: '2000.04.23', pos: 'Rapper / 领舞',
    fun: '笑容像小狗一样治愈，舞台上却是气场全开'
  },
  {
    id: 'haechan', name: 'HAECHAN', kr: '해찬', cn: '李东赫', en: 'Lee Haechan',
    color: '#f87171', light: '#fee2e2',
    emoji: '☀️', birth: '2000.06.06', pos: '主唱',
    fun: '名字意为"灿烂的太阳"，队里的气氛担当'
  },
  {
    id: 'jaemin', name: 'JAEMIN', kr: '재민', cn: '罗渽民', en: 'Na Jaemin',
    color: '#ec4899', light: '#fce0f0',
    emoji: '🐰', birth: '2000.08.13', pos: 'Rapper / 领舞',
    fun: '猫咪守护者，最常对粉丝说的话是"照顾好自己"'
  },
  {
    id: 'chenle', name: 'CHENLE', kr: '천러', cn: '钟辰乐', en: 'Zhong Chenle',
    color: '#a78bfa', light: '#ece7fd',
    emoji: '🐬', birth: '2001.11.22', pos: '主唱',
    fun: '海豚音拥有者，笑声也像海豚一样快乐'
  },
  {
    id: 'jisung', name: 'JISUNG', kr: '지성', cn: '朴志晟', en: 'Park Jisung',
    color: '#14b8a6', light: '#ccf6ef',
    emoji: '🐹', birth: '2002.02.05', pos: '主领舞 / 忙内',
    fun: '身高担当的舞蹈机器，性格却软软糯糯'
  }
];

/* 关卡：以 Dream 的歌曲命名（rows=纵向格数, cols=横向格数, 单位：秒）
 * era = 本关的时代装扮：成员头像配饰 + 卡片底色随歌曲主题变化 */
const LEVELS = [
  { song: 'Chewing Gum',      cn: '口香糖',      year: 2016, rows: 4, cols: 5,  time: 100, era: 'gum' },
  { song: 'My First and Last', cn: '最初到最后',  year: 2017, rows: 4, cols: 6,  time: 110, era: 'heart' },
  { song: 'We Young',         cn: '我们正年轻',   year: 2017, rows: 5, cols: 6,  time: 130, era: 'young' },
  { song: 'We Go Up',         cn: '一路向上',     year: 2018, rows: 5, cols: 8,  time: 150, era: 'goup' },
  { song: 'Boom',             cn: '心动爆弹',     year: 2019, rows: 6, cols: 7,  time: 165, era: 'boom' },
  { song: "Ridin'",           cn: '驰行',        year: 2020, rows: 6, cols: 8,  time: 180, era: 'rider' },
  { song: 'Hot Sauce',        cn: '辣酱',        year: 2021, rows: 6, cols: 9,  time: 195, era: 'sauce' },
  { song: 'Hello Future',     cn: '你好，未来',   year: 2021, rows: 6, cols: 10, time: 210, era: 'future' },
  { song: 'Glitch Mode',      cn: '故障模式',     year: 2022, rows: 6, cols: 11, time: 225, era: 'glitch' },
  { song: 'Beatbox',          cn: '节拍盒',      year: 2022, rows: 6, cols: 12, time: 240, era: 'beatbox' },
  { song: 'Candy',            cn: '糖果',        year: 2022, rows: 7, cols: 10, time: 255, era: 'candy' },
  { song: 'ISTJ',             cn: 'ISTJ',       year: 2023, rows: 8, cols: 11, time: 270, era: 'istj' },
  { song: 'Broken Melodies',  cn: '破碎的旋律',   year: 2023, rows: 7, cols: 12, time: 285, era: 'note' },
  { song: 'Smoothie',         cn: '冰沙',        year: 2024, rows: 8, cols: 12, time: 300, era: 'smoothie' }
];

/* ---------- 时代装扮：卡片底色 + 头像配饰 ---------- */
const ERAS = {
  gum:      { bg: 'linear-gradient(145deg,#fce7f3,#e0f2fe)' },
  heart:    { bg: 'linear-gradient(145deg,#ffe4e6,#fef3c7)' },
  young:    { bg: 'linear-gradient(145deg,#e0f2fe,#ccfbf1)' },
  goup:     { bg: 'linear-gradient(145deg,#dbeafe,#ede9fe)' },
  boom:     { bg: 'linear-gradient(145deg,#fef3c7,#fecaca)' },
  rider:    { bg: 'linear-gradient(145deg,#cffafe,#e0e7ff)' },
  sauce:    { bg: 'linear-gradient(145deg,#fee2e2,#ffedd5)' },
  future:   { bg: 'linear-gradient(145deg,#ede9fe,#cffafe)' },
  glitch:   { bg: 'linear-gradient(145deg,#e0e7ff,#fce7f3)' },
  beatbox:  { bg: 'linear-gradient(145deg,#f1f5f9,#e0f2fe)' },
  candy:    { bg: 'linear-gradient(145deg,#fce7f3,#fef9c3)' },
  istj:     { bg: 'linear-gradient(145deg,#f1f5f9,#f8fafc)' },
  note:     { bg: 'linear-gradient(145deg,#dbeafe,#ede9fe)' },
  smoothie: { bg: 'linear-gradient(145deg,#fce7f3,#dcfce7)' }
};

/* 每个时代的头像配饰（SVG 片段，叠加在头像最上层；位置避开右上角 emoji 徽章） */
const ERA_ACC = {
  gum: `<circle cx="50" cy="73" r="9.5" fill="#ff9ec7" opacity=".85"/><circle cx="50" cy="73" r="6" fill="#ffc2dd"/>`,
  heart: `<path d="M31 19 c-2.5-4.5-9-2-6.5 3.2 c1.4 3 6.5 6 6.5 6 s5-3 6.4-6 c2.5-5.2-4-7.7-6.4-3.2z" fill="#f472b6"/>`,
  young: `<rect x="33" y="50" width="13" height="9.5" rx="3.5" fill="#3b3b52"/><rect x="54" y="50" width="13" height="9.5" rx="3.5" fill="#3b3b52"/><line x1="46" y1="54.5" x2="54" y2="54.5" stroke="#3b3b52" stroke-width="2.4"/>`,
  goup: `<path d="M22 20 L40 12 L31 28 Z" fill="#38bdf8"/><path d="M31 28 L33.5 20.5 L28.5 22.5 Z" fill="#0369a1"/>`,
  boom: `<path d="M28 34 l2.6 5.4 6 0.9-4.3 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.3 6-0.9z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/>`,
  rider: `<rect x="32" y="49.5" width="36" height="11" rx="5.5" fill="#22d3ee" opacity=".88"/><rect x="35" y="52" width="13" height="4.5" rx="2.2" fill="#fff" opacity=".65"/>`,
  sauce: `<path d="M30 17 q9 2 7 13 q-1 5.5-6.5 4.5 q4.5-8.5-2.5-15z" fill="#ef4444"/><path d="M30 17 q-3.5-4.5 1-6.8" stroke="#16a34a" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  future: `<g fill="none" stroke-linecap="round"><path d="M20 36 a13 13 0 0 1 22-9" stroke="#f87171" stroke-width="3"/><path d="M23.5 37 a9.5 9.5 0 0 1 16-6.5" stroke="#fbbf24" stroke-width="3"/><path d="M27 38 a6 6 0 0 1 10-4" stroke="#38bdf8" stroke-width="3"/></g>`,
  glitch: `<g opacity=".85"><rect x="16" y="58" width="7" height="7" fill="#a78bfa"/><rect x="79" y="52" width="8" height="8" fill="#38bdf8"/><rect x="22" y="14" width="5" height="5" fill="#f472b6"/><rect x="74" y="72" width="6" height="6" fill="#34d399"/><rect x="12" y="34" width="5" height="5" fill="#fbbf24"/></g>`,
  beatbox: `<path d="M27 52 a23 23 0 0 1 46 0" stroke="#4b5563" stroke-width="4.5" fill="none"/><rect x="21" y="47" width="10" height="15" rx="4.5" fill="#4b5563"/><rect x="69" y="47" width="10" height="15" rx="4.5" fill="#4b5563"/><rect x="23.5" y="50" width="5" height="9" rx="2.2" fill="#f472b6"/><rect x="71.5" y="50" width="5" height="9" rx="2.2" fill="#f472b6"/>`,
  candy: `<circle cx="31" cy="21" r="5.5" fill="#f472b6"/><path d="M31 15.5 a5.5 5.5 0 0 1 5.5 5.5 l-5.5 0z" fill="#fff" opacity=".75"/><path d="M25.8 17.5 L21 15 M25.5 24.5 L21 27" stroke="#f472b6" stroke-width="2.4" stroke-linecap="round"/>`,
  istj: `<g><rect x="24" y="16" width="18" height="4.5" rx="2.2" fill="#94a3b8"/><rect x="24" y="23" width="12" height="4.5" rx="2.2" fill="#cbd5e1"/><rect x="24" y="30" width="15" height="4.5" rx="2.2" fill="#94a3b8" opacity=".7"/></g>`,
  note: `<circle cx="26" cy="25" r="3.6" fill="#60a5fa"/><rect x="28.4" y="13" width="2.4" height="12" fill="#60a5fa"/><path d="M30.8 13 q6.5 1.2 6.5 6.5" stroke="#60a5fa" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  smoothie: `<rect x="69" y="56" width="11" height="14" rx="2.5" fill="#fda4af"/><rect x="67.5" y="53" width="14" height="4.5" rx="2.2" fill="#f472b6"/><line x1="75.5" y1="46" x2="73.5" y2="53" stroke="#a3e635" stroke-width="2.6" stroke-linecap="round"/>`
};

/* 当前对局的装扮（闯关=关卡设定；每日=按日期确定；无尽=按轮数轮换） */
function eraOfBoard() {
  if (typeof Game === 'undefined') return null;
  const ids = Object.keys(ERAS);
  if (Game.mode === 'classic') return LEVELS[Game.levelIdx].era;
  if (Game.mode === 'daily') return ids[djb2Hash(Game.dailyDate) % ids.length];
  if (Game.mode === 'endless') return ids[(Game.endlessRound - 1) % ids.length];
  return null;
}

/* 连击欢呼语 */
const PHRASES = [
  'We Go Up!', 'Boom!', 'Hello Future!', "Ridin'!", 'Chewing Gum~',
  'Beatbox!', 'Dream on!', 'Glowing!', 'Smoothie~', 'Hot Sauce!'
];

/* 背景漂浮装饰 */
const BG_EMOJIS = ['🌈', '⭐', '☁️', '💚', '🌟', '🌙', '💫', '🎵'];

/* 成就定义 */
const ACHIEVEMENTS = [
  { id: 'first_win',  name: '初次登台',   desc: '完成任意一局',            icon: '🎤' },
  { id: 'combo5',     name: '连击达人',   desc: '单局达成 5 连击',         icon: '🔥' },
  { id: 'combo10',    name: '全开麦',     desc: '单局达成 10 连击',        icon: '💥' },
  { id: 'stars12',    name: '收藏家',     desc: '累计获得 12 颗星',        icon: '⭐' },
  { id: 'stars30',    name: '星光收藏家', desc: '累计获得 30 颗星',        icon: '🌟' },
  { id: 'all_stars',  name: '满星传说',   desc: '全部关卡满星通关',        icon: '👑' },
  { id: 'level7',     name: 'Hello Future', desc: '通过第 7 关',           icon: '🌈' },
  { id: 'clear_all',  name: 'Dream 完结', desc: '通过全部 14 关',          icon: '🏆' },
  { id: 'endless3',   name: '无尽战士',   desc: '无尽模式单局通过 3 轮',   icon: '♾️' },
  { id: 'endless6',   name: '永不停歇',   desc: '无尽模式单局通过 6 轮',   icon: '🚀' },
  { id: 'endless10',  name: '无尽征途',   desc: '无尽模式单局通过 10 轮',  icon: '🛤️' },
  { id: 'daily',      name: '每日打卡',   desc: '完成一次每日挑战',        icon: '📅' },
  { id: 'streak3',    name: '坚持三天',   desc: '每日挑战连续打卡 3 天',   icon: '📆' },
  { id: 'no_item',    name: '裸装通关',   desc: '不使用道具通关任意一局',  icon: '🧘' },
  { id: 'score500',   name: '高分少年',   desc: '单局得分超过 500',        icon: '💯' },
  { id: 'score1000',  name: '千分传说',   desc: '单局得分超过 1000',       icon: '🎯' },
  { id: 'marathon',   name: '耐力赛',     desc: '单局用时超过 10 分钟',    icon: '⏳' },
  { id: 'night_owl',  name: '夜猫子',     desc: '在凌晨 0-5 点完成一局',   icon: '🦉' },
  { id: 'wardrobe7',  name: '时装周',     desc: '收集 7 套装扮',           icon: '👗' },
  { id: 'wardrobe14', name: '全能收藏家', desc: '收集全部 14 套装扮',      icon: '💎' }
];

/* ---------- 多语言（中/英） ---------- */
const I18N = {
  zh: {
    slogan: '连接相同的少年卡片 · We dream, we match!',
    startClassic: '🚀 开始闯关', startDaily: '📅 每日挑战', dailyDone: '✅ 今日已完成 · 再来一局',
    startEndless: '♾️ 无尽模式', levels: '🗺️ 关卡选择', about: '💚 成员图鉴',
    achievements: '🏅 成就', history: '📊 战绩', settings: '⚙️ 设置',
    menuFoot: '非官方粉丝作品 · 纯前端实现 · 完全免费 · 支持手机 · 键盘可玩（方向键+空格）',
    classicMode: '闯关模式', dailyMode: '每日挑战', endlessMode: '无尽模式',
    levelLabel: '第 {n} 关 · {s}', dailyLabel: '每日挑战 · {d}', roundLabel: '第 {n} 轮',
    score: '得分', combo: '连击',
    itemHint: '提示', itemShuffle: '洗牌', itemClock: '+20s', itemRestart: '重开',
    winTitle: '关卡完成！', allClearTitle: '全部关卡完成！🎉',
    dailyWinTitle: '每日挑战完成！📅', roundWinTitle: '第 {n} 轮完成！',
    loseTitle: '时间到啦！', dailyLoseTitle: '今天的挑战没成功…', endlessLoseTitle: '无尽模式结束',
    bonusLine: '消除奖励 <b>+{b}</b> · 总分 <b>{s}</b> · 最高连击 <b>x{c}</b> · 用时 <b>{t}s</b>',
    zeroItems: '零道具', usedItems: '用了 {n} 个道具',
    bestScore: '最佳成绩：{s}', newDailyBest: '🎊 刷新今日最佳！', todayBest: '今日最佳：{s}',
    endlessBest: '无尽最佳：{n} 轮', totalProgress: '总进度 <b>{n}</b> 轮 · 总分 <b>{s}</b>',
    nextLevel: '下一关 ▶', replay: '再玩一次 ↻', retry: '再试一次 ↻', toMenu: '返回菜单 🏠',
    share: '📋 分享', shareResult: '📋 分享战绩', endlessNext: '下一轮 ▶', endlessAgain: '再来一局 ▶',
    loseHint: '提示：优先消除被围住的卡片，连击有额外加分',
    dailyLoseSub: '棋盘每天固定，摸清布局明天再战或现在再试一次！',
    closeModal: '关闭', levelsTitle: '选择关卡 🗺️',
    achTitle: '成就 {n}/{m} 🏅', histTitle: '最近战绩 📊',
    histEmpty: '还没有战绩，快去玩一局吧！', histUnfinished: '未完成 · ',
    aboutTitle: 'NCT DREAM 成员图鉴 💚',
    aboutNote: 'NCT DREAM 是 SM 娱乐旗下的七人男子组合，粉丝名 NCTzen。本页面头像是代码绘制的卡通形象，非官方图片。',
    setTitle: '设置 ⚙️', sfx: '游戏音效', bgm: '背景音乐', theme: '主题皮肤', reset: '重置所有进度',
    resetBtn: '重置', resetConfirm: '⚠️ 再点一次确认重置',
    themeDream: '🌈 梦幻星河', themeCandy: '🍬 粉甜糖果',
    toastSfxOn: '音效已开启 🔊', toastSfxOff: '音效已关闭 🔇',
    toastAutoShuffle: '无路可走，自动洗牌 🔀', toastNoHint: '提示次数已用完 💡',
    toastNoPairHint: '暂时没有可消除的', toastNoShuffle: '洗牌次数已用完 🔀',
    toastNoClock: '加时道具已用完 ⏰', toastClock: '时间 +20 秒 ⏰',
    toastRestart: '已重新开始 ↻', toastCopied: '战绩已复制，去分享吧 📋',
    toastCopyFail: '复制失败，请手动截图分享', toastReset: '进度已重置',
    toastAch: '🏅 成就解锁：{s}',
    toastLandscape: '📱 手机横屏体验更佳',
    howto: '❓ 玩法说明', howtoTitle: '玩法说明 ❓',
    howto1: '1️⃣ 点击两张<b>相同的成员卡片</b>',
    howto2: '2️⃣ 若它们能用<b>不超过 2 个转折</b>的路径连通（可绕到棋盘外面），即可消除',
    howto3: '3️⃣ 时间耗尽前清空棋盘！快速连消触发连击加分',
    howtoKeys: '⌨️ 键盘：方向键移动 · 空格选中 · H 提示 · Esc 取消',
    collection: '👔 装扮图鉴', collectionTitle: '装扮图鉴', collectionNew: '🎨 新装扮解锁！',
    collectionTip: '通关对应关卡即可解锁装扮，通关全部 14 关收集整套！',
    exitTitle: '确定要退出吗？', exitSub: '当前进度不会保存', exitYes: '退出 🏠', exitNo: '继续游戏 ▶',
    difficulty: '难度', difficultyNormal: '🙂 普通', difficultyHard: '🔥 困难',
    hardMode: '困难闯关', hardBonus: '🔥 困难加成 ×1.5 分',
    comboN: '{n} 连击 · {p}',
    menuStats: '闯关 {a}/{b} · ⭐ {c}/{d} · 无尽 {e} 轮 · 🏅 {f}/{g} · {daily}',
    dailyDoneStat: '今日挑战 ⭐{s} {p}分', dailyTodo: '今日挑战未完成'
  },
  en: {
    slogan: 'Connect matching idol cards · We dream, we match!',
    startClassic: '🚀 Classic', startDaily: '📅 Daily Challenge', dailyDone: '✅ Done today · Play again',
    startEndless: '♾️ Endless', levels: '🗺️ Levels', about: '💚 Members',
    achievements: '🏅 Achievements', history: '📊 History', settings: '⚙️ Settings',
    menuFoot: 'Unofficial fan game · pure front-end · 100% free · mobile ready · keyboard supported',
    classicMode: 'Classic', dailyMode: 'Daily', endlessMode: 'Endless',
    levelLabel: 'Level {n} · {s}', dailyLabel: 'Daily · {d}', roundLabel: 'Round {n}',
    score: 'Score', combo: 'Combo',
    itemHint: 'Hint', itemShuffle: 'Mix', itemClock: '+20s', itemRestart: 'Retry',
    winTitle: 'Level Clear!', allClearTitle: 'All Levels Clear! 🎉',
    dailyWinTitle: 'Daily Challenge Clear! 📅', roundWinTitle: 'Round {n} Clear!',
    loseTitle: "Time's Up!", dailyLoseTitle: 'Not today…', endlessLoseTitle: 'Endless Over',
    bonusLine: 'Clear bonus <b>+{b}</b> · Score <b>{s}</b> · Max combo <b>x{c}</b> · Time <b>{t}s</b>',
    zeroItems: 'no items', usedItems: '{n} items used',
    bestScore: 'Best: {s}', newDailyBest: '🎊 New daily best!', todayBest: "Today's best: {s}",
    endlessBest: 'Endless best: {n} rounds', totalProgress: 'Total <b>{n}</b> rounds · <b>{s}</b> pts',
    nextLevel: 'Next ▶', replay: 'Replay ↻', retry: 'Try Again ↻', toMenu: 'Menu 🏠',
    share: '📋 Share', shareResult: '📋 Share', endlessNext: 'Next Round ▶', endlessAgain: 'Play Again ▶',
    loseHint: 'Tip: clear blocked tiles first; combos score extra',
    dailyLoseSub: "The board is the same all day — learn it and retry!",
    closeModal: 'Close', levelsTitle: 'Choose Level 🗺️',
    achTitle: 'Achievements {n}/{m} 🏅', histTitle: 'Recent Games 📊',
    histEmpty: 'No games yet — go play one!', histUnfinished: 'DNF · ',
    aboutTitle: 'NCT DREAM Members 💚',
    aboutNote: 'NCT DREAM is a seven-member boy group under SM Entertainment; fans are called NCTzen. Avatars here are code-drawn cartoons, not official images.',
    setTitle: 'Settings ⚙️', sfx: 'Sound FX', bgm: 'Music', theme: 'Theme', reset: 'Reset all progress',
    resetBtn: 'Reset', resetConfirm: '⚠️ Tap again to confirm',
    themeDream: '🌈 Dreamy', themeCandy: '🍬 Candy',
    toastSfxOn: 'Sound on 🔊', toastSfxOff: 'Sound muted 🔇',
    toastAutoShuffle: 'No moves — auto shuffle 🔀', toastNoHint: 'Out of hints 💡',
    toastNoPairHint: 'No matches available', toastNoShuffle: 'Out of shuffles 🔀',
    toastNoClock: 'Out of time boosts ⏰', toastClock: '+20 seconds ⏰',
    toastRestart: 'Restarted ↻', toastCopied: 'Result copied — share it! 📋',
    toastCopyFail: 'Copy failed — screenshot instead', toastReset: 'Progress reset',
    toastAch: '🏅 Unlocked: {s}',
    toastLandscape: '📱 Rotate your phone for a better view',
    howto: '❓ How to Play', howtoTitle: 'How to Play ❓',
    howto1: '1️⃣ Tap two <b>matching member cards</b>',
    howto2: '2️⃣ They clear if connected by a path with <b>at most 2 turns</b> (you may route around the board)',
    howto3: '3️⃣ Clear the board before time runs out! Quick chains build combos',
    howtoKeys: '⌨️ Keyboard: arrows to move · Space to select · H for hint · Esc to cancel',
    collection: '👔 Wardrobe', collectionTitle: 'Costume Wardrobe', collectionNew: '🎨 New outfit unlocked!',
    collectionTip: 'Clear a level to unlock its outfit — collect all 14!',
    exitTitle: 'Leave this game?', exitSub: 'Current progress will not be saved', exitYes: 'Leave 🏠', exitNo: 'Keep Playing ▶',
    difficulty: 'Difficulty', difficultyNormal: '🙂 Normal', difficultyHard: '🔥 Hard',
    hardMode: 'Hard Classic', hardBonus: '🔥 Hard bonus ×1.5 score',
    comboN: '{n} Combo · {p}',
    menuStats: 'Levels {a}/{b} · ⭐ {c}/{d} · Endless {e} · 🏅 {f}/{g} · {daily}',
    dailyDoneStat: 'Daily ⭐{s} {p} pts', dailyTodo: 'Daily not done'
  }
};

function t(key) {
  const lang = (typeof Save !== 'undefined' && Save.data && Save.data.settings && Save.data.settings.lang) || 'zh';
  const pack = I18N[lang] || I18N.zh;
  const v = pack[key] !== undefined ? pack[key] : I18N.zh[key];
  return v !== undefined ? v : key;
}

/* {n} 占位符替换 */
function tf(key, params) {
  let s = t(key);
  for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  return s;
}

/* 成员图鉴趣味描述的双语字段：zh 固定，en 简单跟随 */
const MEMBER_FUN_EN = {
  mark: 'Variety-show ace from Canada, nicknamed "the little tiger"',
  renjun: 'From Jilin, China — a little fox with a crystal-clear voice',
  jeno: 'A puppy-like healing smile, full stage presence',
  haechan: 'His name means "shining sun" — the mood-maker',
  jaemin: 'Cat guardian; always telling fans to "take care of yourself"',
  chenle: 'Dolphin-high-note owner with an equally happy laugh',
  jisung: 'The tall dancing machine with the softest heart'
};
function memberFun(m) {
  const lang = (typeof Save !== 'undefined' && Save.data && Save.data.settings && Save.data.settings.lang) || 'zh';
  return lang === 'en' ? (MEMBER_FUN_EN[m.id] || m.fun) : m.fun;
}
/* 成就的英文名称与描述（id 对应） */
const ACHIEVEMENTS_EN = {
  first_win:  { name: 'Stage Debut',    desc: 'Clear any game' },
  combo5:     { name: 'Combo Master',   desc: 'Reach a 5 combo in one game' },
  combo10:    { name: 'Full Mic',       desc: 'Reach a 10 combo in one game' },
  stars12:    { name: 'Collector',      desc: 'Earn 12 stars in total' },
  stars30:    { name: 'Star Collector', desc: 'Earn 30 stars in total' },
  all_stars:  { name: 'Full-star Legend', desc: '3-star every level' },
  level7:     { name: 'Hello Future',   desc: 'Clear level 7' },
  clear_all:  { name: 'Dream Complete', desc: 'Clear all 14 levels' },
  endless3:   { name: 'Endless Warrior', desc: 'Clear 3 rounds in one endless run' },
  endless6:   { name: 'Nonstop',        desc: 'Clear 6 rounds in one endless run' },
  endless10:  { name: 'Endless Voyage', desc: 'Clear 10 rounds in one endless run' },
  daily:      { name: 'Daily Check-in', desc: 'Complete a daily challenge' },
  streak3:    { name: 'Three in a Row', desc: '3-day daily challenge streak' },
  no_item:    { name: 'Bare Hands',     desc: 'Clear a game without using items' },
  score500:   { name: 'High Scorer',    desc: 'Score over 500 in one game' },
  score1000:  { name: 'Thousand Club',  desc: 'Score over 1000 in one game' },
  marathon:   { name: 'Marathon',       desc: 'A single game longer than 10 minutes' },
  night_owl:  { name: 'Night Owl',      desc: 'Finish a game between 0-5 AM' },
  wardrobe7:  { name: 'Fashion Week',   desc: 'Collect 7 outfits' },
  wardrobe14: { name: 'Ultimate Collector', desc: 'Collect all 14 outfits' }
};
function achName(a) {
  const lang = (typeof Save !== 'undefined' && Save.data && Save.data.settings && Save.data.settings.lang) || 'zh';
  return lang === 'en' && ACHIEVEMENTS_EN[a.id] ? ACHIEVEMENTS_EN[a.id].name : a.name;
}
function achDesc(a) {
  const lang = (typeof Save !== 'undefined' && Save.data && Save.data.settings && Save.data.settings.lang) || 'zh';
  return lang === 'en' && ACHIEVEMENTS_EN[a.id] ? ACHIEVEMENTS_EN[a.id].desc : a.desc;
}

/* style: 0=Mark 1=Renjun 2=Jeno 3=Haechan 4=Jaemin 5=Chenle 6=Jisung */
/* ---------- SVG 卡通头像（代码绘制，非真实形象） ---------- */
function avatarSVG(member, size, eraId) {
  const i = MEMBERS.indexOf(member);
  const c = member.color;
  const badge = `<text x="74" y="26" font-size="17">${member.emoji}</text>`;
  const eraAcc = eraId && ERA_ACC[eraId] ? ERA_ACC[eraId] : '';
  let hair = '';
  if (i === 0) { /* Mark：棒球帽 */
    hair = `
      <path d="M27 52 Q25 27 50 26 Q75 27 73 52 Q72 39 63 37 Q59 29 50 31 Q41 29 37 37 Q28 39 27 52 Z" fill="${c}"/>
      <path d="M31 37 Q31 19 50 19 Q69 19 69 37 Q50 31 31 37 Z" fill="#ffffff" stroke="${c}" stroke-width="2.5"/>
      <rect x="24" y="34" width="52" height="6.5" rx="3.2" fill="${c}"/>
      <circle cx="50" cy="24" r="2.6" fill="${c}"/>`;
  } else if (i === 1) { /* Renjun：狐狸耳呆毛 */
    hair = `
      <path d="M26 54 Q24 24 50 24 Q76 24 74 54 Q72 36 50 36 Q28 36 26 54 Z" fill="${c}"/>
      <path d="M31 34 L35 13 L47 29 Z" fill="${c}"/>
      <path d="M69 34 L65 13 L53 29 Z" fill="${c}"/>
      <path d="M35 28 L36.5 19 L42 26 Z" fill="#fff" opacity=".85"/>
      <path d="M65 28 L63.5 19 L58 26 Z" fill="#fff" opacity=".85"/>`;
  } else if (i === 2) { /* Jeno：清爽刺猬头 */
    hair = `
      <path d="M26 54 Q24 24 50 24 Q76 24 74 54 Q72 37 50 37 Q28 37 26 54 Z" fill="${c}"/>
      <path d="M38 28 L42 12 L49 25 L55 11 L61 27 Z" fill="${c}"/>`;
  } else if (i === 3) { /* Haechan：中分波浪+太阳发夹 */
    hair = `
      <path d="M26 54 Q24 24 50 24 Q76 24 74 54 Q73 37 50 43 Q27 37 26 54 Z" fill="${c}"/>
      <circle cx="71" cy="30" r="5" fill="#ffd93b" stroke="#f59e0b" stroke-width="1.6"/>
      <g stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round">
        <line x1="71" y1="20" x2="71" y2="23"/><line x1="71" y1="37" x2="71" y2="40"/>
        <line x1="61" y1="30" x2="64" y2="30"/><line x1="78" y1="30" x2="81" y2="30"/>
        <line x1="64" y1="23" x2="66" y2="25"/><line x1="76" y1="35" x2="78" y2="37"/>
        <line x1="78" y1="23" x2="76" y2="25"/><line x1="66" y1="35" x2="64" y2="37"/>
      </g>`;
  } else if (i === 4) { /* Jaemin：猫耳兜帽刘海 */
    hair = `
      <path d="M26 56 Q23 25 50 25 Q77 25 74 56 Q72 38 50 40 Q28 38 26 56 Z" fill="${c}"/>
      <path d="M30 36 Q21 15 42 23 Z" fill="${c}" stroke="${c}" stroke-width="2"/>
      <path d="M70 36 Q79 15 58 23 Z" fill="${c}" stroke="${c}" stroke-width="2"/>`;
  } else if (i === 5) { /* Chenle：锅盖头+星星发卡 */
    hair = `
      <path d="M25 52 Q24 23 50 23 Q76 23 75 52 Q74 33 50 33 Q26 33 25 52 Z" fill="${c}"/>
      <path d="M28 30 L31 22 L33 30 L41 33 L33 36 L31 44 L28 36 L20 33 Z" fill="#fff" opacity=".95" transform="scale(.72) translate(12 9)"/>`;
  } else { /* Jisung：蓬松软毛 */
    hair = `
      <path d="M24 52 Q22 24 50 24 Q78 24 76 52 Q76 42 68 40 Q72 31 62 34 Q58 25 50 30 Q42 25 38 34 Q28 31 32 40 Q24 42 24 52 Z" fill="${c}"/>`;
  }

  return `<svg class="avatar-svg" viewBox="0 0 100 100" width="${size || 100}" height="${size || 100}" role="img" aria-label="${member.cn} 卡通头像">
    <circle cx="50" cy="50" r="47" fill="${member.light}"/>
    <circle cx="50" cy="50" r="47" fill="none" stroke="${c}" stroke-width="3.5"/>
    <ellipse cx="25" cy="57" rx="5" ry="6" fill="#ffdfca"/>
    <ellipse cx="75" cy="57" rx="5" ry="6" fill="#ffdfca"/>
    <ellipse cx="50" cy="57" rx="24" ry="22.5" fill="#ffdfca"/>
    ${hair}
    <ellipse class="eye" cx="41" cy="56" rx="3" ry="4.3" fill="#453a52"/>
    <ellipse class="eye" cx="59" cy="56" rx="3" ry="4.3" fill="#453a52"/>
    <circle cx="42.2" cy="54.6" r="1.1" fill="#fff"/>
    <circle cx="60.2" cy="54.6" r="1.1" fill="#fff"/>
    <ellipse cx="33.5" cy="64" rx="4.2" ry="2.6" fill="#ffb3c0" opacity=".75"/>
    <ellipse cx="66.5" cy="64" rx="4.2" ry="2.6" fill="#ffb3c0" opacity=".75"/>
    <path d="M44 67 Q50 72.5 56 67" stroke="#c96f5e" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${badge}
    ${eraAcc}
  </svg>`;
}

/* 根据类型序号(1起)取成员 */
function memberByType(t) { return MEMBERS[t - 1]; }
