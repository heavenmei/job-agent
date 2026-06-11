"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  MessageOutlined,
  RightCircleOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Tag } from "antd";
import { AppShell } from "./components/AppShell";
import { categoryTabs, jobs, sourceCards } from "./config";
import "./page.css";

const featureCards = [
  {
    key: "jobs",
    title: "全网岗位搜索",
    description:
      "统一接入官网、国聘、Boss、智联等来源，按专业、学历、城市和匹配度快速筛选。",
    href: "/jobs",
    icon: <SearchOutlined />,
    accent: "violet",
    bullets: ["多来源同步检索", "筛选条件可组合", "岗位详情支持一键分析"],
  },
  {
    key: "resume",
    title: "AI 改简历",
    description:
      "上传或编辑多版本简历，围绕目标岗位持续改写、对比和沉淀可复用表达。",
    href: "/resume",
    icon: <FileTextOutlined />,
    accent: "teal",
    bullets: ["多版本管理", "MD 编辑与对比", "岗位优化简历沉淀"],
  },
  {
    key: "analyze",
    title: "匹配分析",
    description:
      "把简历和 JD 放在一起，产出匹配度、ATS 命中情况、优劣势与改写建议。",
    href: "/analyze",
    icon: <BarChartOutlined />,
    accent: "green",
    bullets: ["匹配度评分", "ATS 关键词拆解", "改写建议可直接应用"],
  },
  {
    key: "interview",
    title: "面试素材库",
    description:
      "基于简历和岗位 JD 生成一问一答一建议，帮助面试准备更聚焦、更落地。",
    href: "/interview",
    icon: <MessageOutlined />,
    accent: "orange",
    bullets: ["高频问题整理", "参考回答生成", "素材支持下载"],
  },
];

const workflowSteps = [
  {
    title: "先找方向",
    text: "从多来源岗位池里找到值得投的目标岗位。",
  },
  {
    title: "再改材料",
    text: "针对目标岗位准备简历版本，保留每轮优化结果。",
  },
  {
    title: "看清差距",
    text: "用匹配分析找出 JD 缺口、ATS 风险和补强重点。",
  },
  {
    title: "准备面试",
    text: "自动生成问答素材和准备建议，减少临场慌乱。",
  },
];

export default function DashboardPage() {
  const averageMatch = Math.round(
    jobs.reduce((sum, job) => sum + job.match, 0) / jobs.length
  );
  const topCategories = categoryTabs.slice(0, 4);
  const sourcePreview = sourceCards.slice(0, 6);

  return (
    <AppShell>
      <div className="dashboard-home">
        <section className="home-hero">
          <Image
            alt="Job Agent 产品首页展示图"
            className="home-hero-image"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            src="/image/dashboard-home-hero.png"
          />
          <div className="home-hero-overlay" />
          <div className="home-hero-content">
            <Tag variant="filled" className="home-hero-tag">
              Job Agent
            </Tag>
            <h1>把找工作这件事，整理成一条清晰、连续、可复用的工作流</h1>
            <p>
              从岗位搜索、简历优化，到匹配分析和面试准备，这里把求职里最耗时也最容易断开的环节接成了一个完整系统。
            </p>

            <div className="home-hero-actions">
              <Button
                href="/jobs"
                icon={<SearchOutlined />}
                size="large"
                type="primary"
              >
                开始找岗位
              </Button>
              <Button
                href="/resume"
                icon={<FileSearchOutlined />}
                size="large"
              >
                进入简历中心
              </Button>
            </div>

            <dl className="home-hero-metrics">
              <div>
                <dt>{sourceCards.length}</dt>
                <dd>接入岗位来源</dd>
              </div>
              <div>
                <dt>{averageMatch}%</dt>
                <dd>示例平均匹配度</dd>
              </div>
              <div>
                <dt>{featureCards.length + 1}</dt>
                <dd>关键求职模块</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="home-band">
          <div className="home-band-head">
            <div>
              <span className="home-eyebrow">核心能力</span>
              <h2>不是单点工具，而是一整套求职工作台</h2>
            </div>
            <p>
              首页先把全貌讲清楚，真正使用时再分别进入各个页面继续深挖。
            </p>
          </div>

          <div className="home-feature-grid">
            {featureCards.map((feature) => (
              <article className={`home-feature-card ${feature.accent}`} key={feature.key}>
                <div className="home-feature-icon">{feature.icon}</div>
                <div className="home-feature-copy">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <ul>
                  {feature.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link className="home-feature-link" href={feature.href}>
                  进入模块
                  <ArrowRightOutlined />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="home-band home-band-alt">
          <div className="home-band-head">
            <div>
              <span className="home-eyebrow">使用路径</span>
              <h2>用一条顺手的节奏，把求职动作串起来</h2>
            </div>
            <Button href="/analyze" icon={<RightCircleOutlined />}>
              直接看匹配分析
            </Button>
          </div>

          <div className="home-workflow">
            {workflowSteps.map((step, index) => (
              <article className="home-workflow-step" key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-band">
          <div className="home-showcase-grid">
            <article className="home-showcase-panel">
              <div className="home-panel-head">
                <div>
                  <span className="home-eyebrow">岗位覆盖</span>
                  <h2>岗位搜索从源头开始更完整</h2>
                </div>
                <Button href="/jobs" icon={<SearchOutlined />} type="primary">
                  查看岗位列表
                </Button>
              </div>

              <div className="home-source-grid">
                {sourcePreview.map((source) => (
                  <div className="home-source-item" key={source.id}>
                    <Image
                      alt={`${source.name} logo`}
                      height={32}
                      src={source.logo}
                      width={32}
                    />
                    <div>
                      <strong>{source.name}</strong>
                      <span>{source.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="home-showcase-panel">
              <div className="home-panel-head">
                <div>
                  <span className="home-eyebrow">求职对象</span>
                  <h2>不同专业与目标方向都能继续细化</h2>
                </div>
                <Button href="/resume" icon={<FileTextOutlined />}>
                  开始准备简历
                </Button>
              </div>

              <div className="home-chip-list">
                {topCategories.map((tab) => (
                  <span className="home-chip" key={tab.value}>
                    {tab.label}
                  </span>
                ))}
                <span className="home-chip muted">更多方向可在岗位页继续筛选</span>
              </div>

              <div className="home-mini-stats">
                <div>
                  <strong>{jobs.length}</strong>
                  <span>示例岗位</span>
                </div>
                <div>
                  <strong>{new Set(jobs.map((job) => job.city)).size}</strong>
                  <span>覆盖城市</span>
                </div>
                <div>
                  <strong>{new Set(jobs.map((job) => job.degree)).size}</strong>
                  <span>学历筛选</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="home-cta">
          <div>
            <span className="home-eyebrow">最后一站</span>
            <h2>模型、分析、面试准备都已经连好了</h2>
            <p>
              如果你已经有简历，现在最直接的开始方式是上传简历，选一个岗位，然后一路把分析和面试素材都跑出来。
            </p>
          </div>
          <div className="home-cta-actions">
            <Button
              href="/interview"
              icon={<MessageOutlined />}
              size="large"
              type="primary"
            >
              去生成面试素材
            </Button>
            <Button href="/setting" icon={<SettingOutlined />} size="large">
              检查模型设置
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
