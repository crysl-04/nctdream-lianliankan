'use strict';
/* ============================================================
 * NCT DREAM 连连看 - 入口
 * ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
  UI.init();

  /* 菜单页展示七位成员小头像 */
  const box = document.getElementById('menu-avatars');
  if (box) {
    box.innerHTML = MEMBERS.map(m => avatarSVG(m, 52)).join('');
  }
});

window.addEventListener('resize', () => {
  UI.layoutBoard();
});

/* PWA Service Worker（失败静默，不影响游戏） */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
