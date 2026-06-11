"use client";

import {
  DiffOutlined,
  MessageOutlined,
  PlusOutlined,
  RedoOutlined,
  SearchOutlined,
  SendOutlined,
  UndoOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { Button, Input, Radio, Segmented, Tag, message } from "antd";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "../components/AppShell";
import ResumeDisplay from "../components/ResumeDisplay";
import { roles } from "../config";
import { withLlmSettings } from "../llmSettings";
import VersionCompare from "./VersionCompare";
import ResumeList from "./ResumeList";
import {
  createInitialResumeItem,
  createInitialResumeItems,
  createResumeItem,
  getActiveResumeItem,
  persistResumeItems,
  readResumeItems,
  setActiveResumeItem,
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
  const [, setStage] = useState("original");
  const [resumeItems, setResumeItems] = useState(createInitialResumeItems);
  const [activeResumeId, setActiveResumeId] = useState(
    () => getActiveResumeItem(resumeItems)?.id
  );
  const [compareBaseId, setCompareBaseId] = useState("");
  const [compareTargetId, setCompareTargetId] = useState("");
  const [chatMessagesByResume, setChatMessagesByResume] = useState({});

  const activeResume = useMemo(
    () =>
      resumeItems.find((item) => item.id === activeResumeId) ||
      getActiveResumeItem(resumeItems),
    [activeResumeId, resumeItems]
  );
  const resume = activeResume?.resume || "";
  const role = activeResume?.role || "";
  const chatMessages = chatMessagesByResume[activeResume?.id] || [];

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

  function updateItems(nextItems, nextActiveId = activeResumeId) {
    setResumeItems(nextItems);
    setActiveResumeId(nextActiveId);
    setCompareTargetId(nextActiveId || "");
    if (!compareBaseId) {
      setCompareBaseId(nextItems[1]?.id || nextItems[0]?.id || "");
    }
    persistResumeItems(nextItems);
  }

  function updateActiveResume(updates) {
    const nextItems = updateResumeItem(resumeItems, activeResume.id, updates);

    updateItems(nextItems, activeResume.id);
    return nextItems;
  }

  function setResume(value) {
    updateActiveResume({ resume: value || "" });
  }

  function setRole(value) {
    updateActiveResume({ role: value });
  }

  function syncActiveResume(resumeItem, nextItems) {
    updateItems(nextItems, resumeItem?.id);
  }

  function updateResumeVersion(resumeId, value) {
    const nextItems = updateResumeItem(resumeItems, resumeId, {
      resume: value || "",
    });

    updateItems(nextItems, resumeId === activeResumeId ? resumeId : activeResumeId);
  }

  function setChatMessages(resumeId, updater) {
    setChatMessagesByResume((current) => {
      const previous = current[resumeId] || [];
      const nextMessages =
        typeof updater === "function" ? updater(previous) : updater;

      return {
        ...current,
        [resumeId]: nextMessages,
      };
    });
  }

  function applyAiResume({
    targetMode,
    nextResume,
    nextTitle,
    nextVersion,
    instruction,
    summary,
  }) {
    if (targetMode === "replace") {
      const nextItems = updateResumeItem(resumeItems, activeResume.id, {
        resume: nextResume,
        title: nextTitle || activeResume.title,
        version: nextVersion || activeResume.version || "AI魔改版",
        role: activeResume.role || "",
        highlight: [],
        matchAnalysis: {},
        interviewMaterials: {},
      });

      updateItems(nextItems, activeResume.id);
      setChatMessages(activeResume.id, (previous) => [
        ...previous,
        {
          role: "assistant",
          content: summary || "已按要求更新当前简历版本。",
          instruction,
          resultMode: "replace",
        },
      ]);
      message.success("当前简历已更新");
      return;
    }

    const nextItem = createResumeItem(resumeItems.length + 1, nextResume, {
      title: nextTitle || `${activeResume.title || "简历"} - AI魔改版`,
      version: nextVersion || "AI魔改版",
      role: activeResume.role || "",
      highlight: [],
      matchAnalysis: {},
      interviewMaterials: {},
      active: true,
    });
    const nextItems = setActiveResumeItem([nextItem, ...resumeItems], nextItem.id);

    updateItems(nextItems, nextItem.id);
    setChatMessages(nextItem.id, [
      {
        role: "assistant",
        content:
          summary || "我已经基于当前简历创建了一个新的 AI 魔改版本，你可以继续在右侧对它迭代。",
        instruction,
        resultMode: "create",
      },
    ]);
    message.success("已创建新的简历版本");
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
      <aside className="flex flex-col min-w-1/6 max-w-1/4 gap-4">
        <ResumeList
          activeResume={activeResume}
          resumeItems={resumeItems}
          setActiveResumeId={setActiveResumeId}
          setMode={setMode}
          setResumeItems={setResumeItems}
          setStage={setStage}
        />
      </aside>

      <main className="flex-1 flex flex-col gap-4 overflow-hidden">
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
          <Radio.Button value="qa">
            <MessageOutlined /> 简历魔改AI
          </Radio.Button>
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
        ) : mode === "qa" ? (
          <ResumeAiWorkspace
            activeResume={activeResume}
            chatMessages={chatMessages}
            onApplyResult={applyAiResume}
            onSetChatMessages={setChatMessages}
            resumeItems={resumeItems}
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

            <div className="resume-md-card flex-1 flex flex-col gap-4 rounded-2xl bg-surface p-6">
              <GeneralEditor resume={resume} setResume={setResume} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ResumeAiWorkspace({
  activeResume,
  chatMessages,
  onApplyResult,
  onSetChatMessages,
  resumeItems,
}) {
  const [instruction, setInstruction] = useState("");
  const [targetMode, setTargetMode] = useState("create");
  const [loading, setLoading] = useState(false);
  const displayMessages = chatMessages.length
    ? chatMessages
    : [
        {
          role: "assistant",
          content:
            "把你的修改目标告诉我，例如“突出前端性能优化经验”“改成更适合产品经理投递的版本”或“保留事实但语气更有冲击力”。",
        },
      ];
  const canSubmit = activeResume?.resume?.trim() && instruction.trim();

  async function submitInstruction() {
    if (!activeResume?.resume?.trim()) {
      message.warning("请先准备一份简历内容");
      return;
    }

    if (!instruction.trim()) {
      message.warning("先告诉我你想怎么改");
      return;
    }

    const currentInstruction = instruction.trim();
    const resumeId = activeResume.id;

    setInstruction("");
    setLoading(true);
    onSetChatMessages(resumeId, (previous) => [
      ...previous,
      {
        role: "user",
        content: currentInstruction,
        resultMode: targetMode,
      },
    ]);

    try {
      const response = await fetch("/api/resume/chat-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          withLlmSettings({
            resume: activeResume.resume,
            role: activeResume.role || "",
            instruction: currentInstruction,
            history: chatMessages.slice(-6),
          })
        ),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "简历魔改失败");
      }

      onApplyResult({
        targetMode,
        nextResume: data.resume,
        nextTitle: data.title,
        nextVersion: data.version,
        instruction: currentInstruction,
        summary: data.summary,
      });
    } catch (error) {
      onSetChatMessages(resumeId, (previous) => [
        ...previous,
        {
          role: "assistant",
          content: error.message || "这次改写失败了，请稍后重试。",
          error: true,
        },
      ]);
      message.error(error.message || "简历魔改失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="resume-ai-layout">
      <div className="resume-ai-preview">
        <header className="resume-ai-panel-header">
          <div>
            <h1>{activeResume?.title || "当前简历"}</h1>
            <p>左侧始终显示当前激活版本，生成新版本后会自动切换。</p>
          </div>
          <Tag
            variant="filled"
            color="blue"
            className="m-0 px-3 py-1 font-black"
          >
            {resumeItems.length} 个版本
          </Tag>
        </header>

        <div className="resume-ai-preview-body">
          <ResumeDisplay
            activeResumeId={activeResume?.id}
            mode="detail"
            resumeItems={resumeItems}
            showSelect={false}
          />
        </div>
      </div>

      <div className="resume-ai-chat">
        <header className="resume-ai-panel-header">
          <div>
            <h1>简历魔改 AI</h1>
            <p>通过对话描述你要的改法，我会直接产出新的 Markdown 简历。</p>
          </div>
          <Segmented
            options={[
              {
                label: (
                  <span className="flex items-center gap-1">
                    <PlusOutlined />
                    新建版本
                  </span>
                ),
                value: "create",
              },
              {
                label: "覆盖当前",
                value: "replace",
              },
            ]}
            value={targetMode}
            onChange={setTargetMode}
          />
        </header>

        <div className="resume-ai-chat-stream">
          {displayMessages.map((item, index) => (
            <article
              className={
                item.role === "user"
                  ? "resume-chat-bubble user"
                  : item.error
                  ? "resume-chat-bubble assistant error"
                  : "resume-chat-bubble assistant"
              }
              key={`${item.role}-${index}`}
            >
              <span className="resume-chat-role">
                {item.role === "user" ? "你" : "AI"}
              </span>
              <p>{item.content}</p>
              {item.resultMode ? (
                <Tag
                  variant="filled"
                  color={item.resultMode === "create" ? "geekblue" : "gold"}
                  className="m-0 w-fit"
                >
                  {item.resultMode === "create" ? "新版本" : "覆盖当前"}
                </Tag>
              ) : null}
            </article>
          ))}
        </div>

        <footer className="resume-ai-composer">
          <div className="resume-ai-hint">
            <WarningFilled />
            <span>
              建议直接说目标、风格和限制条件，例如“压缩到一页内，保留所有真实经历，不要编造数据”。
            </span>
          </div>

          <Input.TextArea
            autoSize={{ minRows: 4, maxRows: 8 }}
            onChange={(event) => setInstruction(event.target.value)}
            onPressEnter={(event) => {
              if (event.shiftKey) return;
              event.preventDefault();
              if (!canSubmit || loading) return;
              submitInstruction();
            }}
            placeholder="输入你想怎么改简历，比如：把项目经历改得更像高级前端，突出性能优化、协作和业务结果。"
            value={instruction}
          />

          <div className="resume-ai-actions">
            <span>
              当前模式：
              {targetMode === "create" ? "生成新版本" : "直接覆盖当前版本"}
            </span>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={submitInstruction}
            >
              发送给 AI
            </Button>
          </div>
        </footer>
      </div>
    </section>
  );
}

function ResumePageFallback() {
  const fallbackItems = [createInitialResumeItem()];
  const fallbackResume = fallbackItems[0];

  return (
    <div className="flex gap-4 h-full">
      <aside className="flex flex-col min-w-1/6 max-w-1/4 gap-4">
        <ResumeList
          activeResume={fallbackResume}
          resumeItems={fallbackItems}
          setActiveResumeId={() => {}}
          setMode={() => {}}
          setResumeItems={() => {}}
          setStage={() => {}}
        />
      </aside>

      <main className="flex-1 flex flex-col gap-4 overflow-hidden">
        <Radio.Group size="large" block buttonStyle="solid" value="general">
          <Radio.Button value="general">简历编辑</Radio.Button>
          <Radio.Button value="compare">
            <DiffOutlined /> 版本对比
          </Radio.Button>
          <Radio.Button value="qa">
            <MessageOutlined /> 简历魔改AI
          </Radio.Button>
        </Radio.Group>

        <section className="flex-1 flex gap-4 overflow-hidden">
          <div className="flex-1 p-6 bg-surface rounded-2xl overflow-auto scrollbar-none" />
          <div className="resume-md-card flex-1 flex flex-col gap-4 rounded-2xl bg-surface p-6">
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
