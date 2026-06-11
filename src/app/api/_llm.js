import OpenAI from "openai";
import { defaultLlmSettings } from "../config";
import { normalizeLlmSettings } from "../llmSettings";

const clientCache = new Map();

function getClient(settings) {
  const apiKey = settings.apiKey || process.env.DASHSCOPE_API_KEY;
  const baseURL = settings.baseURL || process.env.DASHSCOPE_API_BASE;
  const timeout = settings.timeout * 1000;

  if (!apiKey) {
    const error = new Error("请先配置 API_KEY ");
    error.status = 500;
    throw error;
  }

  const cacheKey = JSON.stringify([apiKey, baseURL, timeout]);

  if (!clientCache.has(cacheKey)) {
    clientCache.set(
      cacheKey,
      new OpenAI({
        apiKey,
        baseURL,
        timeout,
      })
    );
  }

  return clientCache.get(cacheKey);
}

export async function callLLM({
  messages,
  llmSettings,
  model,
  temperature,
  topP,
  maxTokens,
  enableThinking,
} = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    const error = new Error("messages is required");
    error.status = 400;
    throw error;
  }

  const settings = normalizeLlmSettings({
    ...llmSettings,
    model: model ?? llmSettings?.model ?? process.env.DASHSCOPE_MODEL,
    temperature: temperature ?? llmSettings?.temperature,
    topP: topP ?? llmSettings?.topP,
    maxTokens: maxTokens ?? llmSettings?.maxTokens,
    enableThinking: enableThinking ?? llmSettings?.enableThinking,
    timeout: llmSettings?.timeout ?? defaultLlmSettings.timeout,
    baseURL: llmSettings?.baseURL ?? process.env.DASHSCOPE_API_BASE,
  });

  try {
    console.log("🚀 ~ callLLM:", settings.model);

    const completion = await getClient(settings).chat.completions.create({
      model: settings.model,
      messages,
      temperature: settings.temperature,
      top_p: settings.topP,
      max_tokens: settings.maxTokens,
      enable_thinking: settings.enableThinking,
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
