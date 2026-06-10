"use client";

import {
  DiffOutlined,
  DeleteOutlined,
  DownloadOutlined,
  RedoOutlined,
  SearchOutlined,
  UndoOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { Button, Input, Radio } from "antd";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "../components/AppShell";
import ResumeDisplay from "../components/ResumeDisplay";
import { roles } from "../config";
import VersionCompare from "./VersionCompare";
import ResumeList from "./ResumeList";
import {
  createInitialResumeItems,
  createInitialResumeItem,
  getActiveResumeItem,
  persistResumeItems,
  readResumeItems,
  updateResumeItem,
} from "../storage";
import "./page.css";

export default function ResumePage() {
  return (
    <AppShell>
      <Suspense fallback={<ResumePageFallback />}>
        <ResumePageContent />
      </Suspense>
    </AppShell>
  );
}

function ResumePageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("general");
  const [stage, setStage] = useState("original");
  const [resumeItems, setResumeItems] = useState(createInitialResumeItems);
  const [activeResumeId, setActiveResumeId] = useState(
    () => getActiveResumeItem(resumeItems)?.id
  );
  const [compareBaseId, setCompareBaseId] = useState("");
  const [compareTargetId, setCompareTargetId] = useState("");

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
      const activeItem = getActiveResumeItem(storedItems);

      setResumeItems(storedItems);
      setActiveResumeId(activeItem?.id);
      setCompareBaseId(storedItems[1]?.id || activeItem?.id || "");
      setCompareTargetId(activeItem?.id || storedItems[0]?.id || "");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const nextMode = searchParams.get("mode");
      const baseId = searchParams.get("base");
      const targetId = searchParams.get("target");

      if (nextMode === "compare") setMode("compare");
      if (baseId) setCompareBaseId(baseId);
      if (targetId) {
        setCompareTargetId(targetId);
        setActiveResumeId(targetId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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
    setCompareTargetId(resumeItem?.id || "");
    if (!compareBaseId) {
      setCompareBaseId(nextItems[1]?.id || nextItems[0]?.id || "");
    }
  }

  function updateResumeVersion(resumeId, value) {
    const nextItems = updateResumeItem(resumeItems, resumeId, {
      resume: value || "",
    });

    setResumeItems(nextItems);
    persistResumeItems(nextItems);
    if (resumeId === activeResumeId) setActiveResumeId(resumeId);
  }

  const compareBaseResume = useMemo(
    () =>
      resumeItems.find((item) => item.id === compareBaseId) ||
      resumeItems[1] ||
      resumeItems[0],
    [compareBaseId, resumeItems]
  );
  const compareTargetResume = useMemo(
    () =>
      resumeItems.find((item) => item.id === compareTargetId) ||
      activeResume ||
      resumeItems[0],
    [activeResume, compareTargetId, resumeItems]
  );

  return (
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
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <Radio.Button value="general">简历编辑</Radio.Button>
          <Radio.Button value="compare">
            <DiffOutlined /> 版本对比
          </Radio.Button>
          <Radio.Button value="qa">简历魔改AI</Radio.Button>
        </Radio.Group>

        {mode === "compare" ? (
          <VersionCompare
            baseResume={compareBaseResume}
            onBaseChange={setCompareBaseId}
            onResumeChange={updateResumeVersion}
            onTargetChange={setCompareTargetId}
            resumeItems={resumeItems}
            targetResume={compareTargetResume}
          />
        ) : (
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
              <GeneralEditor resume={resume} setResume={setResume} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ResumePageFallback() {
  const fallbackItems = [createInitialResumeItem()];
  const fallbackResume = fallbackItems[0];

  return (
    <div className="flex gap-4 h-full">
      <aside className=" flex flex-col min-w-1/6 max-w-1/4 gap-4">
        <ResumeList
          activeResume={fallbackResume}
          resumeItems={fallbackItems}
          setActiveResumeId={() => {}}
          setMode={() => {}}
          setResumeItems={() => {}}
          setStage={() => {}}
        />
      </aside>

      <main className=" flex-1 flex flex-col gap-4 overflow-hidden">
        <Radio.Group size="large" block buttonStyle="solid" value="general">
          <Radio.Button value="general">简历编辑</Radio.Button>
          <Radio.Button value="compare">
            <DiffOutlined /> 版本对比
          </Radio.Button>
          <Radio.Button value="qa">简历魔改AI</Radio.Button>
        </Radio.Group>

        <section className="flex-1 flex gap-4 overflow-hidden">
          <div className="flex-1 p-6 bg-surface rounded-2xl overflow-auto scrollbar-none" />
          <div className="flex-1 flex flex-col gap-4 rounded-2xl bg-surface p-6">
            <GeneralEditor resume="" setResume={() => {}} />
          </div>
        </section>
      </main>
    </div>
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
