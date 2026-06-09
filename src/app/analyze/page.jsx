"use client";

import {
  CheckCircleFilled,
  RocketOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Input, Progress, Tag } from "antd";
import { useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import ResumeDisplay from "../components/ResumeDisplay";
import { readActiveResume } from "../storage";
import "./page.css";

const dimensionConfig = [
  {
    key: "skills",
    label: "硬技能",
    resumeWords: ["solidworks", "autocad", "cad", "有限元", "excel", "建模"],
    jdWords: ["solidworks", "autocad", "cad", "图纸", "结构设计", "设备设计"],
  },
  {
    key: "experience",
    label: "项目经历",
    resumeWords: ["项目", "产线", "装配", "样机", "验证", "改造", "设备"],
    jdWords: ["设备", "装配", "调试", "试产", "问题闭环", "供应商", "方案评审"],
  },
  {
    key: "education",
    label: "学历专业",
    resumeWords: ["本科", "硕士", "机械", "自动化", "机电"],
    jdWords: ["本科", "机械", "自动化", "机电一体化"],
  },
  {
    key: "delivery",
    label: "交付协作",
    resumeWords: ["沟通", "协作", "跨部门", "推进", "质量", "生产", "采购"],
    jdWords: ["沟通", "协同", "质量", "生产", "项目推进", "供应商"],
  },
  {
    key: "growth",
    label: "成长潜力",
    resumeWords: ["学习", "分析", "改善", "优化", "闭环", "数据"],
    jdWords: ["优化", "分析", "稳定性", "效率", "问题闭环"],
  },
];

const jdKeywords = [
  "SolidWorks",
  "AutoCAD",
  "结构设计",
  "设备",
  "装配",
  "调试",
  "供应商",
  "本科",
  "机械",
  "质量",
  "生产",
  "项目推进",
  "问题闭环",
  "优化",
];

export default function AnalyzePage() {
  const [resumeText, setResumeText] = useState(() => readActiveResume());
  const [jdText, setJdText] = useState();
  const [analysis, setAnalysis] = useState(null);

  const textStats = useMemo(
    () => ({
      resume: countReadableChars(resumeText),
      jd: countReadableChars(jdText),
    }),
    [jdText, resumeText]
  );

  function runAnalysis() {
    setAnalysis(createAnalysis(resumeText, jdText));
  }

  return (
    <AppShell>
      <div className="analyze-page h-full">
        <section className="flex flex-col overflow-hidden h-full gap-6 panel">
          <header className="analyze-header">
            <div>
              <h1>岗位匹配分析</h1>
              <p>把简历和岗位 JD 放在一起，快速看清匹配、缺口和补强方向。</p>
            </div>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={runAnalysis}
              size="large"
              type="primary"
            >
              开始分析
            </Button>
          </header>

          <div className="max-h-1/2 overflow-hidden">
            <ResumeDisplay
              titleNode={<h2>简历信息</h2>}
              mdClassName="p-2 bg-gray-200 rounded h-full"
            />
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <header className="flex justify-between items-center">
              <h2>岗位 JD 描述</h2>
              <span>{textStats.jd} 字</span>
            </header>
            <Input.TextArea
              className="flex-1"
              onChange={(event) => setJdText(event.target.value)}
              placeholder="粘贴岗位职责、任职要求、加分项..."
              value={jdText}
            />
          </div>
        </section>

        <section className="analyze-result-panel">
          {analysis ? <AnalysisResult analysis={analysis} /> : <EmptyResult />}
        </section>
      </div>
    </AppShell>
  );
}

function EmptyResult() {
  return (
    <div className="analyze-empty">
      <RocketOutlined />
      <h2>等待分析</h2>
      <p>
        点击左侧按钮后，这里会展示总匹配度、维度可视化、命中关键词和优化建议。
      </p>
    </div>
  );
}

function AnalysisResult({ analysis }) {
  return (
    <div className="analysis-result">
      <article className="score-card">
        <div>
          <span>综合匹配度</span>
          <strong>{analysis.total}%</strong>
          <p>{analysis.summary}</p>
        </div>
        <Progress
          format={() => ""}
          percent={analysis.total}
          size={132}
          strokeColor="#5f55d8"
          strokeWidth={10}
          type="circle"
        />
      </article>

      <div className="metric-grid">
        {analysis.dimensions.map((item) => (
          <article key={item.key}>
            <div className="metric-title">
              <b>{item.label}</b>
              <span>{item.score}%</span>
            </div>
            <Progress
              percent={item.score}
              showInfo={false}
              strokeColor={item.color}
              trailColor="#eef1f7"
            />
          </article>
        ))}
      </div>

      <article className="radar-card">
        <header>
          <h2>能力覆盖图</h2>
          <span>越靠右说明该维度越贴近 JD</span>
        </header>
        <div className="radar-lines">
          {analysis.dimensions.map((item) => (
            <div className="radar-row" key={item.key}>
              <span>{item.label}</span>
              <i style={{ width: `${item.score}%`, background: item.color }} />
              <b>{item.score}</b>
            </div>
          ))}
        </div>
      </article>

      <section className="keyword-card">
        <h2>关键词命中</h2>
        <div className="keyword-groups">
          <div>
            <b>已命中</b>
            <div>
              {analysis.matchedKeywords.map((keyword) => (
                <Tag color="green" key={keyword}>
                  {keyword}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <b>待补充</b>
            <div>
              {analysis.missingKeywords.map((keyword) => (
                <Tag color="orange" key={keyword}>
                  {keyword}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="insight-grid">
        <InsightCard title="匹配优势" items={analysis.strengths} />
        <InsightCard title="风险缺口" items={analysis.risks} />
        <InsightCard title="简历补强建议" items={analysis.actions} />
      </section>
    </div>
  );
}

function InsightCard({ title, items }) {
  return (
    <article className="insight-card">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <CheckCircleFilled />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function createAnalysis(resumeText, jdText) {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jdText);
  const densityBoost = Math.min(countReadableChars(resumeText) / 900, 1) * 8;

  const dimensions = dimensionConfig.map((dimension, index) => {
    const jdHits = countHits(jd, dimension.jdWords);
    const resumeHits = countHits(resume, dimension.resumeWords);
    const sharedHits = countHits(resume, dimension.jdWords);
    const score = clamp(
      Math.round(
        42 + jdHits * 5 + resumeHits * 6 + sharedHits * 9 + densityBoost
      ),
      38,
      96
    );

    return {
      ...dimension,
      color: ["#5f55d8", "#23b8ad", "#1677ff", "#ff8a3d", "#23c66b"][index],
      score,
    };
  });

  const matchedKeywords = jdKeywords.filter((keyword) =>
    resume.includes(keyword.toLowerCase())
  );
  const missingKeywords = jdKeywords
    .filter((keyword) => !resume.includes(keyword.toLowerCase()))
    .slice(0, 8);
  const total = clamp(
    Math.round(
      dimensions.reduce((sum, item) => sum + item.score, 0) /
        dimensions.length +
        matchedKeywords.length * 1.5 -
        missingKeywords.length * 0.8
    ),
    45,
    97
  );

  return {
    total,
    dimensions,
    matchedKeywords: matchedKeywords.length
      ? matchedKeywords
      : ["专业背景", "项目经历"],
    missingKeywords,
    summary:
      total >= 85
        ? "候选人与岗位要求高度贴合，可以优先投递，并围绕核心成果做定向强化。"
        : total >= 70
        ? "整体匹配良好，建议补足 JD 中反复出现的技能和业务场景。"
        : "存在明显缺口，建议先补充关键经历表达，再考虑投递优先级。",
    strengths: buildStrengths(dimensions, matchedKeywords),
    risks: buildRisks(missingKeywords),
    actions: buildActions(missingKeywords),
  };
}

function buildStrengths(dimensions, matchedKeywords) {
  const top = [...dimensions].sort((a, b) => b.score - a.score).slice(0, 2);
  return [
    `${top[0].label}表现突出，已覆盖岗位核心要求`,
    `${top[1].label}有可迁移经历，适合放在简历前半部分`,
    matchedKeywords.length
      ? `命中 ${matchedKeywords.slice(0, 4).join("、")} 等关键词`
      : "简历结构完整，可继续补充量化结果",
  ];
}

function buildRisks(missingKeywords) {
  if (!missingKeywords.length) {
    return [
      "未发现明显关键词缺口",
      "仍建议补充项目指标，增强可信度",
      "面试中准备 1-2 个完整项目复盘",
    ];
  }

  return [
    `${missingKeywords.slice(0, 3).join("、")} 在简历中不够明显`,
    "项目影响力和量化结果需要进一步突出",
    "JD 中的协作对象和交付闭环可再具体一些",
  ];
}

function buildActions(missingKeywords) {
  const keywords = missingKeywords.slice(0, 4).join("、") || "岗位核心关键词";

  return [
    `在项目经历中补入 ${keywords} 的真实使用场景`,
    "把职责描述改成“动作 + 方法 + 结果”的句式",
    "为最相关项目补充指标，如效率、周期、良率或成本变化",
  ];
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function countHits(text, words) {
  return words.reduce(
    (count, word) => count + (text.includes(word.toLowerCase()) ? 1 : 0),
    0
  );
}

function countReadableChars(value) {
  return String(value || "").replace(/\s/g, "").length;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
