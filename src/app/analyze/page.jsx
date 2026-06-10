"use client";

import { RocketOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Input, Select, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AnalysisResult from "./AnalysisResult";
import { AppShell } from "../components/AppShell";
import { pendingAnalyzeJobKey } from "../config";
import {
  createResumeItem,
  createInitialResumeItems,
  getActiveResumeItem,
  persistResumeItems,
  readActiveResume,
  readResumeItems,
  setActiveResumeItem,
  updateResumeItem,
} from "../storage";
import { readStorage, writeStorage } from "../util";
import "./page.css";

export default function AnalyzePage() {
  const router = useRouter();
  const [resumeItems, setResumeItems] = useState(createInitialResumeItems);
  const [resumeText, setResumeText] = useState("");
  const [resumeItem, setResumeItem] = useState(null);
  const [jdText, setJdText] = useState("");
  const [targetForm, setTargetForm] = useState({
    company: "",
    jobTitle: "",
    jd: "",
  });
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
      const pendingJob = readPendingAnalyzeJob();
      const pendingEntry = pendingJob?.jd
        ? getAnalysisEntryForJd(activeResume, pendingJob.jd)
        : null;
      const initialJd = pendingJob?.jd || latestEntry?.jd || "";

      setResumeItems(resumeItems);
      setResumeText(readActiveResume());
      setResumeItem(activeResume);
      setSelectedAnalysisKey(pendingEntry?.key || latestEntry?.key || "");
      setJdText(initialJd);
      setTargetForm({
        company: pendingJob?.company || "",
        jobTitle: pendingJob?.title || "",
        jd: initialJd,
      });
      setAnalysis(
        pendingEntry?.analysis ||
          (pendingJob ? null : latestEntry?.analysis) ||
          null
      );
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

  function selectResume(resumeId) {
    const nextItems = setActiveResumeItem(resumeItems, resumeId);
    const nextResumeItem =
      nextItems.find((item) => item.id === resumeId) ||
      getActiveResumeItem(nextItems);
    const entry =
      getAnalysisEntryForJd(nextResumeItem, jdText) ||
      getLatestAnalysisEntry(nextResumeItem);
    const nextJd = getAnalysisEntryForJd(nextResumeItem, jdText)
      ? jdText
      : entry?.jd || jdText;

    setResumeItems(nextItems);
    persistResumeItems(nextItems);
    setResumeText(nextResumeItem?.resume || "");
    setResumeItem(nextResumeItem || null);
    setSelectedAnalysisKey(entry?.key || "");
    setAnalysis(entry?.analysis || null);
    setJdText(nextJd);
    setTargetForm((current) => ({ ...current, jd: nextJd }));
  }

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

  function selectAnalysis(key) {
    const entry = getAnalysisEntries(resumeItem).find(
      (item) => item.key === key
    );

    setSelectedAnalysisKey(key);
    setAnalysis(entry?.analysis || null);
    if (entry?.jd) {
      setJdText(entry.jd);
      setTargetForm((current) => ({ ...current, jd: entry.jd }));
    }
  }

  function updateTargetField(key, value) {
    setTargetForm((current) => ({ ...current, [key]: value }));

    if (key !== "jd") return;

    const entry = getAnalysisEntryForJd(resumeItem, value);

    setJdText(value);
    setSelectedAnalysisKey(entry?.key || "");
    setAnalysis(entry?.analysis || null);
  }

  function applyRewriteSuggestions(suggestions) {
    if (!resumeText.trim()) {
      message.warning("请先选择或上传简历");
      return;
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      message.warning("暂无可应用的改写建议");
      return;
    }

    const nextResume = applySuggestionsToResume(resumeText, suggestions);
    const sourceTitle = resumeItem?.title || resumeItem?.version || "简历";
    const nextItem = createResumeItem(resumeItems.length + 1, nextResume, {
      title: `${sourceTitle} - 岗位优化版`,
      version: "岗位匹配优化",
      role: targetForm.jobTitle || resumeItem?.role || "",
      highlight: resumeItem?.highlight || [],
      matchAnalysis: resumeItem?.matchAnalysis || {},
      active: true,
    });
    const nextItems = setActiveResumeItem(
      [nextItem, ...resumeItems],
      nextItem.id
    );

    setResumeItems(nextItems);
    setResumeItem(nextItem);
    setResumeText(nextResume);
    persistResumeItems(nextItems);
    message.success("已创建新的优化简历");
    router.push("/resume");
  }

  const analysisEntries = getAnalysisEntries(resumeItem);

  return (
    <AppShell>
      <div className="analyze-page h-full flex flex-col gap-4 overflow-hidden">
        <header className="flex gap-4 items-center">
          <h1>岗位匹配分析</h1>
          <p className="text-gray-500">
            把简历和岗位 JD 放在一起，快速看清匹配、缺口和补强方向。
          </p>
        </header>

        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="analyze-left-panel">
            <div className="analyze-resume-picker">
              <h2>选择简历</h2>
              <Select
                value={resumeItem?.id}
                onChange={selectResume}
                options={resumeItems.map((item) => ({
                  label: item.title || item.version || "未命名简历",
                  value: item.id,
                }))}
              />
            </div>

            <TargetedEditor
              analysisEntries={analysisEntries}
              onSelectAnalysis={selectAnalysis}
              onUpdateField={updateTargetField}
              selectedAnalysisKey={selectedAnalysisKey}
              targetForm={targetForm}
              textStats={textStats}
            />

            <Button
              block
              icon={<ThunderboltOutlined />}
              loading={analysisLoading}
              onClick={runAnalysis}
              size="large"
              type="primary"
            >
              开始分析
            </Button>
          </section>

          <section className="min-h-0 overflow-auto analyze-result-panel">
            <AnalysisResult
              analysis={analysis}
              onApplyRewriteSuggestions={applyRewriteSuggestions}
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function TargetedEditor({
  analysisEntries,
  onSelectAnalysis,
  onUpdateField,
  selectedAnalysisKey,
  targetForm,
  textStats,
}) {
  return (
    <div className="analyze-target-editor">
      <h2>针对岗位分析匹配度</h2>

      <div className="target-input-grid">
        <div>
          目标公司
          <Input
            size="medium"
            onChange={(event) => onUpdateField("company", event.target.value)}
            placeholder="请输入公司名"
            value={targetForm.company}
          />
        </div>
        <div>
          目标岗位
          <Input
            onChange={(event) => onUpdateField("jobTitle", event.target.value)}
            placeholder="请输入岗位名"
            value={targetForm.jobTitle}
          />
        </div>
      </div>

      <label className="analyze-jd-field">
        <span className="flex justify-between">
          <span>岗位 JD</span>
          <span className="text-gray-400">{textStats.jd} 字</span>
        </span>
        <Input.TextArea
          onChange={(event) => onUpdateField("jd", event.target.value)}
          placeholder="请粘贴岗位职责、任职要求、加分项，越完整分析效果越好"
          value={targetForm.jd}
        />
      </label>

      <div className="analyze-history-select">
        <header>
          <h2>历史分析</h2>
          <small>选择后会填充对应 JD</small>
        </header>
        {analysisEntries?.length > 1 ? (
          <Select
            value={selectedAnalysisKey}
            onChange={onSelectAnalysis}
            options={analysisEntries.map((item) => ({
              label: item.title,
              value: item.key,
            }))}
          />
        ) : (
          <span className="analyze-history-empty">暂无可切换的历史分析</span>
        )}
      </div>
    </div>
  );
}

function readPendingAnalyzeJob() {
  const savedJob = readStorage(pendingAnalyzeJobKey);

  if (!savedJob) return null;

  writeStorage(pendingAnalyzeJobKey, "");

  try {
    return JSON.parse(savedJob);
  } catch {
    return null;
  }
}

function countReadableChars(value) {
  return String(value || "").replace(/\s/g, "").length;
}

function applySuggestionsToResume(resume, suggestions) {
  let nextResume = resume;
  const unappliedSuggestions = [];

  suggestions.forEach((suggestion) => {
    const before = String(suggestion.before || "").trim();
    const after = String(suggestion.after || "").trim();

    if (!after) return;

    if (before && nextResume.includes(before)) {
      nextResume = nextResume.replace(before, after);
    } else {
      unappliedSuggestions.push(suggestion);
    }
  });

  if (unappliedSuggestions.length === 0) return nextResume;

  return `${nextResume.trim()}\n\n## 岗位匹配优化建议\n\n${unappliedSuggestions
    .map((suggestion, index) =>
      [
        `### ${index + 1}. ${suggestion.section || "简历内容"}`,
        suggestion.after ? suggestion.after : "",
        suggestion.reason ? `> ${suggestion.reason}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    )
    .join("\n\n")}\n`;
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
