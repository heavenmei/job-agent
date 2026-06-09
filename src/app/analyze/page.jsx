"use client";

import {
  CheckCircleFilled,
  RocketOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Input, Progress, Select, Tag, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import ResumeDisplay from "../components/ResumeDisplay";
import {
  getActiveResumeItem,
  persistResumeItems,
  readActiveResume,
  readResumeItems,
  updateResumeItem,
} from "../storage";
import "./page.css";

const dimensionColors = {
  skills: "#5f55d8",
  experience: "#23b8ad",
  education: "#1677ff",
  delivery: "#ff8a3d",
  growth: "#23c66b",
};

export default function AnalyzePage() {
  const [resumeText, setResumeText] = useState("");
  const [resumeItem, setResumeItem] = useState(null);
  const [jdText, setJdText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [selectedAnalysisKey, setSelectedAnalysisKey] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const resumeItems = readResumeItems();
      const activeResume = getActiveResumeItem(resumeItems);
      const latestEntry = getLatestAnalysisEntry(activeResume);

      setResumeText(readActiveResume());
      setResumeItem(activeResume);
      setSelectedAnalysisKey(latestEntry?.key || "");
      setJdText(latestEntry?.jd || "");
      setAnalysis(latestEntry?.analysis || null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const textStats = useMemo(
    () => ({
      resume: countReadableChars(resumeText),
      jd: countReadableChars(jdText),
    }),
    [jdText, resumeText]
  );

  async function runAnalysis() {
    if (!resumeText.trim()) {
      message.warning("请先选择或上传简历");
      return;
    }

    if (!jdText.trim()) {
      message.warning("请先填写岗位 JD");
      return;
    }

    setAnalysisLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resumeText,
          jd: jdText,
          resumeHighlight: resumeItem?.highlight || [],
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "岗位匹配分析失败");
      }

      const storedItems = readResumeItems();
      const activeResume =
        storedItems.find((item) => item.id === resumeItem?.id) ||
        getActiveResumeItem(storedItems);
      const analysisKey = createJdKey(jdText);
      const matchAnalysis = {
        ...(activeResume.matchAnalysis || {}),
        [analysisKey]: {
          key: analysisKey,
          title: createAnalysisTitle(jdText),
          jd: jdText,
          createdAt: new Date().toISOString(),
          analysis: data,
        },
      };
      const nextItems = updateResumeItem(storedItems, activeResume.id, {
        matchAnalysis,
      });
      const nextResumeItem =
        nextItems.find((item) => item.id === activeResume.id) ||
        getActiveResumeItem(nextItems);

      persistResumeItems(nextItems);
      setResumeItem(nextResumeItem);
      setSelectedAnalysisKey(analysisKey);
      setAnalysis(data);
      message.success("岗位匹配分析完成");
    } catch (error) {
      message.error(error.message || "岗位匹配分析失败");
    } finally {
      setAnalysisLoading(false);
    }
  }

  function syncResume(value) {
    setResumeText(value || "");
    setAnalysis(null);
    setSelectedAnalysisKey("");
  }

  function syncResumeItem(nextResumeItem) {
    const entry =
      getAnalysisEntryForJd(nextResumeItem, jdText) ||
      getLatestAnalysisEntry(nextResumeItem);

    setResumeItem(nextResumeItem || null);
    setSelectedAnalysisKey(entry?.key || "");
    if (entry?.jd) setJdText(entry.jd);
    setAnalysis(entry?.analysis || null);
  }

  function selectAnalysis(key) {
    const entry = getAnalysisEntries(resumeItem).find(
      (item) => item.key === key
    );

    setSelectedAnalysisKey(key);
    setAnalysis(entry?.analysis || null);
    if (entry?.jd) setJdText(entry.jd);
  }
  const analysisEntries = getAnalysisEntries(resumeItem);

  return (
    <AppShell>
      <div className="analyze-page h-full flex flex-col gap-2">
        <header className="analyze-header">
          <div className="flex gap-2">
            <h1>岗位匹配分析</h1>
            <p>把简历和岗位 JD 放在一起，快速看清匹配、缺口和补强方向。</p>
          </div>
          <Button
            icon={<ThunderboltOutlined />}
            loading={analysisLoading}
            onClick={runAnalysis}
            size="large"
            type="primary"
          >
            开始分析
          </Button>
        </header>

        <div className="flex-1 flex gap-6 h-11/12">
          <section className="w-1/3 flex flex-col overflow-hidden h-full gap-6 panel">
            <div className="flex-1 overflow-hidden">
              <ResumeDisplay
                titleNode={<h2>简历信息</h2>}
                mdClassName="p-2 bg-gray-200 rounded h-full"
                onResumeChange={syncResume}
                onResumeItemChange={syncResumeItem}
              />
            </div>
            <div className="flex flex-col gap-4">
              <header className="flex justify-between items-center">
                <h2>岗位 JD 描述</h2>
                {analysisEntries?.length > 1 ? (
                  <Select
                    value={selectedAnalysisKey}
                    onChange={selectAnalysis}
                    options={analysisEntries.map((item) => ({
                      label: item.title,
                      value: item.key,
                    }))}
                  />
                ) : null}
              </header>
              <Input.TextArea
         
                onChange={(event) => {
                  const value = event.target.value;
                  const entry = getAnalysisEntryForJd(resumeItem, value);

                  setJdText(value);
                  setSelectedAnalysisKey(entry?.key || "");
                  setAnalysis(entry?.analysis || null);
                }}
                placeholder="粘贴岗位职责、任职要求、加分项..."
                value={jdText}
                autoSize={{ minRows: 5, maxRows: 5 }}
              />
            </div>
          </section>
          <section className="flex-1 analyze-result-panel overflow-auto">
            {analysis ? (
              <AnalysisResult analysis={analysis} />
            ) : (
              <EmptyResult />
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyResult() {
  return (
    <div className="analyze-empty">
      <RocketOutlined />
      <h2>等待分析</h2>
      <p>点击左侧按钮后，这里会展示匹配度、ATS关键词、简历优缺点和改写建议。</p>
    </div>
  );
}

function AnalysisResult({ analysis }) {
  const dimensions = analysis.dimensions || [];
  const match = analysis.match || {};
  const ats = analysis.ats || {};

  return (
    <div className="analysis-result">
      <article className="score-card">
        <div>
          <span>岗位匹配度</span>
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
          {dimensions.map((item) => (
            <div className="radar-row" key={item.key}>
              <span>{item.label}</span>
              <i
                style={{
                  width: `${item.score}%`,
                  background: dimensionColors[item.key] || "#5f55d8",
                }}
              />
              <b>{item.score}</b>
            </div>
          ))}
        </div>
      </article>

      <section className="keyword-card">
        <h2>关键词命中 ATS</h2>
        <div className="ats-score-row">
          <span>ATS 命中分</span>
          <Progress percent={ats.score || 0} strokeColor="#23b8ad" />
        </div>
        <div className="keyword-groups">
          <div>
            <b>已命中</b>
            <div>
              {(ats.matched || []).map((keyword) => (
                <Tag color="green" key={keyword}>
                  {keyword}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <b>待补充</b>
            <div>
              {(ats.missing || []).map((keyword) => (
                <Tag color="orange" key={keyword}>
                  {keyword}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="insight-grid">
        <InsightCard
          title="简历自身优势"
          items={(analysis.resumeHighlights || [])
            .filter((item) => item.type !== "weakness")
            .map(formatHighlight)}
        />
        <InsightCard
          title="简历自身短板"
          items={(analysis.resumeHighlights || [])
            .filter((item) => item.type === "weakness")
            .map(formatHighlight)}
        />
        <InsightCard title="ATS优化建议" items={ats.suggestions || []} />
      </section>

      <section className="rewrite-card">
        <h2>优化改写建议</h2>
        <div className="rewrite-list">
          {(analysis.rewriteSuggestions || []).map((item, index) => (
            <article key={`${item.section}-${index}`}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{item.section}</b>
              </header>
              <div className="rewrite-compare">
                <div>
                  <strong>原表达</strong>
                  <p>{item.before}</p>
                </div>
                <div>
                  <strong>建议改写</strong>
                  <p>{item.after}</p>
                </div>
              </div>
              <footer>{item.reason}</footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function InsightCard({ title, items }) {
  return (
    <article className="insight-card">
      <h2>{title}</h2>
      <ul>
        {(items.length ? items : ["暂无明确结论"]).map((item) => (
          <li key={item}>
            <CheckCircleFilled />
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

function countReadableChars(value) {
  return String(value || "").replace(/\s/g, "").length;
}

function getAnalysisEntries(resumeItem) {
  const matchAnalysis = resumeItem?.matchAnalysis;
  if (!matchAnalysis || typeof matchAnalysis !== "object") return [];

  return Object.values(matchAnalysis)
    .filter((entry) => entry?.analysis)
    .sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
}

function getLatestAnalysisEntry(resumeItem) {
  return getAnalysisEntries(resumeItem)[0] || null;
}

function getAnalysisEntryForJd(resumeItem, jd) {
  if (!jd?.trim()) return null;
  const key = createJdKey(jd);
  return resumeItem?.matchAnalysis?.[key] || null;
}

function createJdKey(jd) {
  const text = String(jd || "").trim();
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return `jd-${hash.toString(36)}`;
}

function createAnalysisTitle(jd) {
  const text = String(jd || "")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 28) || "未命名岗位JD";
}
