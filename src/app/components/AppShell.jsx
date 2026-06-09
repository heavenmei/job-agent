"use client";

import {
  AppstoreOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ConfigProvider, Menu, theme } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    key: "dashboard",
    label: "控制台",
    icon: <SearchOutlined style={{ fontSize: "1.5rem" }} />,
  },
  {
    href: "/jobs",
    key: "jobs",
    label: "岗位列表",
    icon: <AppstoreOutlined style={{ fontSize: "1.5rem" }} />,
  },
  {
    href: "/resume",
    key: "resume",
    label: "AI改简历",
    icon: <FileTextOutlined style={{ fontSize: "1.5rem" }} />,
  },
  {
    href: "/analyze",
    key: "analyze",
    label: "匹配分析",
    icon: <BarChartOutlined style={{ fontSize: "1.5rem" }} />,
  },
];

export function AppShell({ children }) {
  const pathname = usePathname();

  const selected =
    navItems.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    )?.key ?? "dashboard";

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 6,
          colorPrimary: "#5f55d8",
          colorBgContainer: "#ffffff",
          colorBorder: "#e1e6f0",
          colorTextBase: "#202434",
          colorBgSolid: "#5f55d8",
          fontFamily:
            'Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
          fontSize: 12,
        },
        components: {
          Upload: { colorFillAlter: "#f1f1f1" },
          Button: { controlHeight: 32, paddingInline: 12 },
          Input: { controlHeight: 34 },
          Select: { controlHeight: 34 },
          Tabs: { horizontalMargin: "0", titleFontSize: 13 },
        },
      }}
    >
      <main className="flex h-screen bg-app-bg text-app-fg overflow-hidden">
        <aside className="w-60 border-r border-app-border bg-surface px-3 py-5 shadow-[8px_0_24px_rgba(29,35,54,0.04)] max-[900px]:static">
          <div className="flex items-center gap-3 px-2 pb-5">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-primary text-xl font-extrabold text-white">
              JA
            </span>
            <div>
              <h1 className="font-bold">Job Agent</h1>
              <small className="block text-muted">AI 求职控制台</small>
            </div>
          </div>
          <Menu
            mode="inline"
            style={{
              borderInlineEnd: "none",
              fontWeight: 700,
              fontSize: "1rem",
            }}
            selectedKeys={[selected]}
            items={navItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: <Link href={item.href}>{item.label}</Link>,
            }))}
          />
        </aside>
        <section className="flex-1 p-4 overflow-auto">
          {children}
        </section>
      </main>
    </ConfigProvider>
  );
}
