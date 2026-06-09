"use client";

import {
  DeleteOutlined,
  DownloadOutlined,
  RedoOutlined,
  SearchOutlined,
  UndoOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { Button, Input, Radio } from "antd";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import ResumeDisplay from "../components/ResumeDisplay";
import { roles } from "../config";
import "./page.css";
import ResumeList from "./resumeList";
import {
  createInitialResumeItems,
  getActiveResumeItem,
  persistResumeItems,
  readResumeItems,
  updateResumeItem,
} from "../storage";

export default function ResumePage() {
  const [mode, setMode] = useState("general");
  const [stage, setStage] = useState("original");
  const [resumeItems, setResumeItems] = useState(createInitialResumeItems);
  const [activeResumeId, setActiveResumeId] = useState(
    () => getActiveResumeItem(resumeItems)?.id
  );
  const [targetForm, setTargetForm] = useState({
    company: "",
    jobTitle: "",
    jd: "",
  });

  const activeResume = useMemo(
    () =>
      resumeItems.find((item) => item.id === activeResumeId) ||
      getActiveResumeItem(resumeItems),
    [activeResumeId, resumeItems]
  );
  const resume = activeResume?.resume || "";
  const role = activeResume?.role || "";

  useEffect(() => {
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
  }, []);

  function updateActiveResume(updates) {
    const nextItems = updateResumeItem(resumeItems, activeResume.id, updates);

    setResumeItems(nextItems);
    persistResumeItems(nextItems);
    return nextItems;
  }

  function setResume(value) {
    updateActiveResume({ resume: value || "" });
  }

  function setRole(value) {
    updateActiveResume({ role: value });
  }

  function syncActiveResume(resumeItem, nextItems) {
    setResumeItems(nextItems);
    setActiveResumeId(resumeItem?.id);
  }

  return (
    <AppShell>
      <div className="flex gap-4 h-full">
        <aside className=" flex flex-col min-w-1/6 max-w-1/4 gap-4">
          <ResumeList
            activeResume={activeResume}
            resumeItems={resumeItems}
            setActiveResumeId={setActiveResumeId}
            setMode={setMode}
            setResumeItems={setResumeItems}
            setStage={setStage}
          />
        </aside>

        <main className=" flex-1 flex flex-col gap-4 overflow-hidden">
          <Radio.Group
            size="large"
            block
            buttonStyle="solid"
            defaultValue="general"
            onChange={(e) => setMode(e.target.value)}
          >
            <Radio.Button value="general">通用优化 - 简历魔改AI</Radio.Button>
            <Radio.Button value="targeted">
              专岗优化 - 过机筛优化AI
            </Radio.Button>
          </Radio.Group>
          {/* <ResumeToolbar mode={mode} stage={stage} setStage={setStage} /> */}

          <section className="flex-1 flex gap-4 overflow-hidden">
            <div className="flex-1 p-6 bg-surface rounded-2xl overflow-auto scrollbar-none">
              <ResumeDisplay
                activeResumeId={activeResumeId}
                onResumeItemChange={syncActiveResume}
                resumeItems={resumeItems}
                uploadClassName="flex flex-col"
                showSelect={false}
                emptyExtra={
                  <>
                    <div className="resume-divider">
                      <span>或者</span>
                    </div>

                    <div className="flex gap-4">
                      <Input
                        onChange={(event) => setRole(event.target.value)}
                        placeholder="输入目标职位，方舟AI代你写简历，由你来补全"
                        value={role}
                      />
                      <Button
                        type="primary"
                        size="large"
                        icon={<SearchOutlined />}
                      />
                    </div>

                    <div className="flex gap-3 flex-wrap mt-4">
                      {roles.map((item) => (
                        <button
                          className={
                            role === item
                              ? "active resume-role-button"
                              : "resume-role-button"
                          }
                          key={item}
                          onClick={() => setRole(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </>
                }
              />
            </div>

            <div className="flex-1 flex flex-col gap-4 rounded-2xl bg-surface p-6">
              {mode === "general" ? (
                <GeneralEditor resume={resume} setResume={setResume} />
              ) : (
                <TargetedEditor
                  setTargetForm={setTargetForm}
                  targetForm={targetForm}
                />
              )}
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}

function ResumeToolbar({ mode, stage, setStage }) {
  const stages =
    mode === "general"
      ? [
          ["original", "原始的我"],
          ["optimized", "优化后的我"],
          ["ideal", "我幻想的我"],
          ["hr", "HR希望的我"],
        ]
      : [["before", "优化前的简历"]];

  return (
    <section className="resume-toolbar">
      <div className="resume-stage-tabs">
        {stages.map(([value, label]) => (
          <button
            className={stage === value ? "active" : ""}
            key={value}
            onClick={() => setStage(value)}
          >
            <WarningFilled />
            {label}
          </button>
        ))}
      </div>
      <nav className="resume-actions">
        <Button>免费简历诊断</Button>
        <Button icon={<DownloadOutlined />}>下载</Button>
        <Button icon={<DeleteOutlined />}>删除</Button>
      </nav>
    </section>
  );
}

function GeneralEditor({ resume, setResume }) {
  return (
    <>
      <header className="flex justify-between items-center">
        <h1>编辑简历MD</h1>
        <div className="flex gap-2">
          <Button icon={<UndoOutlined />}></Button>
          <Button icon={<RedoOutlined />}></Button>
        </div>
      </header>
      <Input.TextArea
        className="flex-1"
        onChange={(event) => setResume(event.target.value)}
        placeholder="请输入简历Markdown内容..."
        value={resume}
      />
      <footer>
        <span>简历仅用于自动填写，注重内容，样式越简洁越好</span>
      </footer>
    </>
  );
}

function TargetedEditor({ targetForm, setTargetForm }) {
  function updateField(key, value) {
    setTargetForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <h2 className="font-extrabold">针对岗位优化简历，提升初筛通过率</h2>
      <p className="text-[#a6a9ba]">
        很多企业使用ATS的AI进行简历初筛，而「过机筛AI」针对该岗位JD，反向深度优化简历，显著提升机器筛选通过率
      </p>

      <div className="target-input-grid">
        <label>
          目标公司
          <Input
            onChange={(event) => updateField("company", event.target.value)}
            placeholder="请输入公司名"
            value={targetForm.company}
          />
        </label>
        <label>
          目标岗位
          <Input
            onChange={(event) => updateField("jobTitle", event.target.value)}
            placeholder="请输入岗位名"
            value={targetForm.jobTitle}
          />
        </label>
      </div>

      <label className="flex flex-col flex-1">
        岗位JD
        <Input.TextArea
          className="flex-1"
          onChange={(event) => updateField("jd", event.target.value)}
          placeholder="请粘贴岗位的职责和要求，越完整优化效果越好"
          value={targetForm.jd}
        />
      </label>

      <Button size="large" type="primary">
        启动AI优化
      </Button>
    </>
  );
}
