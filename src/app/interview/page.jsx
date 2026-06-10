"use client";

import { ThunderboltOutlined } from "@ant-design/icons";
import { Button, Input, Select, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  createInitialResumeItems,
  getActiveResumeItem,
  persistResumeItems,
  readActiveResume,
  readResumeItems,
  setActiveResumeItem,
  updateResumeItem,
} from "../storage";
import InterviewMaterialResult from "./InterviewMaterialResult";
import "../analyze/page.css";
import "./page.css";

export default function InterviewPage() {
  const [resumeItems, setResumeItems] = useState(createInitialResumeItems);
  const [resumeText, setResumeText] = useState("");
  const [resumeItem, setResumeItem] = useState(null);
  const [jdText, setJdText] = useState("");
  const [targetForm, setTargetForm] = useState({
    company: "",
    jobTitle: "",
    jd: "",
  });
  const [materialResult, setMaterialResult] = useState(null);
  const [selectedMaterialKey, setSelectedMaterialKey] = useState("");
  const [materialLoading, setMaterialLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const storedItems = readResumeItems();
      const activeResume = getActiveResumeItem(storedItems);
      const latestEntry = getLatestInterviewEntry(activeResume);
      const initialJd = latestEntry?.jd || "";

      setResumeItems(storedItems);
      setResumeText(readActiveResume());
      setResumeItem(activeResume);
      setSelectedMaterialKey(latestEntry?.key || "");
      setJdText(initialJd);
      setTargetForm({
        company: latestEntry?.company || "",
        jobTitle: latestEntry?.jobTitle || "",
        jd: initialJd,
      });
      setMaterialResult(latestEntry?.result || null);
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
      getInterviewEntryForJd(nextResumeItem, jdText) ||
      getLatestInterviewEntry(nextResumeItem);
    const nextJd = getInterviewEntryForJd(nextResumeItem, jdText)
      ? jdText
      : entry?.jd || jdText;

    setResumeItems(nextItems);
    persistResumeItems(nextItems);
    setResumeText(nextResumeItem?.resume || "");
    setResumeItem(nextResumeItem || null);
    setSelectedMaterialKey(entry?.key || "");
    setMaterialResult(entry?.result || null);
    setJdText(nextJd);
    setTargetForm({
      company: entry?.company || "",
      jobTitle: entry?.jobTitle || "",
      jd: nextJd,
    });
  }

  async function generateMaterials() {
    if (!resumeText.trim()) {
      message.warning("请先选择或上传简历");
      return;
    }

    if (!jdText.trim()) {
      message.warning("请先填写岗位 JD");
      return;
    }

    setMaterialLoading(true);

    try {
      const response = await fetch("/api/interview", {
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
        throw new Error(data.message || data.error || "面试素材生成失败");
      }

      const storedItems = readResumeItems();
      const activeResume =
        storedItems.find((item) => item.id === resumeItem?.id) ||
        getActiveResumeItem(storedItems);
      const materialKey = createJdKey(jdText);
      const interviewMaterials = {
        ...(activeResume.interviewMaterials || {}),
        [materialKey]: {
          key: materialKey,
          title: createAnalysisTitle(jdText),
          company: targetForm.company,
          jobTitle: targetForm.jobTitle,
          jd: jdText,
          createdAt: new Date().toISOString(),
          result: data,
        },
      };
      const nextItems = updateResumeItem(storedItems, activeResume.id, {
        interviewMaterials,
      });
      const nextResumeItem =
        nextItems.find((item) => item.id === activeResume.id) ||
        getActiveResumeItem(nextItems);

      persistResumeItems(nextItems);
      setResumeItems(nextItems);
      setResumeItem(nextResumeItem);
      setSelectedMaterialKey(materialKey);
      setMaterialResult(data);
      message.success("面试素材已生成");
    } catch (error) {
      message.error(error.message || "面试素材生成失败");
    } finally {
      setMaterialLoading(false);
    }
  }

  function selectMaterial(key) {
    const entry = getInterviewEntries(resumeItem).find((item) => item.key === key);

    setSelectedMaterialKey(key);
    setMaterialResult(entry?.result || null);
    if (!entry) return;

    setJdText(entry.jd || "");
    setTargetForm({
      company: entry.company || "",
      jobTitle: entry.jobTitle || "",
      jd: entry.jd || "",
    });
  }

  function updateTargetField(key, value) {
    setTargetForm((current) => ({ ...current, [key]: value }));

    if (key !== "jd") return;

    const entry = getInterviewEntryForJd(resumeItem, value);

    setJdText(value);
    setSelectedMaterialKey(entry?.key || "");
    setMaterialResult(entry?.result || null);
  }

  async function downloadMaterials() {
    if (!materialResult) {
      message.warning("请先生成面试素材");
      return;
    }

    setDownloading(true);

    try {
      const content = buildInterviewMarkdown({
        company: targetForm.company,
        jobTitle: targetForm.jobTitle,
        jd: jdText,
        materialResult,
      });
      const blob = new Blob([content], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `${buildDownloadName(targetForm)}.md`;
      anchor.click();
      URL.revokeObjectURL(url);
      message.success("面试素材已下载");
    } finally {
      setDownloading(false);
    }
  }

  const interviewEntries = getInterviewEntries(resumeItem);

  return (
    <AppShell>
      <div className="analyze-page h-full flex flex-col gap-4 overflow-hidden">
        <header className="flex gap-4 items-center">
          <h1>面试素材库</h1>
          <p className="text-gray-500">
            根据简历和岗位 JD，整理高频面试问题、回答参考与临场准备要点。
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

            <InterviewEditor
              interviewEntries={interviewEntries}
              onSelectMaterial={selectMaterial}
              onUpdateField={updateTargetField}
              selectedMaterialKey={selectedMaterialKey}
              targetForm={targetForm}
              textStats={textStats}
            />

            <Button
              block
              icon={<ThunderboltOutlined />}
              loading={materialLoading}
              onClick={generateMaterials}
              size="large"
              type="primary"
            >
              生成面试素材
            </Button>
          </section>

          <section className="min-h-0 overflow-auto analyze-result-panel">
            <InterviewMaterialResult
              downloading={downloading}
              materialResult={materialResult}
              onDownload={downloadMaterials}
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function InterviewEditor({
  interviewEntries,
  onSelectMaterial,
  onUpdateField,
  selectedMaterialKey,
  targetForm,
  textStats,
}) {
  return (
    <div className="analyze-target-editor">
      <h2>岗位 JD</h2>

      <div className="target-input-grid">
        <div>
          目标公司
          <Input
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
          placeholder="请粘贴岗位职责、任职要求、加分项，越完整生成的面试素材越贴近真实面试"
          value={targetForm.jd}
        />
      </label>

      <div className="analyze-history-select">
        <header>
          <h2>历史素材</h2>
          <small>选择后会填充对应 JD</small>
        </header>
        {interviewEntries?.length > 1 ? (
          <Select
            value={selectedMaterialKey}
            onChange={onSelectMaterial}
            options={interviewEntries.map((item) => ({
              label: item.title,
              value: item.key,
            }))}
          />
        ) : (
          <span className="analyze-history-empty">暂无可切换的历史素材</span>
        )}
      </div>
    </div>
  );
}

function countReadableChars(value) {
  return String(value || "").replace(/\s/g, "").length;
}

function getInterviewEntries(resumeItem) {
  const interviewMaterials = resumeItem?.interviewMaterials;
  if (!interviewMaterials || typeof interviewMaterials !== "object") return [];

  return Object.values(interviewMaterials)
    .filter((entry) => entry?.result)
    .sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
}

function getLatestInterviewEntry(resumeItem) {
  return getInterviewEntries(resumeItem)[0] || null;
}

function getInterviewEntryForJd(resumeItem, jd) {
  if (!jd?.trim()) return null;
  const key = createJdKey(jd);
  return resumeItem?.interviewMaterials?.[key] || null;
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

function buildDownloadName(targetForm) {
  const parts = [targetForm.company, targetForm.jobTitle, "面试素材库"]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return parts.join("-") || "面试素材库";
}

function buildInterviewMarkdown({ company, jobTitle, jd, materialResult }) {
  const lines = [
    "# 面试素材库",
    "",
    company ? `- 目标公司：${company}` : null,
    jobTitle ? `- 目标岗位：${jobTitle}` : null,
    `- 生成时间：${new Date().toLocaleString("zh-CN", { hour12: false })}`,
    "",
    "## 准备概览",
    "",
    `### ${materialResult?.overview?.title || "面试准备重点"}`,
    "",
    materialResult?.overview?.summary || "",
    "",
    "## 面试问答素材",
    "",
  ].filter(Boolean);

  (materialResult?.materials || []).forEach((item, index) => {
    lines.push(`${index + 1}. 问题：${item.question}`);
    lines.push("");
    if (item.focus) {
      lines.push(`标签：${item.focus}`);
      lines.push("");
    }
    lines.push("参考回答：");
    lines.push(item.answer || "请结合真实经历补充。");
    lines.push("");
    lines.push("准备建议：");
    lines.push(item.suggestion || "请根据岗位 JD 和简历信息补充细节。");
    lines.push("");
  });

  if (jd?.trim()) {
    lines.push("## 岗位 JD");
    lines.push("");
    lines.push(jd.trim());
    lines.push("");
  }

  return lines.join("\n");
}
