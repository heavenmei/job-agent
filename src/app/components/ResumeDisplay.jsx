"use client";

import { useMemo, useState } from "react";
import { InboxOutlined, StarFilled } from "@ant-design/icons";
import { message, Select, Upload } from "antd";
import ReactMarkdown from "react-markdown";
import {
  persistResumeItems,
  readResumeItems,
  setActiveResumeItem,
  getActiveResumeItem,
  updateResumeItem,
} from "../storage";

const { Dragger } = Upload;

const analysisHighlights = [
  {
    number: "01",
    title: "跨学科复合型人才",
    description:
      "你拥有跨学科背景与丰富的AI应用实践，具备数据驱动思维，在产品与人力资源领域展现出较强的综合素质与落地能力",
  },
  {
    number: "02",
    title: "量身定制9种求职路径",
    description:
      "已为你定制9张求职表格：可按专业、央国企、职位、行业等多维度求职",
  },
  {
    number: "03",
    title: "推荐按照职位找工作",
    description: "根据你的情况，优先按照职位找工作，更适合你获得合适的工作",
    featured: true,
  },
  {
    number: "04",
    title: "7×24 全网监控",
    description: "AI持续为你监控全网新增岗位，第一时间发现适合你的岗位",
  },
];

export default function ResumeDisplay({
  mode = "detail",
  showSelect = true,
  titleNode,
  emptyExtra,
  onResumeItemChange,
  mdClassName,
  uploadClassName = "flex flex-col w-full",
  uploadHint = "支持 PDF、Docx、Markdown、TXT 等格式",
  uploadText = "上传简历文件",
}) {
  const [resumeItems, setResumeItems] = useState(readResumeItems);
  const [activeResumeId, setActiveResumeId] = useState(
    () => getActiveResumeItem(resumeItems)?.id
  );

  const activeResume = useMemo(
    () =>
      resumeItems.find((item) => item.id === activeResumeId) ||
      getActiveResumeItem(resumeItems),
    [activeResumeId, resumeItems]
  );
  const resume = activeResume?.resume || "";
  const hasResumeItems =
    showSelect &&
    (resumeItems.length > 1 || resumeItems.some((item) => item.resume));

  function syncResumeItems(nextItems, nextActiveId) {
    const nextActiveItem =
      nextItems.find((item) => item.id === nextActiveId) || nextItems[0];

    setResumeItems(nextItems);
    setActiveResumeId(nextActiveId);
    persistResumeItems(nextItems);
    onResumeItemChange?.(nextActiveItem, nextItems);
  }

  function selectResumeItem(resumeId) {
    const nextItems = setActiveResumeItem(resumeItems, resumeId);

    syncResumeItems(nextItems, resumeId);
  }

  function setResume(value) {
    const targetItem = activeResume || getActiveResumeItem(resumeItems);
    const nextItems = updateResumeItem(resumeItems, targetItem.id, {
      resume: value || "",
    });

    syncResumeItems(nextItems, targetItem.id);
  }

  const props = {
    name: "file",
    multiple: true,
    action: "/api/resume/parse",
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

  const renderContent = () => {
    if (mode === "detail") {
      return (
        <div className="resume-preview-content">
          <ReactMarkdown>{resume.trim()}</ReactMarkdown>
        </div>
      );
    } else if (mode === "analysis") {
      return (
        <div className="grid grid-cols-4 gap-5 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1 max-[720px]:gap-3">
          {analysisHighlights.map((item) => (
            <article
              className="grid min-h-37 grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-[7px] border border-app-border bg-surface-muted px-5 py-6 max-[720px]:min-h-0 max-[720px]:p-4"
              key={item.number}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-primary-border bg-primary-soft text-[17px] font-black text-primary">
                {item.number}
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
      );
    }
  };

  function renderSelect() {
    if (!hasResumeItems) return null;

    return (
      <div className="flex justify-between items-center">
        {titleNode}
        <Select
          value={activeResume?.id}
          style={{ width: 180 }}
          onChange={selectResumeItem}
          options={resumeItems.map((item) => ({
            value: item.id,
            label: item.title || item.version || "未命名简历",
          }))}
        />
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
          "min-h-0 flex-1 overflow-auto scrollbar-none " + (resume
            ? mdClassName
            : "")
        }
      >
        {resume ? renderContent() : uploadNode}
      </div>
    </div>
  );
}
