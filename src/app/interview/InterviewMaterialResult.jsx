"use client";

import {
  DownloadOutlined,
  MessageOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Button, Empty, Tag } from "antd";
import { useEffect, useState } from "react";

export default function InterviewMaterialResult({
  loading = false,
  materialResult,
  downloading = false,
  onDownload,
}) {
  if (loading) {
    return <InterviewLoadingState />;
  }

  if (!materialResult) {
    return (
      <div className="analyze-empty">
        <MessageOutlined />
        <h2>等待生成</h2>
        <p>选择简历和岗位 JD 后，这里会整理出一问一答一建议的面试素材。</p>
      </div>
    );
  }

  const materials = Array.isArray(materialResult.materials)
    ? materialResult.materials
    : [];

  if (!materials.length) {
    return <Empty description="当前结果里还没有可展示的面试素材" />;
  }

  return (
    <div className="analysis-result">
      <header className="interview-overview-card flex justify-between gap-8">
        <div className="flex flex-col gap-1">
          <h1>面试准备概览</h1>
          <p className="text-muted">{materialResult.overview?.title || "面试准备重点"}</p>
          <p className="text-muted">{materialResult.overview?.summary}</p>
        </div>
        <Button
          icon={<DownloadOutlined />}
          loading={downloading}
          onClick={onDownload}
          size="large"
          type="primary"
        >
          下载素材
        </Button>
      </header>

      <section className="interview-material-list">
        {materials.map((item, index) => (
          <article className="interview-material-card" key={`${item.question}-${index}`}>
            <header className="interview-material-header">
              <div className="interview-material-index">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div >
                <h3>{item.question}</h3>
                {item.focus ? <Tag color="purple">{item.focus}</Tag> : null}
              </div>
            </header>

            <div className="interview-material-body">
              <section className="panel interview-material-panel">
                <div className="interview-material-label">
                  <MessageOutlined />
                  <span>参考回答</span>
                </div>
                <p>{item.answer}</p>
              </section>

              <section className="panel interview-material-panel interview-material-panel-soft">
                <div className="interview-material-label">
                  <ReadOutlined />
                  <span>准备建议</span>
                </div>
                <p>{item.suggestion}</p>
              </section>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function InterviewLoadingState() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => (current < 10 ? current + 1 : current));
    }, 1500);

    return () => window.clearInterval(timer);
  }, []);

  const percent = step * 10;

  return (
    <div className="interview-loading">
      <div className="interview-loading-badge">{step}/10</div>
      <h2>正在生成面试素材</h2>
      <p>正在拆解岗位重点、组织提问方向，并生成一问一答一建议。</p>
      <div className="interview-loading-track">
        <div
          className="interview-loading-bar"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="interview-loading-grid">
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            className={index < step ? "done" : ""}
            key={index}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        ))}
      </div>
    </div>
  );
}
