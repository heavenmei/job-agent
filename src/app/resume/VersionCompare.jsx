"use client";

import { Select } from "antd";
import { useMemo } from "react";

function createUnifiedDiff(baseText, targetText) {
  const baseLines = String(baseText || "").split("\n");
  const targetLines = String(targetText || "").split("\n");
  const lcs = Array.from({ length: baseLines.length + 1 }, () =>
    Array(targetLines.length + 1).fill(0)
  );

  for (let baseIndex = baseLines.length - 1; baseIndex >= 0; baseIndex -= 1) {
    for (
      let targetIndex = targetLines.length - 1;
      targetIndex >= 0;
      targetIndex -= 1
    ) {
      lcs[baseIndex][targetIndex] =
        baseLines[baseIndex] === targetLines[targetIndex]
          ? lcs[baseIndex + 1][targetIndex + 1] + 1
          : Math.max(
              lcs[baseIndex + 1][targetIndex],
              lcs[baseIndex][targetIndex + 1]
            );
    }
  }

  const diffLines = [];
  let baseIndex = 0;
  let targetIndex = 0;

  while (baseIndex < baseLines.length && targetIndex < targetLines.length) {
    if (baseLines[baseIndex] === targetLines[targetIndex]) {
      diffLines.push({
        sign: " ",
        text: baseLines[baseIndex],
        type: "context",
      });
      baseIndex += 1;
      targetIndex += 1;
    } else if (
      lcs[baseIndex + 1][targetIndex] >= lcs[baseIndex][targetIndex + 1]
    ) {
      diffLines.push({
        sign: "-",
        text: baseLines[baseIndex],
        type: "removed",
      });
      baseIndex += 1;
    } else {
      diffLines.push({
        sign: "+",
        text: targetLines[targetIndex],
        type: "added",
      });
      targetIndex += 1;
    }
  }

  while (baseIndex < baseLines.length) {
    diffLines.push({
      sign: "-",
      text: baseLines[baseIndex],
      type: "removed",
    });
    baseIndex += 1;
  }

  while (targetIndex < targetLines.length) {
    diffLines.push({
      sign: "+",
      text: targetLines[targetIndex],
      type: "added",
    });
    targetIndex += 1;
  }

  return diffLines.filter(
    (line) => line.type !== "context" || line.text.trim()
  );
}

export default function VersionCompare({
  baseResume,
  onBaseChange,
  onResumeChange,
  onTargetChange,
  resumeItems,
  targetResume,
}) {
  const diffLines = useMemo(
    () =>
      createUnifiedDiff(baseResume?.resume || "", targetResume?.resume || ""),
    [baseResume?.resume, targetResume?.resume]
  );
  const resumeOptions = resumeItems.map((item) => ({
    label: `${item.title || item.version || "未命名简历"} · ${
      item.updated || "未更新"
    }`,
    value: item.id,
  }));
  const lineMarkers = useMemo(
    () => createLineMarkers(diffLines),
    [diffLines]
  );

  return (
    <section className="resume-compare-panel">
      <header className="resume-compare-toolbar">
        <div>
          <h1>版本对比</h1>
          <p>以 Git 审核形式标注两个简历版本之间的增删改动。</p>
        </div>
        <div className="resume-compare-selects">
          <label>
            对比基准
            <Select
              value={baseResume?.id}
              onChange={onBaseChange}
              options={resumeOptions}
            />
          </label>
          <label>
            目标版本
            <Select
              value={targetResume?.id}
              onChange={onTargetChange}
              options={resumeOptions}
            />
          </label>
        </div>
      </header>

      <div className="resume-compare-grid">
        <EditableDiffPane
          label="基准版本"
          markers={lineMarkers.base}
          onChange={(value) => onResumeChange?.(baseResume?.id, value)}
          resume={baseResume}
          side="base"
        />
        <EditableDiffPane
          label="目标版本"
          markers={lineMarkers.target}
          onChange={(value) => onResumeChange?.(targetResume?.id, value)}
          resume={targetResume}
          side="target"
        />
      </div>

      <div className="resume-diff-summary">
        <span>
          <b>{diffLines.filter((line) => line.type === "added").length}</b>{" "}
          新增
        </span>
        <span>
          <b>{diffLines.filter((line) => line.type === "removed").length}</b>{" "}
          删除
        </span>
        <span>
          <b>{diffLines.filter((line) => line.type === "context").length}</b>{" "}
          保留
        </span>
      </div>
    </section>
  );
}

function EditableDiffPane({ label, markers, onChange, resume, side }) {
  const lines = String(resume?.resume || "").split("\n");

  return (
    <article className={`resume-diff-pane ${side}`}>
      <header>
        <div>
          <h2>{label}</h2>
          <p>{resume?.title || resume?.version || "未命名简历"}</p>
        </div>
        <span>{lines.length} 行</span>
      </header>

      <div className="resume-code-editor">
        <div className="resume-code-gutter" aria-hidden="true">
          {lines.map((_, index) => {
            const marker = markers[index] || {
              sign: " ",
              type: "context",
            };

            return (
              <span className={marker.type} key={index}>
                <b>{marker.sign}</b>
                {index + 1}
              </span>
            );
          })}
        </div>
        <textarea
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          value={resume?.resume || ""}
        />
      </div>
    </article>
  );
}

function createLineMarkers(diffLines) {
  const markers = {
    base: [],
    target: [],
  };

  diffLines.forEach((line) => {
    if (line.type === "added") {
      markers.target.push({ sign: "+", type: "added" });
      return;
    }

    if (line.type === "removed") {
      markers.base.push({ sign: "-", type: "removed" });
      return;
    }

    markers.base.push({ sign: " ", type: "context" });
    markers.target.push({ sign: " ", type: "context" });
  });

  return markers;
}
