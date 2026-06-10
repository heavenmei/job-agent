export const resumeStorageKey = "job-agent.resume.items";
export const pendingAnalyzeJobKey = "job-agent.pending-analyze-job";
export const llmSettingsStorageKey = "job-agent.llm.settings";

export const defaultLlmSettings = {
  provider: "dashscope",
  model: "qwen3.5-plus-2026-04-20",
  apiKey: "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  temperature: 0.2,
  topP: 0.8,
  maxTokens: 4096,
  enableThinking: false,
  timeout: 120,
};

export const llmProviderOptions = [
  { label: "DashScope", value: "dashscope" },
  { label: "OpenAI", value: "openai" },
  { label: "自定义兼容接口", value: "custom" },
];

export const llmModelOptions = [
  { label: "qwen3.5-plus-2026-04-20", value: "qwen3.5-plus-2026-04-20" },
  { label: "qwen-plus", value: "qwen-plus" },
  { label: "qwen-max", value: "qwen-max" },
  { label: "gpt-4.1", value: "gpt-4.1" },
  { label: "gpt-4.1-mini", value: "gpt-4.1-mini" },
];

export const sources = [
  { id: 1, name: "国资委央企招聘", type: "央国企" },
  { id: 2, name: "Boss直聘", type: "综合招聘" },
  { id: 3, name: "猎聘网", type: "中高端岗位" },
  { id: 4, name: "企业官网", type: "官方校招" },
  { id: 5, name: "微信公众号", type: "垂直渠道" },
  { id: 6, name: "国聘网", type: "国企招聘" },
];

export const jobs = [
  {
    id: 1,
    title: "前端开发工程师",
    company: "方舟人才科技",
    city: "杭州",
    degree: "本科",
    match: 94,
    source: "企业官网",
    salary: "18-28K",
  },
  {
    id: 2,
    title: "AI Agent 产品研发",
    company: "蓝港智能",
    city: "上海",
    degree: "本科",
    match: 91,
    source: "Boss直聘",
    salary: "20-35K",
  },
  {
    id: 3,
    title: "React 工程师",
    company: "云岚科技",
    city: "北京",
    degree: "硕士",
    match: 87,
    source: "猎聘网",
    salary: "22-32K",
  },
  {
    id: 4,
    title: "机械设备工程师",
    company: "中航装备",
    city: "武汉",
    degree: "本科",
    match: 83,
    source: "国资委央企招聘",
    salary: "12-18K",
  },
  {
    id: 5,
    title: "数据分析工程师",
    company: "星河数科",
    city: "深圳",
    degree: "本科",
    match: 89,
    source: "微信公众号",
    salary: "16-26K",
  },
];

export const filterOptions = {
  cities: ["全国", "杭州", "上海", "北京", "武汉", "深圳"],
  degrees: ["不限", "本科", "硕士"],
  cohorts: ["26届", "25届", "社招"],
};

export const roles = [
  "软件开发工程师",
  "数据分析师",
  "人工智能工程师",
  "云计算工程师",
  "网络工程师",
  "前端开发",
  "后端开发",
  "Java开发",
  "Python开发",
  "Android开发",
  "iOS开发",
  "游戏开发",
  "网络安全分析师",
  "测试工程师",
  "项目经理",
  "产品经理",
  "产品运营",
  "新媒体运营",
  "内容运营",
  "运营专员",
  "UI设计师",
  "平面设计师",
  "设计师",
  "财务",
  "会计",
  "人力资源专员",
  "法务专员",
  "投资顾问",
  "审计",
  "金融分析师",
  "市场分析师",
  "市场营销专员",
  "销售代表",
  "物流专员",
  "客服专员",
  "公共关系专员",
  "化学工程师",
  "生物技术研究员",
  "土木工程师",
  "建筑设计师",
  "环境科学家",
  "机械工程师",
  "工业工程师",
  "电气工程师",
  "硬件工程师",
];


export const categoryTabs = [
  { label: "机械专业", value: "mechanical" },
  { label: "不限专业岗", value: "broad" },
  { label: "央国企", value: "stateOwned" },
  { label: "机械工程师", value: "mechanicalEngineer" },
  { label: "工艺工程师", value: "processEngineer" },
  { label: "产品开发工程师", value: "productEngineer" },
  { label: "机械设备行业", value: "equipment" },
  { label: "汽车行业", value: "automotive" },
  { label: "航空航天与国防行业", value: "aerospace" },
];

export const filterRows = [
  { key: "cohort", label: "批次", values: ["26届"] },
  { key: "degree", label: "学历", values: ["本科可投", "只看本科"] },
  {
    key: "major",
    label: "专业",
    values: ["机械可投", "推荐机械", "明确要求机械", "修改"],
  },
  {
    key: "city",
    label: "城市",
    values: ["全国", "武汉", "上海", "深圳", "北京", "更多"],
  },
  { key: "match", label: "匹配度", values: ["不限", "高匹配"] },
  {
    key: "company",
    label: "公司",
    values: ["不限", "央国企", "大厂", "高信用", "高科技"],
  },
];

export const defaultFilters = {
  category: "mechanical",
  cohort: "26届",
  degree: "本科可投",
  major: "推荐机械",
  city: "全国",
  match: "不限",
  company: "不限",
  keyword: "",
};

export const sourceCards = [
  {
    id: "sasac",
    name: "国务院国资委",
    type: "国家发布",
    badge: "SASAC",
    color: "#d71920",
    logo: "/image/guozi_logo.png",
  },
  {
    id: "mohrss",
    name: "中国人社部",
    type: "国家发布",
    badge: "人社",
    color: "#d71920",
    logo: "/image/renshe_logo.png",
  },
  {
    id: "official",
    name: "企业官网",
    type: "官方发布",
    badge: "官网",
    color: "#4f46c8",
    logo: "/image/official_logo.png",
  },
  {
    id: "wechat",
    name: "微信公众号",
    type: "官方发布",
    badge: "微",
    color: "#07c160",
    logo: "/image/weixin_logo.png",
  },
  {
    id: "guopin",
    name: "国聘网",
    type: "求职平台",
    badge: "国聘",
    color: "#c8102e",
    logo: "/image/guopin_logo.png",
  },
  {
    id: "boss",
    name: "Boss直聘",
    type: "求职平台",
    badge: "BOSS",
    color: "#00b38a",
    logo: "/image/boss_logo.png",
  },
  {
    id: "job",
    name: "前程无忧",
    type: "求职平台",
    badge: "前程",
    color: "#f36f21",
    logo: "/image/51job_logo.png",
  },
  {
    id: "zhilian",
    name: "智联招聘",
    type: "求职平台",
    badge: "聘",
    color: "#1677ff",
    logo: "/image/zhilian_logo.png",
  },
  {
    id: "liepin",
    name: "猎聘网",
    type: "求职平台",
    badge: "猎聘",
    color: "#ff6b00",
    logo: "/image/liepin_logo.png",
  },
];

export const apiSourceIds = new Set(["official", "guopin", "boss", "zhilian"]);
