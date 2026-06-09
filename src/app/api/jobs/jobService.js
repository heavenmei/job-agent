import { readFileSync } from "node:fs";
import { callLLM as requestLlm } from "../_llm.js";

const jobs = JSON.parse(
  readFileSync(new URL("../../../data/jobs.json", import.meta.url), "utf8")
);

const sourceMeta = {
  zhilian: { name: "智联招聘", type: "求职平台", tone: "blue" },
  boss: { name: "Boss直聘", type: "求职平台", tone: "cyan" },
  official: { name: "企业官网", type: "官方发布", tone: "indigo" },
  guopin: { name: "国聘网", type: "求职平台", tone: "red" },
};

const categoryMatchers = {
  mechanical: /机械|自动化|电气|设备|工艺|设计|制造|汽车|航空|工程师/,
  broad: /.*/,
  stateOwned: /国企|央企/,
  mechanicalEngineer: /机械.*工程师|工程师.*机械|设备|自动化|电气/,
  processEngineer: /工艺|制造|生产|工业工程/,
  productEngineer: /产品|研发|设计/,
  equipment: /设备|机械|自动化/,
  automotive: /汽车|车辆|零部件/,
  aerospace: /航空|航天|国防|卫星/,
};

export async function listJobs(searchParams = new URLSearchParams()) {
  const params = normalizeParams(searchParams);
  const filtered = jobs
    .filter((job) => matchesCategory(job, params.category))
    .filter((job) => matchesCohort(job, params.cohort))
    .filter((job) => matchesDegree(job, params.degree))
    .filter((job) => matchesMajor(job, params.major))
    .filter((job) => matchesCity(job, params.city))
    .filter((job) => matchesMatch(job, params.match))
    .filter((job) => matchesCompany(job, params.company))
    .filter((job) => matchesSources(job, params.sources))
    .filter((job) => matchesKeyword(job, params.keyword))
    .sort((a, b) => b.matchDegree - a.matchDegree || b.qccScore - a.qccScore);
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;

  return {
    jobs: filtered.slice(start, end).map(toJobRow),
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
    sources: listSources(),
  };
}

export function listSources() {
  const counts = jobs.reduce((acc, job) => {
    acc[job.sourceType] = (acc[job.sourceType] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(sourceMeta).map(([id, meta]) => ({
    id,
    ...meta,
    count: counts[id] || 0,
  }));
}

export async function getJob(id) {
  const job = jobs.find((item) => item.id === id);
  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  return toJobDetail(job);
}

export async function analyzeResume() {
  return listJobs(
    new URLSearchParams({ category: "mechanical", match: "high" })
  );
}

export function optimizeGeneralResume(resume = "") {
  return {
    score: resume.trim() ? 86 : 72,
    checklist: ["补充量化成果", "突出项目角色", "压缩重复描述"],
    resume: `${
      resume || "请输入简历内容"
    }\n\n优化建议：突出项目结果、技术栈和可验证影响。`,
  };
}

export function optimizeTargetedResume({
  resume = "",
  role = "目标岗位",
} = {}) {
  return {
    resume: `${
      resume || "请输入简历内容"
    }\n\n专岗建议：围绕「${role}」补充关键词、业务场景和成果指标。`,
    match: {
      score: 88,
      verdict: "专岗优化完成",
      hits: ["岗位关键词覆盖良好", "项目经历可继续量化"],
      gaps: ["建议补充目标行业工具链"],
    },
  };
}

export async function callLlm(body = {}) {
  const content = await requestLlm({
    messages: body.messages || [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: body.prompt || "你是谁？" },
    ],
    model: body.model,
    temperature: body.temperature,
  });

  return { content };
}

function normalizeParams(searchParams) {
  const get = (key, fallback = "") => searchParams.get(key) || fallback;
  return {
    category: get("category", "mechanical"),
    cohort: get("cohort", "26届"),
    degree: get("degree", "本科可投"),
    major: get("major", "推荐机械"),
    city: get("city", "全国"),
    match: get("match", "不限"),
    company: get("company", "不限"),
    keyword: get("keyword", ""),
    sources: get("sources", "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    page: clampNumber(get("page", "1"), 1, 999),
    pageSize: clampNumber(get("pageSize", get("limit", "20")), 1, 100),
  };
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function haystack(job) {
  return [
    job.title,
    job.company,
    job.industry,
    job.degree,
    ...(job.major || []),
    ...(job.location || []),
    ...(job.companyTag || []),
    ...(job.matchTag || []),
  ].join(" ");
}

function matchesCategory(job, category) {
  if (!category || category === "broad") return true;
  if (category === "stateOwned") return job.companyTag?.includes("国企");
  return (categoryMatchers[category] || categoryMatchers.mechanical).test(
    haystack(job)
  );
}

function matchesCohort(job, cohort) {
  if (!cohort || cohort === "不限") return true;
  const year = Number(cohort.replace(/\D/g, ""));
  return Number.isNaN(year) || job.graduation?.includes(2000 + year);
}

function matchesDegree(job, degree) {
  if (!degree || degree === "不限") return true;
  if (degree === "本科可投") return ["本科", "大专"].includes(job.degree);
  if (degree === "只看本科") return job.degree === "本科";
  return job.degree === degree;
}

function matchesMajor(job, major) {
  if (!major || major === "不限" || major === "修改") return true;
  const text = haystack(job);
  if (major === "机械可投") return /机械|自动化|电气|设备|制造|工程/.test(text);
  if (major === "推荐机械")
    return /机械|自动化|电气|设备|产品|工艺|设计/.test(text);
  if (major === "明确要求机械") return job.major?.includes("机械");
  return text.includes(major);
}

function matchesCity(job, city) {
  if (!city || city === "全国" || city === "更多") return true;
  return job.location?.includes(city);
}

function matchesMatch(job, match) {
  if (!match || match === "不限") return true;
  return job.matchDegree >= 70;
}

function matchesCompany(job, company) {
  if (!company || company === "不限") return true;
  if (company === "央国企") return job.companyTag?.includes("国企");
  if (company === "大厂") return job.companyTag?.includes("大型");
  if (company === "高信用") return job.qccScore >= 800;
  if (company === "高科技")
    return /软件|IT|数据|信息|通信|科技/.test(job.industry);
  return job.companyTag?.includes(company);
}

function matchesSources(job, sources) {
  return !sources.length || sources.includes(job.sourceType);
}

function matchesKeyword(job, keyword) {
  return (
    !keyword || haystack(job).toLowerCase().includes(keyword.toLowerCase())
  );
}

function toJobRow(job) {
  return {
    id: job.id,
    update: formatDate(job.updateDate),
    tag: job.companyTag?.[0] || "普通",
    company: job.company,
    industry: job.industry,
    creditScore: job.qccScore,
    title: job.title,
    matchDegree: job.matchDegree,
    city: job.location?.join("、") || "全国",
    degree: job.degree,
    cohort: `${
      job.graduation?.[0] ? String(job.graduation[0]).slice(2) : "26"
    }届`,
    major: job.major?.length ? job.major.join("、") : "不限",
    sourceType: job.sourceType,
    sourceName: sourceMeta[job.sourceType]?.name || job.sourceType,
    publishedAt: formatFullDate(job.updateDate),
    isFavorite: job.isFavorite,
    isApplied: job.isApplied,
  };
}

function toJobDetail(job) {
  const row = toJobRow(job);
  const majors = job.major?.length ? job.major : ["专业不限"];
  const tags = [
    `信用分：${job.qccScore || "-"}`,
    ...(job.companyTag || []),
    job.industry,
    ...majors.slice(0, 4),
  ].filter(Boolean);

  return {
    ...row,
    tags,
    companyTags: job.companyTag || [],
    matchTags: job.matchTag || [],
    requirements: [
      `${job.graduation?.[0] || 2026}年高校应届毕业生，${
        job.degree
      }及以上学历。`,
      `所学专业为${majors.join("、")}等相关专业。`,
      `认同${job.company}企业文化，能忠实履职、踏实尽责，身体健康，心理素质良好。`,
      "善于沟通表达，富有团队意识和创新精神。",
    ],
    publishDate: formatFullDate(job.updateDate),
    direction: `${job.industry}方向`,
  };
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatFullDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
