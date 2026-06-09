import OpenAI from "openai";

let client;

function getClient() {
  if (!process.env.DASHSCOPE_API_KEY) {
    const error = new Error("DASHSCOPE_API_KEY is not configured");
    error.status = 500;
    throw error;
  }

  client ??= new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: process.env.DASHSCOPE_API_BASE,
    timeout: 120000,
  });

  return client;
}

export async function callLLM({
  messages,
  model = process.env.DASHSCOPE_MODEL || "qwen3.5-plus-2026-04-20",
  temperature = 0,
} = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    const error = new Error("messages is required");
    error.status = 400;
    throw error;
  }

  try {
    console.log("🚀 ~ callLLM:", model);

    const completion = await getClient().chat.completions.create({
      model,
      messages,
      temperature,
      enable_thinking: false,
    });

    const content = completion.choices?.[0]?.message?.content || "";
    console.log("🚀 ~ callLLM ~ content:", content);

    return content;
  } catch (error) {
    console.log(`错误信息：${error}`);
    console.log(
      "请参考文档：https://help.aliyun.com/model-studio/developer-reference/error-code"
    );
    throw error;
  }
}
