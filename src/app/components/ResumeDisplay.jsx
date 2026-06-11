"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DownOutlined,
  FileTextOutlined,
  HighlightOutlined,
  InboxOutlined,
  StarFilled,
} from "@ant-design/icons";
import { Button, message, Select, Upload } from "antd";
import ReactMarkdown from "react-markdown";
import {
  createInitialResumeItems,
  persistResumeItems,
  readResumeItems,
  setActiveResumeItem,
  getActiveResumeItem,
  updateResumeItem,
} from "../storage";
import { readSavedLlmSettings, withLlmSettings } from "../llmSettings";

const { Dragger } = Upload;

export default function ResumeDisplay({
  activeResumeId: controlledActiveResumeId,
  mode = "detail",
  resumeItems: controlledResumeItems,
  showSelect = true,
  titleNode,
  emptyExtra,
  onResumeChange,
  onResumeItemChange,
  mdClassName,
  uploadClassName = "flex flex-col w-full",
  uploadHint = "支持 PDF、Docx、Markdown、TXT 等格式",
  uploadText = "上传简历文件",
}) {
  const [resumeItems, setResumeItems] = useState(createInitialResumeItems);
  const [activeResumeId, setActiveResumeId] = useState(
    () => getActiveResumeItem(resumeItems)?.id
  );
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const effectiveResumeItems = controlledResumeItems || resumeItems;
  const effectiveActiveResumeId = controlledActiveResumeId || activeResumeId;

  const activeResume = useMemo(
    () =>
      effectiveResumeItems.find(
        (item) => item.id === effectiveActiveResumeId
      ) || getActiveResumeItem(effectiveResumeItems),
    [effectiveActiveResumeId, effectiveResumeItems]
  );
  const resume = activeResume?.resume || "";
  const analysisItems = Array.isArray(activeResume?.highlight)
    ? activeResume.highlight
    : [];
  const hasResumeItems =
    showSelect &&
    (effectiveResumeItems.length > 1 ||
      effectiveResumeItems.some((item) => item.resume));

  useEffect(() => {
    if (controlledResumeItems) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const storedItems = readResumeItems();

      setResumeItems(storedItems);
      setActiveResumeId(getActiveResumeItem(storedItems)?.id);
    });

    return () => {
      cancelled = true;
    };
  }, [controlledResumeItems]);

  function syncResumeItems(nextItems, nextActiveId) {
    const nextActiveItem =
      nextItems.find((item) => item.id === nextActiveId) || nextItems[0];

    if (!controlledResumeItems) setResumeItems(nextItems);
    if (!controlledActiveResumeId) setActiveResumeId(nextActiveId);
    persistResumeItems(nextItems);
    onResumeChange?.(nextActiveItem?.resume || "");
    onResumeItemChange?.(nextActiveItem, nextItems);
  }

  function selectResumeItem(resumeId) {
    const nextItems = setActiveResumeItem(effectiveResumeItems, resumeId);

    syncResumeItems(nextItems, resumeId);
  }

  function setResume(value) {
    const targetItem =
      activeResume || getActiveResumeItem(effectiveResumeItems);
    const nextItems = updateResumeItem(effectiveResumeItems, targetItem.id, {
      resume: value || "",
      highlight: [],
      jobCategories: [],
      matchAnalysis: {},
    });

    syncResumeItems(nextItems, targetItem.id);
  }

  const props = {
    name: "file",
    multiple: true,
    action: "/api/resume/parse",
    data: () => {
      const llmSettings = readSavedLlmSettings();
      return llmSettings ? { llmSettings: JSON.stringify(llmSettings) } : {};
    },
    onChange(info) {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
        setResume(info.file?.response?.markdown);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  async function analyzeResume() {
    if (!resume.trim()) {
      message.warning("请先上传或选择一份简历");
      return;
    }

    setAnalysisLoading(true);

    try {
      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withLlmSettings({ resume })),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "简历分析失败");
      }

      const nextItems = updateResumeItem(
        effectiveResumeItems,
        activeResume.id,
        {
          highlight: data.highlights || [],
          jobCategories: data.jobCategories || [],
        }
      );

      syncResumeItems(nextItems, activeResume.id);
      message.success("简历分析完成");
    } catch (error) {
      message.error(error.message || "简历分析失败");
    } finally {
      setAnalysisLoading(false);
    }
  }

  const renderContent = () => {
    if (mode === "detail") {
      return (
        <div className="resume-preview-content">
          <ReactMarkdown>{resume.trim()}</ReactMarkdown>
        </div>
      );
    } else if (mode === "analysis") {
      return renderAnalysisResumePanel();
    }
  };

  const renderAnalysisResumePanel = () => {
    return analysisItems.length ? (
      <div className="grid grid-cols-4 gap-5 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1 max-[720px]:gap-3">
        {analysisItems.map((item, index) => (
          <article
            className="grid min-h-37 grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-[7px] border border-app-border bg-surface-muted p-4 max-[720px]:min-h-0 max-[720px]:p-4"
            key={`${item.number}-${item.title}`}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-primary-border bg-primary text-[17px] font-black text-white">
              {item.number || String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="flex items-center gap-1.5 text-[19px] font-black text-app-fg">
                {item.title}
                {item.featured ? (
                  <StarFilled className="text-[17px] text-warning" />
                ) : null}
              </h2>
              <p className="mt-2.5 text-[15px] font-bold leading-[1.6] text-muted">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="flex flex-col items-center border-t border-border gap-2 pt-4">
        <div className="flex gap-2 items-center">
          <div className="w-12 h-12 rounded-full bg-primary-softer flex items-center justify-center text-primary text-2xl">
            <HighlightOutlined />
          </div>
          <p className="text-xl font-bold">开始分析，为你定制求职方案</p>
        </div>

        <p className="text-md font-bold text-gray-400">
          Job AI将深度分析你的简历，为你整理专属求职表格，并持续监控全网适合你的岗位
        </p>
        <Button
          size="large"
          loading={analysisLoading}
          onClick={analyzeResume}
          type="primary"
          icon={<HighlightOutlined />}
        >
          开始分析我的简历
        </Button>
      </div>
    );
  };

  function renderSelect() {
    if (!hasResumeItems) return null;

    return (
      <div className="flex justify-between items-center">
        {titleNode}
        <div className="flex items-center gap-2">
          <Select
            value={activeResume?.id}
            style={{ width: 180 }}
            onChange={selectResumeItem}
            options={effectiveResumeItems.map((item) => ({
              value: item.id,
              label: item.title || item.version || "未命名简历",
            }))}
          />
        </div>
      </div>
    );
  }

  const uploadNode = (
    <>
      <Dragger {...props} className={uploadClassName}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{uploadText}</p>
        <p className="ant-upload-hint">{uploadHint}</p>
      </Dragger>
      {emptyExtra}
    </>
  );

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
      {renderSelect()}
      <div
        className={
          "min-h-0 flex-1 overflow-auto scrollbar-none " +
          (resume ? mdClassName : "")
        }
      >
        {resume ? renderContent() : uploadNode}
      </div>
    </div>
  );
}
