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
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "你是资深招聘顾问、ATS筛选专家和简历优化专家。你会严格基于简历和岗位JD分析匹配度、ATS关键词、简历优缺点与改写建议。必须只输出 JSON，不要输出 Markdown。",
        },
        {
          role: "user",
          content: `请基于简历、岗位JD和已有简历个人优化洞察，输出岗位匹配可视化分析数据。

输出 JSON 对象，必须符合以下结构：
{
  "match": {
    "current": 72,
    "optimized": 86,
    "summary": "一句话总结当前匹配度和优化方向"
  },
  "dimensions": [
    {"key":"skills","label":"硬技能","score":78},
    {"key":"experience","label":"项目经历","score":72},
    {"key":"education","label":"学历专业","score":82},
    {"key":"delivery","label":"交付协作","score":68},
    {"key":"growth","label":"成长潜力","score":75}
  ],
  "resumeHighlights": [
    {"type":"strength","title":"优势标题","description":"具体说明"},
    {"type":"weakness","title":"短板标题","description":"具体说明"}
  ],
  "ats": {
    "score": 76,
    "keywordGroups": [
      {
        "title": "硬性要求",
        "keywords": [
          {"name":"本科","matched":true,"evidence":"简历中的命中依据或缺失说明"}
        ]
      },
      {
        "title": "业务技能",
        "keywords": [
          {"name":"数据分析","matched":true,"evidence":"简历中的命中依据或缺失说明"}
        ]
      },
      {
        "title": "软素质",
        "keywords": [
          {"name":"沟通协作","matched":true,"evidence":"简历中的命中依据或缺失说明"}
        ]
      }
    ],
    "matched": ["兼容字段：已命中关键词"],
    "missing": ["兼容字段：未命中关键词"],
    "suggestions": ["ATS优化建议"]
  },
  "rewriteSuggestions": [
    {
      "section": "项目经历",
      "before": "原简历中的表达",
      "after": "建议改写后的表达",
      "reason": "修改理由"
    }
  ]
}

要求：
1. current 和 optimized 为 0-100 的整数，optimized 必须大于等于 current。
2. dimensions 正好 5 条，score 为 0-100 整数。
3. resumeHighlights 反映简历自身优缺点，并结合传入的 resumeItem.highlight；至少 2 条优势、2 条短板。
4. ats.keywordGroups 必须从岗位JD中提取关键词，并逐项判断简历是否命中；固定输出 3 组：硬性要求、业务技能、软素质，每组 4-8 个关键词。keyword.name 必须来自 JD 原文或从 JD 合理归纳，matched 必须依据简历内容判断，evidence 简短说明命中依据或缺失原因。
5. rewriteSuggestions 输出 3-5 条，before 必须尽量引用或概括简历里的原表达，after 要更贴近 JD，reason 要说明为什么提升匹配或ATS通过率。
6. 不要编造候选人不存在的经历、学历、公司或技能。

resumeItem.highlight：
${JSON.stringify(resumeHighlight || []).slice(0, 8000)}

简历：
${resume.slice(0, 24000)}

岗位JD：
${jd.slice(0, 16000)}`,
        },
      ],
    });

    return json(normalizeAnalysis(parseJsonContent(content)));
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
    throw new Error("岗位匹配分析结果格式异常");
  }
}

function normalizeAnalysis(data) {
  const current = clampScore(data?.match?.current);
  const optimized = Math.max(current, clampScore(data?.match?.optimized));

  return {
    match: {
      current,
      optimized,
      summary: String(data?.match?.summary || "已完成岗位匹配分析。").slice(
        0,
        160
      ),
    },
    dimensions: normalizeDimensions(data?.dimensions),
    resumeHighlights: normalizeHighlights(data?.resumeHighlights),
    ats: {
      score: clampScore(data?.ats?.score),
      keywordGroups: normalizeKeywordGroups(data?.ats),
      matched: normalizeStringList(data?.ats?.matched, 10),
      missing: normalizeStringList(data?.ats?.missing, 10),
      suggestions: normalizeStringList(data?.ats?.suggestions, 5),
    },
    rewriteSuggestions: normalizeRewriteSuggestions(data?.rewriteSuggestions),
  };
}

function normalizeDimensions(dimensions) {
  const fallback = [
    ["skills", "硬技能"],
    ["experience", "项目经历"],
    ["education", "学历专业"],
    ["delivery", "交付协作"],
    ["growth", "成长潜力"],
  ];

  return fallback.map(([key, label], index) => {
    const item = Array.isArray(dimensions)
      ? dimensions.find((dimension) => dimension.key === key) ||
        dimensions[index]
      : null;

    return {
      key,
      label: String(item?.label || label).slice(0, 12),
      score: clampScore(item?.score),
    };
  });
}

function normalizeHighlights(highlights) {
  return normalizeArray(highlights, 6).map((item, index) => ({
    type: item?.type === "weakness" ? "weakness" : "strength",
    title: String(item?.title || (index < 2 ? "简历优势" : "优化短板")).slice(
      0,
      18
    ),
    description: String(item?.description || "").slice(0, 120),
  }));
}

function normalizeKeywordGroups(ats) {
  const titles = ["硬性要求", "业务技能", "软素质"];
  const sourceGroups = Array.isArray(ats?.keywordGroups)
    ? ats.keywordGroups
    : [];
  const fallbackKeywords = [
    ...normalizeStringList(ats?.matched, 10).map((name) => ({
      name,
      matched: true,
      evidence: "简历中已体现",
    })),
    ...normalizeStringList(ats?.missing, 10).map((name) => ({
      name,
      matched: false,
      evidence: "简历中暂未明确体现",
    })),
  ];

  return titles.map((title, groupIndex) => {
    const group =
      sourceGroups.find((item) => item?.title === title) ||
      sourceGroups[groupIndex];
    const keywords = normalizeArray(group?.keywords, 10)
      .map((keyword) => ({
        name: String(keyword?.name || keyword || "").trim().slice(0, 24),
        matched: Boolean(keyword?.matched),
        evidence: String(keyword?.evidence || "").trim().slice(0, 80),
      }))
      .filter((keyword) => keyword.name);

    return {
      title,
      keywords:
        keywords.length || groupIndex !== 1
          ? keywords
          : fallbackKeywords.slice(0, 10),
    };
  });
}

function normalizeRewriteSuggestions(suggestions) {
  return normalizeArray(suggestions, 5).map((item) => ({
    section: String(item?.section || "简历内容").slice(0, 18),
    before: String(item?.before || "").slice(0, 180),
    after: String(item?.after || "").slice(0, 220),
    reason: String(item?.reason || "").slice(0, 160),
  }));
}

function normalizeStringList(value, max) {
  return normalizeArray(value, max)
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, max);
}

function normalizeArray(value, max) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function clampScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.min(Math.max(Math.round(score), 0), 100);
}
