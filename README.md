# QQ Music 同担默契局

一个基于 Next.js 的音乐偏好互动应用。用户可以选择歌手、挑选 6 首喜欢的歌曲、拖拽排序，并生成分享房间让好友完成同一套排序，最后对比两人的音乐默契。

## 功能

- 歌手选择：首页展示 4 位歌手入口。
- 歌曲选择：初始页展示歌单前 5 首，展开页展示完整歌单。
- 搜索歌曲：支持按歌曲名和专辑名搜索。
- 拖拽排序：选择 6 首歌后进行 Top6 排序。
- 好友对比：通过房间链接让好友排序，并展示匹配结果。
- 远程图片资源：歌手图和专辑封面已迁移到腾讯云 COS。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- pnpm

## 本地开发

安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

默认访问地址：

```text
http://localhost:5000
```

构建生产版本：

```bash
pnpm build
```

启动生产服务：

```bash
pnpm start
```

类型检查和 lint：

```bash
pnpm run validate
```

## 项目结构

```text
src/
├── app/                  # Next.js App Router
├── components/           # 页面组件和通用组件
├── components/screens/   # 主要业务页面
├── components/ui/        # shadcn/ui 基础组件
└── lib/                  # 数据、状态和匹配逻辑
```

## 资源说明

图片资源使用腾讯云 COS：

```text
https://web-resource-1372876299.cos.ap-guangzhou.myqcloud.com/qqmusic/
```

主要目录：

- `qqmusic/artists/`：歌手图片
- `qqmusic/covers/`：专辑封面
- `qqmusic/assets/`：其他静态资源

本地 `public` 图片已删除，代码中的图片引用均指向 COS。
