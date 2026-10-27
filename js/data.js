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

/* 关卡：以 Dream 的歌曲命名（rows=纵向格数, cols=横向格数, 单位：秒） */
const LEVELS = [
  { song: 'Chewing Gum',      cn: '口香糖',      year: 2016, rows: 4, cols: 5,  time: 100 },
  { song: 'My First and Last', cn: '最初到最后',  year: 2017, rows: 4, cols: 6,  time: 110 },
  { song: 'We Young',         cn: '我们正年轻',   year: 2017, rows: 5, cols: 6,  time: 130 },
  { song: 'We Go Up',         cn: '一路向上',     year: 2018, rows: 5, cols: 8,  time: 150 },
  { song: 'Boom',             cn: '心动爆弹',     year: 2019, rows: 6, cols: 7,  time: 165 },
  { song: "Ridin'",           cn: '驰行',        year: 2020, rows: 6, cols: 8,  time: 180 },
  { song: 'Hot Sauce',        cn: '辣酱',        year: 2021, rows: 6, cols: 9,  time: 195 },
  { song: 'Hello Future',     cn: '你好，未来',   year: 2021, rows: 6, cols: 10, time: 210 },
  { song: 'Glitch Mode',      cn: '故障模式',     year: 2022, rows: 6, cols: 11, time: 225 },
  { song: 'Beatbox',          cn: '节拍盒',      year: 2022, rows: 6, cols: 12, time: 240 },
  { song: 'Candy',            cn: '糖果',        year: 2022, rows: 7, cols: 10, time: 255 },
  { song: 'ISTJ',             cn: 'ISTJ',       year: 2023, rows: 8, cols: 11, time: 270 },
  { song: 'Broken Melodies',  cn: '破碎的旋律',   year: 2023, rows: 7, cols: 12, time: 285 },
  { song: 'Smoothie',         cn: '冰沙',        year: 2024, rows: 8, cols: 12, time: 300 }
];

/* 连击欢呼语 */
const PHRASES = [
  'We Go Up!', 'Boom!', 'Hello Future!', "Ridin'!", 'Chewing Gum~',
  'Beatbox!', 'Dream on!', 'Glowing!', 'Smoothie~', 'Hot Sauce!'
];

/* 背景漂浮装饰 */
const BG_EMOJIS = ['🌈', '⭐', '☁️', '💚', '🌟', '🌙', '💫', '🎵'];

/* 成就定义 */
const ACHIEVEMENTS = [
  { id: 'first_win',  name: '初次登台',   desc: '完成任意一关',            icon: '🎤' },
  { id: 'combo5',     name: '连击达人',   desc: '单局达成 5 连击',         icon: '🔥' },
  { id: 'combo10',    name: '全开麦',     desc: '单局达成 10 连击',        icon: '💥' },
  { id: 'stars12',    name: '收藏家',     desc: '累计获得 12 颗星',        icon: '⭐' },
  { id: 'all_stars',  name: '满星传说',   desc: '全部关卡满星通关',        icon: '👑' },
  { id: 'level7',     name: 'Hello Future', desc: '通过第 7 关',           icon: '🌈' },
  { id: 'clear_all',  name: 'Dream 完结', desc: '通过全部 14 关',          icon: '🏆' },
  { id: 'endless3',   name: '无尽战士',   desc: '无尽模式单局通过 3 轮',   icon: '♾️' },
  { id: 'endless6',   name: '永不停歇',   desc: '无尽模式单局通过 6 轮',   icon: '🚀' },
  { id: 'daily',      name: '每日打卡',   desc: '完成一次每日挑战',        icon: '📅' },
  { id: 'no_item',    name: '裸装通关',   desc: '不使用道具通关任意关卡',  icon: '🧘' },
  { id: 'score500',   name: '高分少年',   desc: '单局得分超过 500',        icon: '💯' }
];

/* ---------- SVG 卡通头像（代码绘制，非真实形象） ---------- */
/* style: 0=Mark 1=Renjun 2=Jeno 3=Haechan 4=Jaemin 5=Chenle 6=Jisung */
function avatarSVG(member, size) {
  const i = MEMBERS.indexOf(member);
  const c = member.color;
  const badge = `<text x="74" y="26" font-size="17">${member.emoji}</text>`;
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
    <ellipse cx="41" cy="56" rx="3" ry="4.3" fill="#453a52"/>
    <ellipse cx="59" cy="56" rx="3" ry="4.3" fill="#453a52"/>
    <circle cx="42.2" cy="54.6" r="1.1" fill="#fff"/>
    <circle cx="60.2" cy="54.6" r="1.1" fill="#fff"/>
    <ellipse cx="33.5" cy="64" rx="4.2" ry="2.6" fill="#ffb3c0" opacity=".75"/>
    <ellipse cx="66.5" cy="64" rx="4.2" ry="2.6" fill="#ffb3c0" opacity=".75"/>
    <path d="M44 67 Q50 72.5 56 67" stroke="#c96f5e" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${badge}
  </svg>`;
}

/* 根据类型序号(1起)取成员 */
function memberByType(t) { return MEMBERS[t - 1]; }
