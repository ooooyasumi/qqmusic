# 同担默契局 · 项目说明（Agent 协作指南）

## 1. 项目概览

- **项目名**：同担默契局 · QQ 音乐 AI 社交测试
- **业务定位**：单页互动测试 H5 —— 选艺人、组 6 道题、生成房间链接、好友答完算默契分
- **形态**：竖屏 Web H5（mobile-first），在桌面端以「手机框」形式居中显示
- **当前阶段**：前端占位 + 视觉定稿（内容先用 mock 占位，等文案/题库回填）

## 2. 技术栈

- **Framework**：Next.js 16（App Router、Turbopack）
- **Core**：React 19
- **Language**：TypeScript 5（strict）
- **样式**：Tailwind CSS 4 + 全局 CSS 变量（衬线字体、艺人色板、动效）
- **UI 库**：shadcn/ui 默认装在 `src/components/ui/`，本项目极少用，主交互界面自建
- **状态**：React Context（`src/lib/state.tsx`）+ 内存状态机
- **路由**：纯前端 `state.screen` + URL hash（`#room=room-xxx`）
- **持久化**：浏览器 `localStorage`，key 为 `tongdan_moqi_rooms`（最多 20 个）

## 3. 目录结构与关键文件

```
src/
├── app/
│   ├── layout.tsx           # RootLayout：注入 next/font（Playfair / Cormorant / Noto Serif SC / JetBrains Mono）+ AppProvider
│   ├── page.tsx             # 入口：AppShell 包 ScreenRouter
│   └── globals.css          # 全局样式：色板、衬线字体、屏幕动画、艺人色背景光斑
├── components/
│   ├── TopBar.tsx           # 顶部导航：QQ Music 状态条 + 返回/我的房间
│   ├── Waveform.tsx         # 音频波形 SVG（带 mounted 防 hydration mismatch）
│   ├── Orbs.tsx             # 艺人色背景光斑（按当前艺人的 accent 上色）
│   ├── Toast.tsx            # 轻量提示（notify 队列）
│   └── screens/
│       ├── ScreenRouter.tsx     # 根据 state.screen 分发到 9 个屏幕
│       ├── HomeScreen.tsx       # 首页：艺人选择
│       ├── ArtistScreen.tsx     # 艺人页：题库方向
│       ├── CreateScreen.tsx     # 选 6 道题
│       ├── AnswerScreen.tsx     # 发起者/好友答题（共用）
│       ├── CreatorResultScreen.tsx  # 发起者结果 + 分享链接
│       ├── FriendResultScreen.tsx   # 好友结果 + 默契分 + 排行榜
│       ├── RoomsScreen.tsx      # 我的房间列表
│       └── RoomMissingScreen.tsx    # 房间丢失
├── lib/
│   ├── types.ts             # 全部类型定义（Artist / Bank / Question / Room / Result）
│   ├── data.ts              # mock 数据：4 个艺人 + 题库（先占位，可改）
│   ├── match.ts             # 默契分计算 + 结果解读
│   └── state.tsx            # AppContext + 路由/通知/房间 CRUD
```

## 4. 屏幕（screen）状态机

| screen              | 入口文件                       | 主要功能                              |
| ------------------- | ----------------------------- | ------------------------------------- |
| `home`              | `HomeScreen.tsx`              | 展示 4 个艺人，点选进入 `artist`     |
| `artist`            | `ArtistScreen.tsx`            | 展示艺人介绍 + 题库方向选择            |
| `create`            | `CreateScreen.tsx`            | 从 10 道里挑 6 道，可「帮我选 6 道」 |
| `creatorAnswer`     | `AnswerScreen.tsx`            | 发起者作答 6 题                       |
| `creatorResult`     | `CreatorResultScreen.tsx`     | 解读 + 房间链接 + 分享文案            |
| `friendAnswer`      | `AnswerScreen.tsx`            | 好友作答（同一套 6 题）               |
| `friendResult`      | `FriendResultScreen.tsx`      | 默契分 + 关系标签 + 推荐歌曲          |
| `rooms`             | `RoomsScreen.tsx`             | 本机 localStorage 房间列表 + 排行榜 |
| `roomMissing`       | `RoomMissingScreen.tsx`       | URL 房间 ID 找不到时落地              |

跳转函数：`go(target)` / `back()` 全部封装在 `state.tsx` 里，自动维护 `historyStack`。

## 5. 设计语言

详见 `DESIGN.md`。核心：
- 深紫蓝底（`#0d0a1f → #1a1530 → #251b3d`）+ 艺人色光斑 + 细颗粒噪点
- **衬线字体**是主旋律：Playfair Display（英文斜体大数）+ Cormorant Garamond（章节）+ Noto Serif SC（中文正文）+ JetBrains Mono（编号/小标签）
- 巨号数字、杂志感分割线、克制的氛围光

设计 Token 已通过 CSS 变量统一在 `globals.css`：`-bg-base / -ink-primary / -accent-gold / -accent-line` 等。

## 6. 开发规范

- 仅使用 pnpm。`pnpm install` / `pnpm add` / `pnpm remove`，**禁止 npm/yarn**。
- 端口：从 `${DEPLOY_RUN_PORT}` 读，沙箱主仓固定 5000。
- 严格 TS：禁止 `any`、禁止 `as any`，函数参数/返回必须有显式类型。
- 静态资源在 `public/`，引用走 `/xxx.png`。
- 写新页面：先在 `DESIGN.md` 落规范，再动代码。
- 新增屏幕：往 `state.tsx` 加 screen 枚举 + `ScreenRouter.tsx` 分发 + 写组件。
- 修改 mock 数据：编辑 `src/lib/data.ts`，结构按 `types.ts` 的 `Artist / Bank / Question`。
- 严禁在 JSX 渲染中直接 `Date.now()` / `Math.random()` / `typeof window`（hydration 红线）。`Waveform` 用了 `mounted` 模式是参考实现。

## 7. 常见修改指引

- **改艺人列表/题库/题目**：编辑 `src/lib/data.ts`，结构遵循 `Artist { id,name,accent,banks:[{questions:[{options:[{type}]}]}] }`。
- **改默契分算法**：编辑 `src/lib/match.ts` 的 `calculateMatch` / `tierFor`。
- **加屏幕**：`state.tsx` 加 `screen` 枚举值 → `ScreenRouter.tsx` 加分支 → 新建组件。
- **调整竖屏容器尺寸**：`globals.css` 的 `.app-stage`（手机外框）和 `.app-frame`（手机内容框）。
- **改字体**：`app/layout.tsx` 的 `next/font` 声明 + `globals.css` 的 CSS 变量。

## 8. 已知边界

- 房间数据仅本机 localStorage，跨设备/清缓存即丢
- 推荐歌曲点击目前只弹 toast，未真实跳转
- 排行榜是同房间内多好友的本地累计

## 9. 构建/启动

- 沙箱启动后服务自动在 `:5000` 监听，无需手动启停
- 修改代码触发 Fast Refresh（HMR），无需重启
- 验收走 `test_run`（默认跑 `pnpm ts-check` + `pnpm lint` + 服务探活）
