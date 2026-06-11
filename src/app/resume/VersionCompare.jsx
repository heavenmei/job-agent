"use client";

import { Select } from "antd";
import { useMemo } from "react";

export default function VersionCompare({
  baseResume,
  onBaseChange,
  onTargetChange,
  resumeItems,
  targetResume,
}) {
  const diffRows = useMemo(
    () => createDiffRows(baseResume?.resume || "", targetResume?.resume || ""),
    [baseResume?.resume, targetResume?.resume]
  );
  const resumeOptions = resumeItems.map((item) => ({
    label: `${item.title || item.version || "未命名简历"} · ${
      item.updated || "未更新"
    }`,
    value: item.id,
  }));
  const addedCount = diffRows.filter((row) => row.type === "added").length;
  const removedCount = diffRows.filter((row) => row.type === "removed").length;
  const changedCount = diffRows.filter((row) => row.type === "changed").length;
  const contextCount = diffRows.filter((row) => row.type === "context").length;

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
        <DiffColumn
          label="基准版本"
          resume={baseResume}
          rows={diffRows}
          side="base"
        />
        <DiffColumn
          label="目标版本"
          resume={targetResume}
          rows={diffRows}
          side="target"
        />
      </div>

      <div className="resume-diff-summary">
        <span>
          <b>{addedCount}</b> 新增
        </span>
        <span>
          <b>{removedCount}</b> 删除
        </span>
        <span>
          <b>{changedCount}</b> 修改
        </span>
        <span>
          <b>{contextCount}</b> 保留
        </span>
      </div>
    </section>
  );
}

function DiffColumn({ label, resume, rows, side }) {
  const lineCount = String(resume?.resume || "").split("\n").length;

  return (
    <article className={`resume-diff-pane ${side}`}>
      <header>
        <div>
          <h2>{label}</h2>
          <p>{resume?.title || resume?.version || "未命名简历"}</p>
        </div>
        <span>{lineCount} 行</span>
      </header>

      <div className="resume-diff-view">
        {rows.length ? (
          rows.map((row, index) => {
            const cell = side === "base" ? row.base : row.target;
            const lineNumber = side === "base" ? row.baseLine : row.targetLine;
            const sign = side === "base" ? row.baseSign : row.targetSign;
            const cellType = getCellType(row.type, side);

            return (
              <div
                className={`resume-diff-row ${row.type} ${cellType}`}
                key={`${side}-${index}`}
              >
                <span className="resume-diff-sign">{sign}</span>
                <span className="resume-diff-line-number">
                  {lineNumber || ""}
                </span>
                <code>{cell || " "}</code>
              </div>
            );
          })
        ) : (
          <div className="resume-diff-empty">两个版本目前没有差异。</div>
        )}
      </div>
    </article>
  );
}

function createDiffRows(baseText, targetText) {
  const baseLines = String(baseText || "").split("\n");
  const targetLines = String(targetText || "").split("\n");
  const steps = createDiffSteps(baseLines, targetLines);
  const rows = [];
  let pendingRemoval = null;
  let baseLine = 1;
  let targetLine = 1;

  steps.forEach((step) => {
    if (step.type === "removed") {
      if (pendingRemoval) {
        rows.push(createRemovedRow(pendingRemoval, baseLine));
        baseLine += 1;
      }
      pendingRemoval = step;
      return;
    }

    if (step.type === "added") {
      if (pendingRemoval) {
        rows.push(
          createChangedRow(
            pendingRemoval,
            step,
            baseLine,
            targetLine
          )
        );
        pendingRemoval = null;
        baseLine += 1;
        targetLine += 1;
        return;
      }

      rows.push(createAddedRow(step, targetLine));
      targetLine += 1;
      return;
    }

    if (pendingRemoval) {
      rows.push(createRemovedRow(pendingRemoval, baseLine));
      pendingRemoval = null;
      baseLine += 1;
    }

    rows.push(createContextRow(step, baseLine, targetLine));
    baseLine += 1;
    targetLine += 1;
  });

  if (pendingRemoval) {
    rows.push(createRemovedRow(pendingRemoval, baseLine));
  }

  return rows;
}

function createDiffSteps(baseLines, targetLines) {
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

  const steps = [];
  let baseIndex = 0;
  let targetIndex = 0;

  while (baseIndex < baseLines.length && targetIndex < targetLines.length) {
    if (baseLines[baseIndex] === targetLines[targetIndex]) {
      steps.push({ type: "context", text: baseLines[baseIndex] });
      baseIndex += 1;
      targetIndex += 1;
    } else if (
      lcs[baseIndex + 1][targetIndex] >= lcs[baseIndex][targetIndex + 1]
    ) {
      steps.push({ type: "removed", text: baseLines[baseIndex] });
      baseIndex += 1;
    } else {
      steps.push({ type: "added", text: targetLines[targetIndex] });
      targetIndex += 1;
    }
  }

  while (baseIndex < baseLines.length) {
    steps.push({ type: "removed", text: baseLines[baseIndex] });
    baseIndex += 1;
  }

  while (targetIndex < targetLines.length) {
    steps.push({ type: "added", text: targetLines[targetIndex] });
    targetIndex += 1;
  }

  return steps;
}

function createContextRow(step, baseLine, targetLine) {
  return {
    type: "context",
    base: step.text,
    target: step.text,
    baseLine,
    targetLine,
    baseSign: " ",
    targetSign: " ",
  };
}

function createAddedRow(step, targetLine) {
  return {
    type: "added",
    base: "",
    target: step.text,
    baseLine: null,
    targetLine,
    baseSign: " ",
    targetSign: "+",
  };
}

function createRemovedRow(step, baseLine) {
  return {
    type: "removed",
    base: step.text,
    target: "",
    baseLine,
    targetLine: null,
    baseSign: "-",
    targetSign: " ",
  };
}

function createChangedRow(baseStep, targetStep, baseLine, targetLine) {
  return {
    type: "changed",
    base: baseStep.text,
    target: targetStep.text,
    baseLine,
    targetLine,
    baseSign: "-",
    targetSign: "+",
  };
}

function getCellType(type, side) {
  if (type === "changed") {
    return side === "base" ? "removed" : "added";
  }

  if (type === "removed" && side === "base") return "removed";
  if (type === "added" && side === "target") return "added";
  return "context";
}
