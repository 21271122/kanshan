# 看山沃野

把知乎收藏变成会生长的回忆的黑客松 Demo。

## 立即运行

```powershell
npm install
npm run dev
```

打开 `http://localhost:3000`，点击“进入演示农场”。演示模式无需账号和密钥，支持：

- 收藏夹多选与内容来源锁定
- 10 块地随机播种、种子／幼苗／成熟三个阶段
- 首次进入的成熟引导作物
- 浇水轻度加速、提前铲除、成熟收获和原帖跳转
- 本轮已收获内容去重、回顾进度、成就和新一轮回顾
- 浏览器刷新后保留农场状态

右上角“演示加速”可让作物快速变换阶段，适合现场演示。

## 上线接入

复制 `.env.example` 为 `.env.local`，按 [技术实现文档](./技术实现文档.md) 填写知乎 OAuth 与 CloudBase 变量。密钥只应存在于本地或 CloudBase 的服务端环境变量中。

当前 `/api/auth/zhihu` 是一个安全占位入口：没有配置时会明确返回提示，不会伪造登录或把密钥暴露给浏览器。真实上线需要在该路由及对应回调路由接入黑客松 `zhihu-cli` 的 OAuth / 收藏夹能力，并将农场读写切换到 CloudBase 数据库。

部署到 CloudBase HTTP 云函数前，请先在本地运行 `npm run build`。项目根目录中的 `scf_bootstrap` 是 CloudBase 的启动文件：请保持其无扩展名和 LF 换行。Windows 用户需在 Git Bash 或 WSL 中执行一次 `chmod +x scf_bootstrap` 后再上传；详情见技术实现文档。

## 验证

```powershell
npm run build
```

项目使用 Next.js standalone 输出，适合按技术文档部署至 CloudBase HTTP 云函数。
