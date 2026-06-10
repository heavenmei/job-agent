"use client";

import { Select } from "antd";
import { useEffect, useMemo, useState } from "react";

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

      <div className="resume-diff-view">
        {diffLines.length ? (
          diffLines.map((line, index) => (
            <div className={`resume-diff-line ${line.type}`} key={index}>
              <span className="resume-diff-sign">{line.sign}</span>
              <code>{line.text || " "}</code>
            </div>
          ))
        ) : (
          <div className="resume-diff-empty">两个版本内容一致</div>
        )}
      </div>
    </section>
  );
}
