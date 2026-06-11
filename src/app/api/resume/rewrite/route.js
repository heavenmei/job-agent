import { callLLM } from "../../_llm.js";
import { errorJson, json, readJson } from "../../_response.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { jd, resume, suggestions, llmSettings } = await readJson(request);

    if (!resume || typeof resume !== "string" || !resume.trim()) {
      const error = new Error("请提供原始简历内容");
      error.status = 400;
      throw error;
    }

    if (!jd || typeof jd !== "string" || !jd.trim()) {
      const error = new Error("请提供岗位 JD");
      error.status = 400;
      throw error;
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      const error = new Error("请至少提供一条改写建议");
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
            "你是资深简历优化专家。你会基于原始简历、岗位JD和指定改写建议，输出一份完整的优化后简历 Markdown。必须只输出 JSON，不要输出 Markdown 代码块。",
        },
        {
          role: "user",
          content: `请根据以下信息改写完整简历。

输出 JSON 对象，格式必须为：
{
  "resume": "完整的 Markdown 简历内容"
}

要求：
1. 必须输出完整简历，而不是片段。
2. 必须严格围绕给定 suggestions 应用改写，优先处理其中提到的 section。
3. 保留候选人原有真实经历，不要编造不存在的公司、项目、学历、技能和数字成果。
4. 允许重写措辞、补齐上下文、强化关键词命中，但不能虚构事实。
5. 输出内容保持清晰的 Markdown 结构，适合继续人工编辑。

岗位 JD：
${jd.slice(0, 16000)}

原始简历：
${resume.slice(0, 24000)}

指定改写建议：
${JSON.stringify(suggestions).slice(0, 12000)}`,
        },
      ],
    });

    return json({ resume: normalizeResume(parseJsonContent(content)?.resume) });
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
    throw new Error("简历改写结果格式异常");
  }
}

function normalizeResume(value) {
  const resume = String(value || "").trim();
  if (!resume) throw new Error("简历改写结果为空");
  return resume;
}
