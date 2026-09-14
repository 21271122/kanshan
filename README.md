# 看山沃野

“看山沃野”是一个把知乎收藏变成轻量农场的 Next.js Demo。用户可以在演示农场中种植、照料和收获作物，也可以通过知乎 OAuth 读取收藏夹，把收藏作为农场内容。刘看山是陪伴用户的北极狐：他可以读取农场统计和用户主动分享的想法，但看不到知乎原帖全文。

## 快速开始

需要 Node.js 18.17+（建议 Node.js 20）。

~~~powershell
npm install
Copy-Item .env.example .env.local
npm run dev
~~~

打开 http://localhost:3000。

不配置环境变量也可以体验演示农场和本地玩法；聊天、知乎登录和个人收藏同步需要对应的服务端变量。

## 环境变量

所有变量只配置在服务端环境，不要写进前端代码，也不要提交 '.env.local'。

### DeepSeek 聊天

~~~dotenv
DEEPSEEK_API_KEY=你的服务端密钥
DEEPSEEK_MODEL=deepseek-chat
~~~

每次发送消息时，前端会把当前农场快照发送到 '/api/chat'。服务端将快照放入本次请求的 system 消息，再调用 DeepSeek。快照包括收获数、回顾收藏数、当前作物数、成熟数、分类收获次数、登录状态等。

### 知乎登录和收藏同步

~~~dotenv
APP_URL=http://localhost:3000
ZHIHU_OAUTH_APP_ID=你的知乎 OAuth App ID
ZHIHU_OAUTH_APP_KEY=你的知乎 OAuth App Key
ZHIHU_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/zhihu/callback
ZHIHU_ACCESS_SECRET=你的知乎 Access Secret
~~~

'ZHIHU_OAUTH_REDIRECT_URI' 必须与知乎开放平台登记的回调地址完全一致。生产环境请改成部署域名对应的 HTTPS 地址。

'SESSION_ENCRYPTION_KEY'、'CLOUDBASE_ENV_ID'、'CLOUDBASE_SECRET_ID' 和 'CLOUDBASE_SECRET_KEY' 已保留在示例模板中，当前代码不依赖它们才能运行；如果后续接入 CloudBase 数据库，再按部署方案配置。

## 功能

- 演示农场：本地种植、浇水、成长、成熟和收获。
- 个人农场：知乎 OAuth 登录后读取收藏夹和收藏条目元数据。
- 收获记录、轮次、作物图鉴、成就和本地存档。
- 演示农场和个人农场分开保存，不混用进度。
- 刘看山连续对话、新建和删除会话。
- 回车发送，Shift+Enter 换行；聊天消息接近底部时自动滚动。
- LLM 明确知道自己看不到知乎原帖全文，只能依据农场统计和用户主动分享的内容回应。
- 所有运行时图片和动画位于 'public/assets/'，不依赖远程素材。

## 项目结构

~~~text
app/
  page.tsx                         页面入口
  api/chat/route.ts                DeepSeek 服务端代理
  api/auth/zhihu/*                 知乎 OAuth、回调、退出登录和状态
  api/favlists/*                   知乎收藏夹同步
components/farm/
  game.tsx                         游戏壳和面板路由
  use-farm.ts                      农场状态控制器和本地持久化
  chat-panel.tsx                   聊天界面与会话历史
  scene.tsx, panels.tsx, dialog.tsx UI 组件
lib/farm/
  model.ts                         纯农场规则和状态机
  storage.ts                       存档校验、迁移和本地存储
  catalog.ts                       收藏元数据校验与合并
  chat-context.ts                  LLM 实时快照
  chat-prompt.ts                   刘看山系统提示词
public/assets/                     运行时素材
scripts/test-core.cjs              核心玩法测试
scripts/prepare-cloudbase-upload.ps1 CloudBase 上传包构建
scf_bootstrap                      CloudBase HTTP 云函数启动入口
~~~

## 测试和构建

~~~powershell
npm run lint       # TypeScript 类型检查
npm test           # 核心玩法测试
npm run build      # Next.js 生产构建
~~~

如果需要验证生产构建：

~~~powershell
$env:NEXT_DIST_DIR = ".next-verify"
npm run build
~~~

## CloudBase 部署

先构建上传目录：

~~~powershell
npm run package:cloudbase
~~~

脚本会生成一个类似 '.cloudbase-upload-YYYYMMDD-HHmmss' 的目录，包含：

- '.next'
- 'public'
- 'package.json'
- 'package-lock.json'
- 'next.config.mjs'
- 'scf_bootstrap'

将该目录部署为 CloudBase HTTP 云函数，并在同一个云函数环境中配置 'DEEPSEEK_API_KEY'、知乎 OAuth 变量和 'APP_URL'。修改变量后需要重新发布或重启云函数。

部署后可检查：

- '/api/health' 返回 '{"ok":true,...}'；
- '/api/chat' 不应返回 404；
- 未配置 'DEEPSEEK_API_KEY' 时返回 503；
- DeepSeek 暂时过载时会返回上游错误，稍后重试即可。

## 数据与边界

农场进度和聊天记录默认保存在浏览器 localStorage，没有内置数据库同步。知乎同步读取的是收藏夹和收藏条目的元数据，不注入帖子正文。原始设计稿和导出素材不参与运行，已排除在 Git 仓库之外；运行时所需素材只保留在 'public/assets/'。

## 安全

- 不要提交 '.env.local'、API Key、OAuth Secret、Cookie 或本地存档。
- DeepSeek 和知乎凭证只能放在服务端环境变量。
- 推送前检查 'git status --ignored' 和 'git diff --check'。
