import { callLLM } from "../../_llm.js";
import { errorJson, json, readJson } from "../../_response.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { resume, llmSettings } = await readJson(request);

    if (!resume || typeof resume !== "string" || !resume.trim()) {
      const error = new Error("请提供简历内容");
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
            "你是资深求职顾问和简历优化专家。你会基于简历内容，识别候选人的核心优势、适合的求职路径、当前短板和下一步优化建议。必须只输出 JSON，不要输出 Markdown。",
        },
        {
          role: "user",
          content: `请分析下面这份简历，输出 4 条适合前端卡片展示的个人优化洞察，并给出适合岗位搜索页面使用的岗位分类。要求：
1. 输出 JSON 对象，格式为 {"highlights":[{"number":"01","title":"...","description":"...","featured":false}],"jobCategories":[{"label":"...","keywords":["..."]}]}。
2. highlights 必须正好 4 条，number 从 01 到 04。
3. title 控制在 14 个中文字符以内。
4. description 控制在 70 个中文字符以内，要具体、可执行，避免空泛夸奖。
5. 只允许其中 1 条 featured 为 true，用来表示最推荐的优化方向。
6. jobCategories 输出 3-5 条，适合做岗位搜索 tab，例如“不限专业岗”“计算机专业”“工商管理”“国企”等。
7. 每个 jobCategories.keywords 输出 3-6 个筛岗位关键词，尽量来自专业、岗位方向、行业、企业类型或技能主题。
8. 不要编造简历不存在的经历或技能。

简历内容：
${resume.slice(0, 24000)}`,
        },
      ],
    });

    const parsed = parseJsonContent(content);
    const highlights = normalizeHighlights(parsed.highlights);
    const jobCategories = normalizeJobCategories(parsed.jobCategories);

    return json({ highlights, jobCategories });
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
    throw new Error("简历分析结果格式异常");
  }
}

function normalizeHighlights(highlights) {
  if (!Array.isArray(highlights) || highlights.length === 0) {
    throw new Error("简历分析结果为空");
  }

  const normalized = highlights.slice(0, 4).map((item, index) => ({
    number: item.number || String(index + 1).padStart(2, "0"),
    title: String(item.title || "优化建议").slice(0, 18),
    description: String(item.description || "").slice(0, 90),
    featured: Boolean(item.featured),
  }));

  if (!normalized.some((item) => item.featured)) {
    normalized[0].featured = true;
  }

  return normalized;
}

function normalizeJobCategories(jobCategories) {
  if (!Array.isArray(jobCategories) || jobCategories.length === 0) {
    return [
      {
        label: "不限专业岗",
        value: "custom-1",
        keywords: ["专业不限", "管培生", "运营", "助理"],
      },
    ];
  }

  return jobCategories.slice(0, 5).map((item, index) => ({
    label: String(item?.label || `岗位分类 ${index + 1}`).slice(0, 18),
    value: `custom-${index + 1}`,
    keywords: normalizeCategoryKeywords(
      Array.isArray(item?.keywords)
        ? item.keywords
            .map((keyword) => String(keyword || "").trim().slice(0, 20))
            .filter(Boolean)
            .slice(0, 6)
        : [],
      String(item?.label || `岗位分类 ${index + 1}`).slice(0, 18)
    ),
  }));
}

function normalizeCategoryKeywords(keywords, fallback) {
  return keywords.length ? keywords : [fallback];
}
