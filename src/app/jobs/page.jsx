"use client";

import { SearchOutlined, StarFilled } from "@ant-design/icons";
import { Button, Drawer, Empty, Input, Spin, Switch, Table, Tag } from "antd";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AppShell } from "../components/AppShell";
import ResumeDisplay from "../components/ResumeDisplay";

import "./page.css";

const categoryTabs = [
  { label: "机械专业", value: "mechanical" },
  { label: "不限专业岗", value: "broad" },
  { label: "央国企", value: "stateOwned" },
  { label: "机械工程师", value: "mechanicalEngineer" },
  { label: "工艺工程师", value: "processEngineer" },
  { label: "产品开发工程师", value: "productEngineer" },
  { label: "机械设备行业", value: "equipment" },
  { label: "汽车行业", value: "automotive" },
  { label: "航空航天与国防行业", value: "aerospace" },
];

const filterRows = [
  { key: "cohort", label: "批次", values: ["26届"] },
  { key: "degree", label: "学历", values: ["本科可投", "只看本科"] },
  {
    key: "major",
    label: "专业",
    values: ["机械可投", "推荐机械", "明确要求机械", "修改"],
  },
  {
    key: "city",
    label: "城市",
    values: ["全国", "武汉", "上海", "深圳", "北京", "更多"],
  },
  { key: "match", label: "匹配度", values: ["不限", "高匹配"] },
  {
    key: "company",
    label: "公司",
    values: ["不限", "央国企", "大厂", "高信用", "高科技"],
  },
];

const defaultFilters = {
  category: "mechanical",
  cohort: "26届",
  degree: "本科可投",
  major: "推荐机械",
  city: "全国",
  match: "不限",
  company: "不限",
  keyword: "",
};

const sourceCards = [
  {
    id: "sasac",
    name: "国务院国资委",
    type: "国家发布",
    badge: "SASAC",
    color: "#d71920",
    logo: "/image/guozi_logo.png",
  },
  {
    id: "mohrss",
    name: "中国人社部",
    type: "国家发布",
    badge: "人社",
    color: "#d71920",
    logo: "/image/renshe_logo.png",
  },
  {
    id: "official",
    name: "企业官网",
    type: "官方发布",
    badge: "官网",
    color: "#4f46c8",
    logo: "/image/official_logo.png",
  },
  {
    id: "wechat",
    name: "微信公众号",
    type: "官方发布",
    badge: "微",
    color: "#07c160",
    logo: "/image/weixin_logo.png",
  },
  {
    id: "guopin",
    name: "国聘网",
    type: "求职平台",
    badge: "国聘",
    color: "#c8102e",
    logo: "/image/guopin_logo.png",
  },
  {
    id: "boss",
    name: "Boss直聘",
    type: "求职平台",
    badge: "BOSS",
    color: "#00b38a",
    logo: "/image/boss_logo.png",
  },
  {
    id: "job",
    name: "前程无忧",
    type: "求职平台",
    badge: "前程",
    color: "#f36f21",
    logo: "/image/51job_logo.png",
  },
  {
    id: "zhilian",
    name: "智联招聘",
    type: "求职平台",
    badge: "聘",
    color: "#1677ff",
    logo: "/image/zhilian_logo.png",
  },
  {
    id: "liepin",
    name: "猎聘网",
    type: "求职平台",
    badge: "猎聘",
    color: "#ff6b00",
    logo: "/image/liepin_logo.png",
  },
];

const apiSourceIds = new Set(["official", "guopin", "boss", "zhilian"]);

export default function JobsPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [enabledSources, setEnabledSources] = useState(
    () => new Set(sourceCards.map((source) => source.id))
  );
  const [selectedRows, setSelectedRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(filters);
    const apiSources = [...enabledSources].filter((id) => apiSourceIds.has(id));
    if (apiSources.length) params.set("sources", apiSources.join(","));
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    return params.toString();
  }, [enabledSources, filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/jobs?${queryString}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load jobs");
        return response.json();
      })
      .then((data) => {
        setRows(data.jobs || []);
        setTotal(data.total || 0);
        setPagination((current) => ({
          page: data.page || current.page,
          pageSize: data.pageSize || current.pageSize,
        }));
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setRows([]);
          setTotal(0);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [queryString]);

  const columns = useMemo(() => createColumns(), []);

  function updateFilter(key, value) {
    setLoading(true);
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function toggleSource(sourceId, checked) {
    setLoading(true);
    setEnabledSources((current) => {
      const next = new Set(current);
      if (checked) next.add(sourceId);
      else next.delete(sourceId);
      return next;
    });
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function openJobDrawer(job) {
    setDrawerOpen(true);
    setActiveJob(job);
    setDetailLoading(true);

    fetch(`/api/jobs/${job.id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load job detail");
        return response.json();
      })
      .then(setActiveJob)
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setDetailLoading(false));
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 ">
        <section className="rounded-lg border border-app-border bg-surface p-4 text-app-fg ">
          <ResumeDisplay
            mode="analysis"
            titleNode={
              <h1 className="text-xl font-black text-app-fg">AI分析简历结果</h1>
            }
            uploadClassName="flex w-full flex-col"
            uploadText="上传简历文件，AI替你全网找工作"
            uploadHint="针对你的情况，自动寻找最适合的职位，并持续监控"
          />
        </section>

        <section className="bg-surface rounded-lg overflow-hidden">
          <div className="relative flex justify-between items-end border-b border-border bg-app-bg">
            <div className="relative flex min-w-0 gap-1 overflow-x-auto scrollbar-none">
              {categoryTabs.map((tab) => (
                <button
                  className={
                    filters.category === tab.value
                      ? "h-8 flex-none rounded-t-[14px] border border-b-0 border-[#e0e4ef] bg-white px-3 text-base font-extrabold text-[#202434]"
                      : "h-8 flex-none rounded-t-[14px] border border-b-0 border-[#e0e4ef] bg-primary px-3 text-base font-extrabold text-white"
                  }
                  key={tab.value}
                  onClick={() => updateFilter("category", tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Input
              allowClear
              style={{
                width: 180,
                right: 2,
                marginLeft: 20,
              }}
              onChange={(event) => updateFilter("keyword", event.target.value)}
              placeholder="搜索岗位 / 公司"
              prefix={<SearchOutlined />}
              value={filters.keyword}
            />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 p-3">
            {filterRows.map((row) => (
              <div className="flex min-h-9 items-center gap-2" key={row.key}>
                <b className="text-[#5f55d8]">{row.label}：</b>
                {row.values.map((value) => (
                  <button
                    className={
                      filters[row.key] === value
                        ? "rounded-[5px] bg-[#ebe9ff] px-2 py-1 text-[#4f46c8]"
                        : "rounded-[5px] bg-transparent px-2 py-1 text-[#687085]"
                    }
                    key={value}
                    onClick={() => updateFilter(row.key, value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 p-3 max-[1100px]:grid-cols-1">
            <span className="self-center text-center font-bold leading-[1.55] tracking-[4px] text-primary [writing-mode:vertical-rl] max-[1100px]:text-left max-[1100px]:[writing-mode:initial]">
              岗位自动全网搜
            </span>
            <div className="flex flex-wrap gap-3">
              {sourceCards.map((source) => (
                <article
                  className="w-54 relative flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-border bg-surface-muted p-3"
                  key={source.id}
                >
                  <span
                    className="absolute left-0 top-0 h-1 w-full"
                    style={{ backgroundColor: source.color }}
                  />
                  <div className="flex gap-2 items-center">
                    <Image
                      alt={`${source.name} logo`}
                      className="h-9 w-9 object-contain"
                      height={36}
                      src={source.logo}
                      width={36}
                    />
                    <div>
                      <b className="block">{source.name}</b>
                      <small className="block text-[#687085]">
                        {source.type}
                      </small>
                    </div>
                  </div>
                  <Switch
                    className="ml-auto"
                    checked={enabledSources.has(source.id)}
                    onChange={(checked) => toggleSource(source.id, checked)}
                    size="small"
                  />
                </article>
              ))}
            </div>
          </div>

          <div className="analysis-table-wrap">
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={rows}
                locale={{ emptyText: <Empty description="暂无匹配岗位" /> }}
                pagination={{
                  current: pagination.page,
                  pageSize: pagination.pageSize,
                  total,
                  showSizeChanger: true,
                  pageSizeOptions: [10, 20, 50],
                  showTotal: (count, range) =>
                    `${range[0]}-${range[1]} / ${count}`,
                  onChange: (page, pageSize) => {
                    setLoading(true);
                    setPagination({ page, pageSize });
                  },
                }}
                rowKey="id"
                rowSelection={{
                  selectedRowKeys: selectedRows,
                  onChange: setSelectedRows,
                  columnWidth: 52,
                }}
                onRow={(record) => ({
                  onClick: (event) => {
                    if (event.target.closest(".ant-checkbox-wrapper")) return;
                    openJobDrawer(record);
                  },
                })}
                scroll={{ x: 1450, y: 750 }}
                size="middle"
                sticky
                title={() => (
                  <div className="table-title">
                    <span>共 {total} 个匹配岗位</span>
                    <span>已选择 {selectedRows.length} 个</span>
                  </div>
                )}
              />
            </Spin>
          </div>
        </section>
        <JobDrawer
          job={activeJob}
          loading={detailLoading}
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
        />
      </div>
    </AppShell>
  );
}

function JobDrawer({ job, loading, onClose, open }) {
  return (
    <Drawer
      className="job-detail-drawer"
      onClose={onClose}
      closable={{ placement: "end" }}
      open={open}
      placement="right"
      size={520}
      title={
        <header>
          <h2>{job?.title}</h2>
          <p>{job?.direction}</p>
        </header>
      }
    >
      <Spin spinning={loading}>
        {job ? (
          <div className="job-detail">
            <div className="flex gap-2">
              <Tag variant="solid">{job.degree}</Tag>
              <Tag variant="solid">{job.cohort}</Tag>
              <Tag variant="solid">{job.major}</Tag>
              <Tag variant="solid">{job.city}</Tag>
            </div>

            <div className="detail-source-row">
              <span>
                公司 <b>{job.company}</b>
              </span>
              <span>
                来源 <b>{job.sourceName}</b>
              </span>
              <span>
                发布 <b>{job.publishDate || job.publishedAt}</b>
              </span>
            </div>

            <section className="brand-card">
              <h3>品牌情报</h3>
              <div className="brand-company">
                <strong>{job.company}</strong>
                <span>{job.industry}</span>
              </div>
              <div className="detail-tags">
                {(job.tags || []).map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </section>

            <section className="requirements-card">
              <h3>岗位要求</h3>
              <ul>
                {(job.requirements || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <footer className="drawer-actions">
              <Button className=" w-1/2" type="primary" size="large">
                分析岗位匹配度
              </Button>
              <Button className=" w-1/2" size="large">
                前往投递
              </Button>
              <Button
                size="large"
                icon={<StarFilled />}
                shape="circle"
              ></Button>
            </footer>
          </div>
        ) : (
          <Empty description="请选择岗位" />
        )}
      </Spin>
    </Drawer>
  );
}

function createColumns() {
  return [
    { title: "更新", dataIndex: "update", width: 92 },
    {
      title: "标签",
      dataIndex: "tag",
      width: 86,
      render: (tag) => (
        <Tag
          color={tag === "国企" ? "red" : tag === "上市" ? "orange" : "blue"}
        >
          {tag}
        </Tag>
      ),
    },
    {
      title: "公司",
      dataIndex: "company",
      width: 180,
      render: (company) => <strong>{company}</strong>,
    },
    {
      title: "行业",
      dataIndex: "industry",
      width: 190,
      ellipsis: true,
    },
    {
      title: "公司信用分",
      dataIndex: "creditScore",
      width: 145,
      render: (score) => (
        <div className="credit-score">
          <i style={{ width: `${Math.min(score / 10, 100)}%` }} />
          <span>{score || "-"}</span>
        </div>
      ),
    },
    {
      title: "职位 <点击看详情>",
      dataIndex: "title",
      width: 230,
      ellipsis: true,
      render: (title, row) => (
        <span className="job-title-cell">
          <Tag
            color={
              row.sourceType === "official" || row.sourceType === "guopin"
                ? "purple"
                : "blue"
            }
          >
            {row.sourceType === "official" || row.sourceType === "guopin"
              ? "官"
              : "智"}
          </Tag>
          {title}
        </span>
      ),
    },
    {
      title: "人岗匹配度",
      dataIndex: "matchDegree",
      width: 140,
      render: (score) => (
        <span className="star-score">
          {[0, 1, 2, 3, 4].map((index) => (
            <StarFilled
              key={index}
              className={score >= (index + 1) * 18 ? "on" : ""}
            />
          ))}
        </span>
      ),
    },
    { title: "城市", dataIndex: "city", width: 130, ellipsis: true },
    { title: "学历", dataIndex: "degree", width: 92 },
    { title: "届数", dataIndex: "cohort", width: 100 },
    {
      title: "专业",
      dataIndex: "major",
      width: 330,
      ellipsis: true,
      render: (major) => <span className="major-cell">{major}</span>,
    },
  ];
}
