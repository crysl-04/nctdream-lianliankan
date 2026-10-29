'use strict';
/* ============================================================
 * NCT DREAM 连连看 - 入口
 * ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
  UI.init();

  /* 菜单页展示七位成员头像（可点击选本命） */
  const box = document.getElementById('menu-avatars');
  if (box) {
    box.innerHTML = MEMBERS.map(m =>
      `<button class="menu-avatar-btn" data-bias="${m.id}" aria-label="${m.cn}">${avatarSVG(m, 52)}</button>`
    ).join('');
    UI.refreshBiasUI();
  }
});

window.addEventListener('resize', () => {
  UI.layoutBoard();
});

/* 切走页面/回到页面时自动暂停与恢复计时 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) Game.pauseTimer();
  else Game.resumeTimer();
});

/* PWA Service Worker（失败静默，不影响游戏） */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
