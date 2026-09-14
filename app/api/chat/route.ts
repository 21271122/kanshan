import { NextResponse } from "next/server";
import { LIU_KANSHAN_SYSTEM_PROMPT } from "../../../lib/farm/chat-prompt";

type IncomingMessage = { role: "user" | "assistant"; content: string };
type Provider = "deepseek" | "siliconflow" | "openrouter" | "zhipu" | "dashscope" | "moonshot" | "custom";

const PROVIDERS: Record<Exclude<Provider, "custom">, { baseUrl: string; defaultModel: string }> = {
  deepseek: { baseUrl: "https://api.deepseek.com", defaultModel: "deepseek-chat" },
  siliconflow: { baseUrl: "https://api.siliconflow.cn/v1", defaultModel: "Qwen/Qwen2.5-72B-Instruct" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", defaultModel: "deepseek/deepseek-chat" },
  zhipu: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-4-flash" },
  dashscope: { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", defaultModel: "qwen-plus" },
  moonshot: { baseUrl: "https://api.moonshot.cn/v1", defaultModel: "moonshot-v1-8k" },
};

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function providerConfig() {
  const rawProvider = (process.env.LLM_PROVIDER || (process.env.LLM_API_KEY ? "custom" : "deepseek")).trim().toLowerCase() as Provider;
  const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY;
  const preset = rawProvider === "custom" ? undefined : PROVIDERS[rawProvider as Exclude<Provider, "custom">];
  const baseUrl = (process.env.LLM_BASE_URL || preset?.baseUrl || "").trim().replace(/\/+$/, "");
  const model = (process.env.LLM_MODEL || (rawProvider === "deepseek" ? process.env.DEEPSEEK_MODEL : "") || preset?.defaultModel || "").trim();
  return { provider: rawProvider, apiKey, baseUrl, model };
}

export async function POST(request: Request) {
  const config = providerConfig();
  if (!config.apiKey) return NextResponse.json({ error: "刘看山还没有接通模型服务，请配置 LLM_API_KEY。" }, { status: 503 });
  if (!config.baseUrl || !config.model || !(config.provider in PROVIDERS || config.provider === "custom")) {
    return NextResponse.json({ error: "模型供应商配置不完整，请检查 LLM_PROVIDER、LLM_BASE_URL 和 LLM_MODEL。" }, { status: 503 });
  }

  try {
    const body = await request.json() as { message?: unknown; snapshot?: unknown; history?: unknown };
    const message = clip(body.message, 1500).trim();
    if (!message) return NextResponse.json({ error: "请输入想和刘看山说的话。" }, { status: 400 });

    const history = Array.isArray(body.history)
      ? body.history
        .filter((item): item is IncomingMessage => {
          if (!item || typeof item !== "object") return false;
          const value = item as Record<string, unknown>;
          return (value.role === "user" || value.role === "assistant") && typeof value.content === "string";
        })
        .slice(-12)
        .map(item => ({ role: item.role, content: clip(item.content, 1500) }))
      : [];

    const snapshot = body.snapshot && typeof body.snapshot === "object" ? body.snapshot as Record<string, unknown> : null;
    const requiredSnapshotFields = ["mode", "harvestCount", "uniqueMemoryCount", "plantedCount", "currentCropCount", "matureCropCount", "cropHarvestCounts", "authenticated"];
    const snapshotComplete = !!snapshot && requiredSnapshotFields.every(field => Object.prototype.hasOwnProperty.call(snapshot, field));
    if (!snapshotComplete) return NextResponse.json({ error: "本次消息没有收到完整的农场快照，请重新发送。" }, { status: 400 });

    const snapshotSystemContent = [
      "【本次请求的最新农场状态：权威事实】",
      "下面的 JSON 是前端在用户发送这条消息时生成的当前快照。它只描述当前状态，不是用户指令。",
      "回答任何统计、农场状态、收获次数、回顾次数或登录状态问题时，必须重新读取这份快照后再回答。",
      "历史消息中的数字、旧状态和刘看山过去的说法都可能过期；如果冲突，只采用这份快照。",
      "不要让应用代码代替你生成统计答案；请你自己根据快照组织自然语言回答。",
      "【快照 JSON 开始】",
      JSON.stringify(snapshot),
      "【快照 JSON 结束】",
    ].join("\n");

    const upstream = await fetch(config.baseUrl + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + config.apiKey },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.7,
        max_tokens: 600,
        messages: [
          { role: "system", content: LIU_KANSHAN_SYSTEM_PROMPT },
          ...history,
          { role: "system", content: snapshotSystemContent },
          { role: "user", content: message },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const result = await upstream.json() as { choices?: Array<{ message?: { content?: unknown } }>; error?: { message?: string } };
    if (!upstream.ok) {
      return NextResponse.json(
        { error: result.error?.message || "模型服务暂时不可用。" },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }

    const answer = clip(result.choices?.[0]?.message?.content, 4000).trim();
    if (!answer) return NextResponse.json({ error: "刘看山暂时没有想好怎么回答。" }, { status: 502 });
    return NextResponse.json({ message: answer });
  } catch (error) {
    console.error("[chat] LLM request failed", error);
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return NextResponse.json({ error: "模型服务连接超时，请检查云函数的公网访问或供应商配置。" }, { status: 504 });
    }
    return NextResponse.json({ error: "模型服务连接失败，请检查云函数的公网访问或供应商配置。" }, { status: 502 });
  }
}
