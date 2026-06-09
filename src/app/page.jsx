"use client";

import { Button, Input, Select, Switch } from "antd";
import { useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { JobTable } from "./components/JobTable";
import { filterOptions, jobs as allJobs, sources } from "./config";

export default function DashboardPage() {
  const [keyword, setKeyword] = useState("AI");
  const [city, setCity] = useState("全国");
  const [degree, setDegree] = useState("不限");

  const jobs = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return allJobs.filter((job) => {
      const haystack = `${job.title}${job.company}`.toLowerCase();
      return (
        (!term || haystack.includes(term)) &&
        (city === "全国" || job.city === city) &&
        (degree === "不限" || job.degree === degree)
      );
    });
  }, [city, degree, keyword]);

  const average = jobs.length
    ? Math.round(jobs.reduce((sum, job) => sum + job.match, 0) / jobs.length)
    : 0;

  return (
    <AppShell>
      <div className="panel-stack">
        <section className="dashboard-grid">
          <article className="workflow-card">
            <div className="section-head">
              <h1>实时工作流 Live Workflow</h1>
              <Button type="primary">目标：求职</Button>
            </div>
            <div className="timeline">
              <p>
                <time>19:58:11</time>
                <mark>SCAN</mark>全网职位检索启动，扫描 6 个来源
              </p>
              <p>
                <time>19:58:20</time>
                <mark>FILTER</mark>过滤外包、低匹配与重复岗位
              </p>
              <p>
                <time>19:58:36</time>
                <mark>RANK</mark>按简历关键词重新排序候选岗位
              </p>
            </div>
          </article>
          <div className="stat-list">
            <Stat label="今日节省时间" value="3.5h" delta="+12%" />
            <Stat label="已自动扫描" value="128" delta="+5%" />
            <Stat
              label="平均匹配度"
              value={`${average || 88}%`}
              delta={`${jobs.length} 个岗位`}
            />
          </div>
        </section>

        <section className="search-card">
          <div className="section-head">
            <h2>全网职位检索</h2>
            <Button type="primary">搜索岗位</Button>
          </div>
          <div className="search-row">
            <Input
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="岗位 / 公司 / 技能关键词"
              value={keyword}
            />
            <Select
              onChange={setCity}
              options={filterOptions.cities.map(toOption)}
              value={city}
            />
            <Select
              onChange={setDegree}
              options={filterOptions.degrees.map(toOption)}
              value={degree}
            />
          </div>
          <div className="source-grid">
            {sources.map((source) => (
              <article key={source.id}>
                <span className="source-logo">{source.name.slice(0, 1)}</span>
                <div>
                  <b>{source.name}</b>
                  <small>{source.type}</small>
                </div>
                <Switch defaultChecked size="small" />
              </article>
            ))}
          </div>
          <JobTable jobs={jobs} />
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, delta }) {
  return (
    <article>
      <span>{delta}</span>
      <b>{value}</b>
      <small>{label}</small>
    </article>
  );
}

function toOption(value) {
  return { label: value, value };
}
