"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  FileAddOutlined,
  RocketOutlined,
  MinusCircleFilled,
  InfoCircleFilled,
} from "@ant-design/icons";
import { Button, Checkbox, Progress } from "antd";
import { useEffect, useState } from "react";

const EMPTY_SUGGESTIONS = [];

const dimensionColors = {
  skills: "#5f55d8",
  experience: "#23b8ad",
  education: "#1677ff",
  delivery: "#ff8a3d",
  growth: "#23c66b",
};

export default function AnalysisResult({
  analysis,
  loading = false,
  onApplyRewriteSuggestions,
  rewriteApplying = false,
}) {
  const suggestions = analysis?.rewriteSuggestions || EMPTY_SUGGESTIONS;
  const [selectedIndexes, setSelectedIndexes] = useState([]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setSelectedIndexes(suggestions.map((_, index) => index));
    });

    return () => {
      cancelled = true;
    };
  }, [suggestions]);

  if (loading) {
    return <AnalysisLoadingState />;
  }

  if (!analysis) {
    return (
      <div className="analyze-empty">
        <RocketOutlined />
        <h2>等待分析</h2>
        <p>
          点击左侧按钮后，这里会展示匹配度、ATS关键词、简历优缺点和改写建议。
        </p>
      </div>
    );
  }

  const dimensions = analysis.dimensions || [];
  const match = analysis.match || {};
  const ats = analysis.ats || {};

  const selectedSuggestions = selectedIndexes
    .map((index) => suggestions[index])
    .filter(Boolean);

  return (
    <div className="analysis-result">
      <article className="score-card">
        <div>
          <h1>岗位匹配度</h1>
          <strong>{match.current || 0}%</strong>
          <p>{match.summary}</p>
          <div className="optimized-score">
            <b>建议优化后</b>
            <em>{match.optimized || 0}%</em>
          </div>
        </div>
        <Progress
          format={() => ""}
          percent={match.current || 0}
          size={132}
          strokeColor="#5f55d8"
          strokeWidth={10}
          type="circle"
        />
      </article>

      <div className="metric-grid">
        {dimensions.map((item) => (
          <article key={item.key}>
            <div className="metric-title">
              <b>{item.label}</b>
              <span>{item.score}%</span>
            </div>
            <Progress
              percent={item.score}
              showInfo={false}
              strokeColor={dimensionColors[item.key] || "#5f55d8"}
              railColor="#eef1f7"
            />
          </article>
        ))}
      </div>

      <section className="panel flex flex-col gap-4">
        <div className="keyword-card-header">
          <div>
            <h2>关键词命中 ATS</h2>
            <p className="text-muted">
              基于岗位 JD 提取关键词，并检查所选简历是否明确命中。
            </p>
          </div>
          <strong>{ats.score || 0}%</strong>
        </div>
        <KeywordGroups ats={ats} />

        <InsightCard
          title="ATS优化建议"
          items={ats.suggestions || []}
          icon={<InfoCircleFilled style={{ color: "#5f55d8" }} />}
        />
      </section>

      <section className="flex gap-2">
        <InsightCard
          title="简历自身优势"
          items={(analysis.resumeHighlights || [])
            .filter((item) => item.type !== "weakness")
            .map(formatHighlight)}
          icon={<CheckCircleFilled style={{ color: "#23c66b" }} />}
        />
        <InsightCard
          title="简历自身短板"
          items={(analysis.resumeHighlights || [])
            .filter((item) => item.type === "weakness")
            .map(formatHighlight)}
          icon={<MinusCircleFilled style={{ color: "#e9a23b" }} />}
        />
      </section>

      <section className="rewrite-card">
        <header className="rewrite-card-title">
          <div>
            <h2>优化改写建议</h2>
            <p>勾选要采纳的建议后，会生成或更新当前 JD 对应的优化简历。</p>
          </div>
          <div className="rewrite-card-actions">
            <Checkbox
              checked={
                selectedIndexes.length === suggestions.length &&
                suggestions.length > 0
              }
              indeterminate={
                selectedIndexes.length > 0 &&
                selectedIndexes.length < suggestions.length
              }
              onChange={(event) =>
                setSelectedIndexes(
                  event.target.checked
                    ? suggestions.map((_, index) => index)
                    : []
                )
              }
            >
              全选
            </Checkbox>
            <Button
              disabled={!selectedSuggestions.length}
              icon={<FileAddOutlined />}
              loading={rewriteApplying}
              onClick={() => onApplyRewriteSuggestions?.(selectedSuggestions)}
              type="primary"
            >
              应用选中建议
            </Button>
          </div>
        </header>
        <div className="rewrite-list">
          {suggestions.map((item, index) => (
            <article key={`${item.section}-${index}`}>
              <header>
                <div className="rewrite-item-head">
                  <Checkbox
                    checked={selectedIndexes.includes(index)}
                    onChange={(event) =>
                      setSelectedIndexes((current) =>
                        event.target.checked
                          ? [...current, index].sort((a, b) => a - b)
                          : current.filter((itemIndex) => itemIndex !== index)
                      )
                    }
                  />
                  <div className="flex w-8 h-8 rounded-full bg-primary text-white justify-center items-center">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <b>{item.section}</b>
                </div>
              </header>
              <div className="rewrite-compare">
                <div className="bg-surface p-2 rounded-xl border border-border">
                  <strong>原表达</strong>
                  <p>{item.before}</p>
                </div>
                <div className="bg-border p-2 rounded-xl">
                  <strong>建议改写</strong>
                  <p>{item.after}</p>
                </div>
              </div>
              <footer className="flex justify-between items-center gap-2">
                <span>{item.reason}</span>
                <Button
                  color="primary"
                  variant="outlined"
                  icon={<FileAddOutlined />}
                  loading={rewriteApplying}
                  onClick={() => onApplyRewriteSuggestions?.([item])}
                >
                  应用此建议
                </Button>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const ANALYSIS_LOADING_STEPS = [
  "简历技能分析",
  "关键词命中 ATS分析",
  "简历自身优势分析",
  "简历自身短板分析",
  "优化改写建议",
  "岗位匹配度",
];

function AnalysisLoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) =>
        current < ANALYSIS_LOADING_STEPS.length - 1 ? current + 1 : current
      );
    }, 1500);

    return () => window.clearInterval(timer);
  }, []);

  const percent = Math.round(((activeStep + 1) / ANALYSIS_LOADING_STEPS.length) * 100);

  return (
    <div className="analysis-loading">
      <header className="analysis-loading-header">
        <div>
          <h2>正在生成岗位分析</h2>
          <p>正在分阶段整理匹配度、ATS、优劣势和改写建议。</p>
        </div>
        <strong>{percent}%</strong>
      </header>

      <Progress percent={percent} showInfo={false} strokeColor="#5f55d8" />

      <div className="analysis-loading-steps">
        {ANALYSIS_LOADING_STEPS.map((step, index) => {
          const status =
            index < activeStep ? "done" : index === activeStep ? "active" : "pending";

          return (
            <article
              className={`analysis-loading-step ${status}`}
              key={step}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step}</h3>
                <p>
                  {status === "done"
                    ? "已完成"
                    : status === "active"
                      ? "正在处理中..."
                      : "等待执行"}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function KeywordGroups({ ats }) {
  const keywordGroups = normalizeKeywordGroupsForView(ats);

  return (
    <div className="flex gap-2">
      {keywordGroups.map(
        (group) =>
          group.keywords.length > 0 && (
            <section
              className="flex flex-1 flex-col panel bg-app-bg! p-4!"
              key={group.title}
            >
              <header className="flex text-muted-strong justify-between mb-2">
                <h3>{group.title}</h3>
                <span>
                  {group.keywords.filter((keyword) => keyword.matched).length}/
                  {group.keywords.length}
                </span>
              </header>
              <div className="keyword-chip-list">
                {group.keywords.map((keyword) => (
                  <span
                    className={
                      keyword.matched
                        ? "keyword-chip matched"
                        : "keyword-chip missing"
                    }
                    key={`${group.title}-${keyword.name}`}
                    title={keyword.evidence || keyword.name}
                  >
                    {keyword.matched ? (
                      <CheckCircleFilled />
                    ) : (
                      <CloseCircleFilled />
                    )}
                    {keyword.name}
                  </span>
                ))}
              </div>
            </section>
          )
      )}
    </div>
  );
}

function normalizeKeywordGroupsForView(ats) {
  const titles = ["硬性要求", "业务技能", "软素质"];
  const sourceGroups = Array.isArray(ats?.keywordGroups)
    ? ats.keywordGroups
    : [];
  const fallbackKeywords = [
    ...(ats?.matched || []).map((name) => ({
      name,
      matched: true,
      evidence: "简历中已体现",
    })),
    ...(ats?.missing || []).map((name) => ({
      name,
      matched: false,
      evidence: "简历中暂未明确体现",
    })),
  ];

  return titles.map((title, index) => {
    const group =
      sourceGroups.find((item) => item?.title === title) || sourceGroups[index];
    const keywords = Array.isArray(group?.keywords) ? group.keywords : [];

    return {
      title,
      keywords: keywords.length || index !== 1 ? keywords : fallbackKeywords,
    };
  });
}

function InsightCard({ title, items, icon }) {
  return (
    <article className="panel insight-card">
      <h3>{title}</h3>
      <ul className="flex flex-col mt-2 gap-2">
        {(items.length ? items : ["暂无明确结论"]).map((item) => (
          <li key={item} className="flex items-start gap-2 text-muted">
            <div className="relative">{icon}</div>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function formatHighlight(item) {
  return `${item.title}：${item.description}`;
}
