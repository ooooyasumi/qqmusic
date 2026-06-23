# 同担默契局前端链路文档

本文档只描述产品使用链路、页面状态、交互流转和前端数据关系，不包含视觉设计、配色、字体、动效或组件样式规范。

## 1. 产品目标

用户选择一个艺人，创建一套 6 道题的同担测试。发起者先完成答题并生成房间链接，好友通过链接进入同一套题作答，系统计算双方默契值、生成结果解读，并把好友成绩加入该房间排行榜。

## 2. 用户角色

### 发起者

发起测试的人。

主要任务：

- 选择艺人。
- 选择题库方向。
- 从 10 道题中选择 6 道。
- 先完成自己的 6 道题。
- 生成测试房间和分享链接。
- 查看好友答题后的排行榜。

### 好友

通过房间链接进入测试的人。

主要任务：

- 打开发起者分享的房间链接。
- 完成同一套 6 道题。
- 查看双方默契结果。
- 查看房间排行榜。

## 3. 页面状态

当前前端由 `state.screen` 控制页面状态。

| screen | 页面 | 说明 |
| --- | --- | --- |
| `home` | 首页 | 选择艺人入口 |
| `artist` | 艺人页 | 展示艺人测试介绍，选择题库方向 |
| `create` | 创建题目页 | 从当前题库 10 道题中选择 6 道 |
| `creatorAnswer` | 发起者答题页 | 发起者逐题作答 |
| `creatorResult` | 发起者结果页 | 生成发起者解读、房间链接 |
| `friendAnswer` | 好友答题页 | 好友逐题作答 |
| `friendResult` | 好友结果页 | 展示双方默契值、结果解读、推荐歌曲 |
| `rooms` | 房间列表页 | 展示本机创建过的房间和排行榜 |
| `roomMissing` | 房间丢失页 | hash 中的房间 ID 不存在时展示 |

## 4. 主链路：发起者创建测试

### 4.1 进入首页

入口页面：`home`

用户看到艺人列表。

可操作项：

- 点击某个艺人。
- 点击顶部“我的房间”入口。
- 点击顶部返回/首页按钮。

点击艺人后：

```text
state.artistId = 选中的艺人 id
state.bankId = "album"
go("artist")
```

### 4.2 选择题库方向

页面：`artist`

用户看到当前艺人的测试介绍和题库入口。

题库目前分为：

- `album`：专辑题库
- `lyric`：歌词题库

点击题库后：

```text
state.bankId = 选中的题库 id
state.selectedQuestionIds = []
state.creatorAnswers = {}
state.friendAnswers = {}
state.answerIndex = 0
go("create")
```

### 4.3 选择 6 道题

页面：`create`

用户从当前题库的 10 道题中选择 6 道。

规则：

- 点击未选题卡：加入选择。
- 点击已选题卡：取消选择。
- 最多选择 6 道。
- 未满 6 道时，“开始作答”不可用。
- 选满 6 道后，“开始作答”可用。

快捷操作：

- 点击“帮我选 6 道”：默认选择当前题库前 6 道题。

点击“开始作答”后：

```text
state.creatorAnswers = {}
state.answerIndex = 0
go("creatorAnswer")
```

### 4.4 发起者答题

页面：`creatorAnswer`

展示当前第 `answerIndex + 1` 道题。

用户点击某个选项后：

```text
state.creatorAnswers[question.id] = optionIndex
```

然后判断是否还有下一题：

- 如果还有下一题：

```text
state.answerIndex += 1
render()
```

- 如果已经是最后一题：

```text
createRoom()
go("creatorResult")
```

### 4.5 生成房间

执行函数：`createRoom()`

生成的数据结构：

```js
{
  id: `room-${Date.now()}`,
  artistId,
  artistName,
  bankId,
  bankName,
  title,
  link,
  questionIds,
  creatorAnswers,
  rankings: []
}
```

生成后：

```text
state.room = room
state.rooms.unshift(room)
saveRooms()
```

房间存储在本机 `localStorage`，键名为：

```text
tongdan_moqi_rooms
```

最多保留最近 20 个房间。

### 4.6 发起者结果页

页面：`creatorResult`

展示内容：

- 发起者个人解读。
- 个人标签、出题短评、题目风格、好友钩子。
- 分享文案。
- 房间链接。

可操作项：

- 复制链接。
- 打开房间链接。

点击“复制链接”：

```text
navigator.clipboard.writeText(state.room.link)
```

点击“打开房间链接”：

```text
window.location.hash = `room=${state.room.id}`
openRoom(state.room)
```

## 5. 主链路：好友进入测试

### 5.1 打开房间链接

房间链接通过 URL hash 携带房间 ID：

```text
#room=room-xxxx
```

页面初始化或 hash 变化时执行：

```text
initRoute()
```

如果找到对应房间：

```text
state.room = room
state.artistId = room.artistId
state.bankId = room.bankId
state.selectedQuestionIds = room.questionIds
state.creatorAnswers = room.creatorAnswers
state.friendAnswers = {}
state.answerIndex = 0
state.screen = "friendAnswer"
```

如果找不到房间：

```text
state.screen = "roomMissing"
```

### 5.2 好友答题

页面：`friendAnswer`

好友看到与发起者相同的 6 道题。

用户点击某个选项后：

```text
state.friendAnswers[question.id] = optionIndex
```

然后判断是否还有下一题：

- 如果还有下一题：

```text
state.answerIndex += 1
render()
```

- 如果已经是最后一题：

```text
go("friendResult")
```

### 5.3 计算默契结果

页面：`friendResult`

进入该页面时调用：

```text
calculateMatch()
```

计算逻辑：

```text
same = 发起者和好友答案相同的题目数量
creatorProfile = 发起者答案画像
friendProfile = 好友答案画像
score = min(99, 52 + same * 7 + 同类型加成)
```

同类型加成：

```text
creatorProfile.topType === friendProfile.topType ? 8 : 0
```

结果分层：

| 分数 | 分层 |
| --- | --- |
| `> 90` | 同担爱听 |
| `80 - 90` | 高默契补听 |
| `65 - 79` | 互补歌单 |
| `< 65` | 破冰推荐 |

### 5.4 写入排行榜

如果当前存在 `state.room`，好友完成答题后会被加入该房间排行榜：

```text
state.room.rankings.push({
  name: `好友 ${nextIndex}`,
  score,
  label: result.title
})
```

然后按分数降序排序：

```text
state.room.rankings.sort((a, b) => b.score - a.score)
```

同步更新本地 `state.rooms` 中对应房间，并写回 `localStorage`。

### 5.5 好友结果页

展示内容：

- 默契分数。
- 结果标题。
- 关系标签。
- 默契短评。
- 分歧看点。
- 推荐分层。
- 结果解读。
- 推荐歌曲。

可操作项：

- 分享结果：当前只展示 toast，不进行真实分享。
- 查看房间排名：进入 `rooms` 页面。

## 6. 房间列表链路

页面：`rooms`

入口：

- 首页顶部“我的房间”按钮。
- 好友结果页点击“查看房间排名”。

展示内容：

- 本机 `localStorage` 中创建过的房间。
- 每个房间的标题、链接和排行榜。

当前限制：

- 页面只展示 `state.rooms.slice(0, 4)`。
- 数据只保存在当前设备浏览器本地。
- 换设备或清除浏览器缓存后，房间不可恢复。

## 7. 异常链路

### 7.1 房间不存在

触发条件：

```text
URL hash 中存在 room id，但 localStorage 找不到对应 room
```

进入页面：

```text
roomMissing
```

用户可操作：

- 点击“回到首页”。

执行：

```text
window.location.hash = ""
go("home")
```

### 7.2 选题超过 6 道

触发条件：

```text
state.selectedQuestionIds.length >= 6
用户继续点击未选题目
```

前端行为：

```text
notify("最多选择 6 道题。")
```

### 7.3 点击收听入口

部分选项或推荐歌曲带有 `listenUrl`。

当前行为：

```text
notify("已打开收听入口：" + listenUrl)
```

注意：当前代码只弹出提示，没有真正打开外链。

## 8. 顶部导航链路

顶部按钮：

- 我的房间：`go("rooms")`
- 返回：执行 `back()`
- 首页：`go("home")`

返回逻辑：

```text
historyStack.pop()
```

如果存在上一页：

```text
state.screen = previous
render()
```

如果没有上一页：

```text
go("home", false)
```

## 9. 前端状态字段

```js
const state = {
  screen: "home",
  artistId: "jay",
  bankId: "album",
  selectedQuestionIds: [],
  creatorAnswers: {},
  friendAnswers: {},
  answerIndex: 0,
  room: null,
  rooms: loadRooms()
};
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `screen` | string | 当前页面状态 |
| `artistId` | string | 当前选择的艺人 |
| `bankId` | string | 当前选择的题库 |
| `selectedQuestionIds` | string[] | 发起者选中的 6 道题 |
| `creatorAnswers` | object | 发起者答案，key 为 question.id |
| `friendAnswers` | object | 好友答案，key 为 question.id |
| `answerIndex` | number | 当前答题进度索引 |
| `room` | object/null | 当前房间 |
| `rooms` | object[] | 本机已创建房间列表 |

## 10. 数据来源

### 艺人数据

定义在前端常量：

```text
artists
```

当前艺人：

- 周杰伦
- 林俊杰
- Taylor Swift
- BLACKPINK

每个艺人包含：

- `id`
- `name`
- `short`
- `accent`
- `hook`
- `card`
- `title`
- `intro`
- `tags`
- `songs`
- `banks`

### 题库数据

每个艺人的 `banks` 下包含多个题库。

每个题库包含：

- `name`
- `icon`
- `desc`
- `questions`

每道题包含：

- `id`
- `title`
- `options`

每个选项包含：

- `text`
- `note`
- `type`
- 可选 `mediaType`
- 可选 `cover`
- 可选 `listenUrl`

## 11. 本地存储

存储键：

```text
tongdan_moqi_rooms
```

写入时机：

- 发起者完成答题并创建房间。
- 好友完成答题后排行榜更新。

读取时机：

- 页面初始化时。

限制：

- 当前没有服务端。
- 当前没有账号系统。
- 当前没有跨设备房间同步。
- 房间分享实际依赖同一浏览器本地存储。

## 12. 当前前端能力边界

当前已实现：

- 艺人选择。
- 题库选择。
- 6 道题创建。
- 发起者答题。
- 房间链接生成。
- hash 路由进入房间。
- 好友答题。
- 默契分数计算。
- 结果页展示。
- 排行榜本地更新。
- 房间列表本地查看。

当前未实现或仅模拟：

- 真实后端房间。
- 跨设备分享。
- 用户昵称输入。
- 真实分享卡生成。
- 真实打开 QQ 音乐收听链接。
- 真实登录态。
- 数据埋点。
- 服务端排行榜。

## 13. 推荐的前端链路拆分

如果后续改造成组件化前端，可按以下模块拆分：

```text
AppShell
HomeScreen
ArtistScreen
QuestionPickerScreen
AnswerScreen
CreatorResultScreen
FriendResultScreen
RoomsScreen
RoomMissingScreen
Leaderboard
OptionCard
QuestionCard
Toast
```

推荐状态拆分：

```text
artist selection state
question selection state
answering state
room state
result state
toast state
```

推荐路由：

```text
/
/artist/:artistId
/create/:artistId/:bankId
/room/:roomId
/rooms
```

如果保留纯静态单页，也可以继续使用 hash：

```text
#room=room-xxxx
```

