'use strict';
/* 临时检查：历史记录上限与主题默认值 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

globalThis.UI = {};
globalThis.SFX = {};
globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const src = [
  fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'),
  fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8'),
  '\n;globalThis.__N = { Game, Save };'
].join('\n');
vm.runInThisContext(src, { filename: 'history-check-bundle.js' });
const { Save } = globalThis.__N;

Save.pushHistory({ mode: 'classic', label: 'test', score: 1, win: true });
for (let i = 0; i < 20; i++) Save.pushHistory({ mode: 'endless', label: 'x' + i, score: i, win: true });
console.log('history cap ok:', Save.data.history.length === 12, '| latest first:', Save.data.history[0].label === 'x19');
console.log('theme default ok:', Save.data.settings.theme === 'dream');
