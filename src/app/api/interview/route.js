import { callLLM } from "../_llm.js";
import { errorJson, json, readJson } from "../_response.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { jd, resume, resumeHighlight } = await readJson(request);

    if (!resume || typeof resume !== "string" || !resume.trim()) {
      const error = new Error("请先选择或上传简历");
      error.status = 400;
      throw error;
    }

    if (!jd || typeof jd !== "string" || !jd.trim()) {
      const error = new Error("请先填写岗位 JD");
      error.status = 400;
      throw error;
    }

    const content = await callLLM({
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "你是资深面试官、求职辅导顾问和招聘经理。你会严格基于候选人简历与岗位JD生成高相关度的面试问题、参考回答和准备建议。必须只输出 JSON，不要输出 Markdown。",
        },
        {
          role: "user",
          content: `请基于简历、岗位JD和候选人的已有亮点洞察，生成结构化的面试素材库。

输出 JSON 对象，必须符合以下结构：
{
  "overview": {
    "title": "一句话概括本次面试准备重点",
    "summary": "2-3 句话说明候选人的机会点、风险点和准备方向"
  },
  "materials": [
    {
      "question": "面试官可能会问的问题",
      "answer": "候选人的参考回答，必须紧扣简历信息，允许给出组织答案的方式，但不能虚构经历",
      "suggestion": "面试前准备建议，例如要补充的数据、案例、表达方式或高频追问提醒",
      "focus": "可选，标签，如项目经历/动机/技能匹配"
    }
  ]
}

要求：
1. materials 输出 6-10 条，优先覆盖自我介绍、项目经历、岗位匹配、行为面试、技能深挖、职业动机等不同类型。
2. question 必须像真实面试官提问，不能过于抽象。
3. answer 必须严格基于简历已有信息组织，不得编造没有出现过的项目、业绩、奖项、技术栈、学历或公司经历；如果信息不足，可以明确提示候选人应如何据实补充。
4. suggestion 必须具体，帮助候选人临场准备，不要写空泛鸡汤。
5. overview.title 限 28 字以内，overview.summary 限 180 字以内。
6. 每条素材的 question、answer、suggestion 都要有内容。

候选人亮点洞察：
${JSON.stringify(resumeHighlight || []).slice(0, 8000)}

简历：
${resume.slice(0, 24000)}

岗位JD：
${jd.slice(0, 16000)}`,
        },
      ],
    });

    return json(normalizeInterviewMaterials(parseJsonContent(content)));
  } catch (error) {
    return errorJson(error);
  }
}

function parseJsonContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("面试素材结果格式异常");
  }
}

function normalizeInterviewMaterials(data) {
  return {
    overview: {
      title: String(data?.overview?.title || "面试准备重点").slice(0, 28),
      summary: String(
        data?.overview?.summary || "已生成与岗位相关的面试问题、回答参考和准备建议。"
      ).slice(0, 180),
    },
    materials: normalizeMaterials(data?.materials),
  };
}

function normalizeMaterials(materials) {
  return normalizeArray(materials, 10).map((item, index) => ({
    question: String(item?.question || `面试问题 ${index + 1}`).slice(0, 120),
    answer: String(item?.answer || "").slice(0, 500),
    suggestion: String(item?.suggestion || "").slice(0, 220),
    focus: String(item?.focus || "").slice(0, 24),
  }));
}

function normalizeArray(value, max) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}
