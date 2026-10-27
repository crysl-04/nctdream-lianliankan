# 🌈 NCT DREAM 连连看 · Dream Match

一个以 **NCT DREAM** 为主题的连连看（Lianliankan / Tile-Matching）小游戏。
纯 HTML / CSS / JavaScript 实现，**零依赖、零付费素材**——成员头像全部由代码绘制的 SVG 卡通形象，音效由 WebAudio 实时合成，可以离线游玩（PWA）。

> 🎮 **在线游玩：https://crysl-04.github.io/nctdream-lianliankan/**
>
> ⚠️ 非官方粉丝作品，与 SM Entertainment 无关。页面中的卡通头像为程序绘制，不含任何真实照片。

## ✨ 特性

- **经典闯关模式**：14 个关卡，以 NCT DREAM 的歌曲命名（Chewing Gum → Smoothie），难度逐步提升，通关评星（⭐⭐⭐）
- **无尽模式**：棋盘越来越大，看你能坚持多少轮
- **规则纯正**：两张相同成员卡片、路径转折不超过 2 次即可消除，允许沿棋盘外侧绕行；死局自动洗牌
- **道具系统**：💡 提示 / 🔀 洗牌 / ⏰ 加时 20 秒
- **连击系统**：限时连消有额外加分与欢呼语（"We Go Up!"、"Boom!"……）
- **成员图鉴**：七位成员（MARK / RENJUN / JENO / HAECHAN / JAEMIN / CHENLE / JISUNG）的卡通档案卡
- **合成音效 & BGM**：WebAudio 现场合成，无任何音频文件，可分别开关
- **进度存档**：localStorage 保存解锁进度、评星、最佳分数
- **手机适配 + PWA**：响应式布局，可添加到主屏幕，支持离线
- **可视化特效**：消除连线动画、连击飘字、彩带庆祝

## 🎮 玩法

1. 点击两张**相同的成员卡片**
2. 若它们可以用**不超过 2 个转折**的路径连通（路径只能经过空白处，可以绕到棋盘外面），即可消除
3. 在时间耗尽前清空整个棋盘！快速连消可以触发连击加分

## 🛠️ 本地运行

无需构建，任选其一：

```bash
# 直接双击 index.html 用浏览器打开，或
cd nctdream-lianliankan
python -m http.server 8080    # 访问 http://localhost:8080
```

## 📁 目录结构

```
├── index.html        页面结构
├── css/style.css     样式（梦幻渐变 + 玻璃拟态）
├── js/data.js        成员数据 / 关卡数据 / SVG 头像绘制
├── js/audio.js       WebAudio 合成音效与 BGM
├── js/game.js        核心逻辑（棋盘、≤2 折连通判定、死局处理）
├── js/ui.js          UI 渲染、动画、弹窗
├── js/main.js        入口
├── sw.js / manifest.json  PWA 支持
└── ROADMAP.md        开发路线图
```

## 🧩 技术要点

- **连通判定**：0-1 BFS（直行代价 0、转弯代价 1），天然给出连线坐标用于绘制动画，比"横/一折/二折"三分支写法更不易出错
- **死局保证**：每次消除后检测全局是否存在可消对，不存在则自动重排并保证重排后可解
- **头像**：纯 SVG 路径绘制的卡通形象，按成员应援色 + 代表 emoji（粉丝共识：Mark🐯 Renjun🦊 Jeno🐶 Haechan☀️ Jaemin🐰 Chenle🐬 Jisung🐹）区分

## 📄 License

代码以 MIT 协议开源。NCT DREAM 名称及相关权利归 SM Entertainment 所有，本项目为粉丝二创，不含任何官方素材。
