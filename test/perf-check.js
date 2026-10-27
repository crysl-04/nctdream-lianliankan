'use strict';
/* 性能体检：最大棋盘下 findAnyPair 的耗时 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

globalThis.UI = {};
globalThis.SFX = {};
globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const src = [
  fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'),
  fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8'),
  '\n;globalThis.__N = { Game };'
].join('\n');
vm.runInThisContext(src, { filename: 'perf-bundle.js' });
const { Game } = globalThis.__N;

Game.startClassic(13); // Smoothie 12×8=96 格
Game.stopTimer();

const N = 200;
let t0 = process.hrtime.bigint();
for (let i = 0; i < N; i++) Game.findAnyPair();
let t1 = process.hrtime.bigint();
console.log(`findAnyPair 平均耗时: ${(Number(t1 - t0) / 1e6 / N).toFixed(3)} ms（12×8 满盘）`);

/* 稀疏盘（大量空格，扫描路径更长） */
Game.tiles.forEach(t => {
  t.alive = t.type <= 2;
  Game.grid[t.r][t.c] = t.alive ? t.type : 0;
});
t0 = process.hrtime.bigint();
for (let i = 0; i < N; i++) Game.findAnyPair();
t1 = process.hrtime.bigint();
console.log(`findAnyPair 平均耗时（稀疏盘）: ${(Number(t1 - t0) / 1e6 / N).toFixed(3)} ms`);
