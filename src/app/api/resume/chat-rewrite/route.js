import { callLLM } from "../../_llm.js";
import { errorJson, json, readJson } from "../../_response.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { history, instruction, llmSettings, resume, role } =
      await readJson(request);

    if (!resume || typeof resume !== "string" || !resume.trim()) {
      const error = new Error("请先提供简历内容");
      error.status = 400;
      throw error;
    }

    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      const error = new Error("请先输入修改要求");
      error.status = 400;
      throw error;
    }

    const content = await callLLM({
      llmSettings,
      temperature: llmSettings?.temperature ?? 0.2,
      messages: [
        {
          role: "system",
          content:
            "你是资深简历顾问。你要根据用户的对话要求改写完整简历 Markdown。必须保留事实真实性，不能编造不存在的经历、公司、学校、奖项、技能和量化结果。输出必须是 JSON，不要输出 Markdown 代码块。",
        },
        {
          role: "user",
          content: `请根据当前简历和对话要求，输出一个适合继续编辑和投递的新简历版本。

输出 JSON 对象，格式必须为：
{
  "summary": "一句话说明你做了什么修改",
  "title": "建议的简历标题",
  "version": "建议的版本名",
  "resume": "完整 Markdown 简历"
}

要求：
1. 必须输出完整简历，不允许只返回片段。
2. 允许调整结构、措辞、重点顺序和标题，但不能编造事实。
3. 如果用户要求不清晰，优先做最保守的专业化改写。
4. summary 控制在 80 字以内，title 控制在 24 字以内，version 控制在 18 字以内。
5. 如果目标岗位有信息，优先让简历更贴近该岗位。

目标岗位：
${String(role || "未填写").slice(0, 120)}

最近对话：
${JSON.stringify(normalizeHistory(history)).slice(0, 4000)}

本次修改要求：
${instruction.slice(0, 3000)}

当前简历：
${resume.slice(0, 24000)}`,
        },
      ],
    });

    return json(normalizeResult(parseJsonContent(content)));
  } catch (error) {
    return errorJson(error);
  }
}

function parseJsonContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = String(content || "").match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("简历魔改结果格式异常");
  }
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history.slice(-6).map((item) => ({
    role: item?.role === "assistant" ? "assistant" : "user",
    content: String(item?.content || "").slice(0, 300),
  }));
}

function normalizeResult(data) {
  const resume = String(data?.resume || "").trim();

  if (!resume) {
    throw new Error("简历魔改结果为空");
  }

  return {
    summary: String(data?.summary || "已根据你的要求完成本轮简历改写。").slice(
      0,
      80
    ),
    title: String(data?.title || "AI魔改简历").slice(0, 24),
    version: String(data?.version || "AI魔改版").slice(0, 18),
    resume,
  };
}
