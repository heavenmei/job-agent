"use client";

import {
  DownloadOutlined,
  MessageOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Button, Empty, Tag } from "antd";

export default function InterviewMaterialResult({
  materialResult,
  downloading = false,
  onDownload,
}) {
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
