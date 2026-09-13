# 看山沃野

把过去收藏的内容种进一座轻量农场，等一段回忆慢慢长出来。

## 开始体验

```powershell
npm install
npm run dev
```

打开 http://localhost:3000。

- **演示农场**无需账号，首次进入有一株成熟果实。演示标题是示例，收获打开知乎同名话题搜索。
- **个人农场**可以在“内容来源 → 导入旧收藏”填写标题和知乎回答/文章链接，或批量导入 JSON。新农场首次进入会准备一株成熟引导作物。
- 两座农场分别保存在浏览器，不会混用进度；可在设置中切换、导出和恢复备份。

## 本次改版

- 100dvh 游戏视口：HUD、十块场景地块、刘看山、底部操作栏和原生对话框。
- 点击空地随机播种；幼苗展示线索；成熟先预览，成功发起原帖新标签页打开后才计入收获。
- 预览关闭、弹窗被拦截均不改变作物和重温进度。
- 每株可浇水一次，缩短约 10% 时间；离线自动成长，没有枯萎或打卡。
- 演示成熟约 80 秒，个人农场约 10 分钟，带小幅随机变化。演示快进移入设置。
- 收获记录包含标题、来源、时间和再次打开入口。新轮次需先完成当前选中来源，历史记录保留。
- V1 存档会迁移；原存档不删除。损坏存档不会被自动覆盖，可导出原始数据后在设置中重建。
- 支持减少动态效果、键盘 Escape、对话框焦点限制和关闭后的焦点恢复。

## 收藏导入

单篇导入只需标题和原帖链接。批量导入为 JSON 数组：

```json
[
  {
    "title": "替换为收藏的真实标题",
    "url": "https://www.zhihu.com/question/123/answer/456",
    "favlist": "想再读一遍",
    "hint": "时间 · 日常 · 回忆",
    "tags": ["生活"]
  }
]
```

示例链接仅说明格式，请换成自己的真实原帖。接受知乎回答和专栏文章的 HTTPS 永久链接。必填 title、url；其他字段可选；按规范化原帖链接去重。个人农场上限 500 篇；批量文件不超过 1 MB。不导入正文。

## 模块边界

| 模块 | 职责 |
| --- | --- |
| lib/farm/model.ts | 可独立测试的玩法规则、去重、生长、轮次、成就 |
| lib/farm/catalog.ts | 收藏元数据校验与合并，不执行不可信 URL |
| lib/farm/storage.ts | V2 存档验证、旧版本迁移、链接目标验证 |
| lib/farm-assets.ts | PNG/GIF 语义化清单、尺寸、回退、动画时间 |
| components/farm/use-farm.ts | 本地存档控制器、命令、事件、原帖打开 |
| components/farm/scene.tsx | 场景、地块、作物图层、角色动作与区域配置 |
| components/farm/panels.tsx | 来源、预览、记录、帮助、地图、设置 |
| components/farm/dialog.tsx | 原生 dialog 生命周期与焦点恢复 |
| components/farm/game.tsx | 单一游戏壳与浮层路由 |

## 素材交付

素材放到 public/assets/farm/，在 lib/farm-assets.ts 中更新对应条目。未交付素材使用 `available: false`，不会请求不存在的文件；提供文件后改为 `true` 或删除该字段。

PNG 和 GIF 由同一组件加载：GIF → 静态 fallback → 内置图形。图片加载失败也会回退。减少动态效果时 GIF 使用静态图。现有 idle GIF 保留；新增透明 idle PNG 从其首帧提取。未交付的动作使用静态角色和 CSS 动作，场景与作物使用内置 SVG 占位，不依赖远程图片。

农场状态只保存 zoneId、assetFamily 等语义标识，不保存素材路径。区域清单预留东侧新田和山坡果园，本次不开放额外土地。

## 验证

```powershell
npm test
npm run build
```

如果开发服务器正在运行，用独立输出目录构建，避免相互覆盖：

```powershell
$env:NEXT_DIST_DIR = ".next-verify"
npm run build
node node_modules/next/dist/bin/next start -p 3111
```

默认构建仍输出 .next，兼容现有 CloudBase 打包脚本。

浏览器回归脚本 `scripts/qa-browser.cjs` 使用 Playwright 和本机 Chrome；默认访问 http://localhost:3111。设置 PLAYWRIGHT_PACKAGE 为已安装的 playwright 包路径，QA_OUTPUT 为截图输出目录。脚本拦截外部知乎导航，仅验证目的链接和收获动作，不访问真实帖子。覆盖 1440×900、1366×768、390×844、375×667、667×375。

## 真实知乎同步的边界

当前可运行的是本地农场与手动收藏导入。OAuth 路由仍为明确返回 503/501 的占位接口，**尚未实现账号授权、收藏夹自动读取、CloudBase 持久化和跨设备同步**。不应把填写环境变量或部署当作已完成接入。

真实服务接入时需按《技术实现文档》实现服务端会话、ZhihuGateway、账号隔离的数据库与农场事务接口；前端控制器替换存取实现，保留玩法和素材组件。鉴权与密钥只留在服务端。

部署步骤参见《部署操作手册》，本轮没有发布到外部环境。
