import { NextResponse } from "next/server";

/**
 * 真实部署时在此处生成 state、写入 HttpOnly Cookie，并跳转知乎 OAuth 授权页。
 * Demo 没有密钥时不能伪造授权，因此给出明确提示而不暴露任何凭据。
 */
export async function GET() {
  if (!process.env.ZHIHU_OAUTH_APP_ID || !process.env.ZHIHU_OAUTH_REDIRECT_URI) {
    return NextResponse.json(
      { error: "尚未配置知乎 OAuth。请在 .env.local 或 CloudBase 环境变量中填写配置。" },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: "OAuth Gateway 待接入 zhihu-cli skill 后启用。" }, { status: 501 });
}
