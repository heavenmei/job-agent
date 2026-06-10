"use client";

import { useState } from "react";
import {
  AppstoreOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { ConfigProvider, Menu, theme, Button, Layout } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Header, Footer, Sider, Content } = Layout;

const navItems = [
  {
    href: "/",
    key: "dashboard",
    label: "控制台",
    icon: <SearchOutlined />,
  },
  {
    href: "/jobs",
    key: "jobs",
    label: "岗位列表",
    icon: <AppstoreOutlined />,
  },
  {
    href: "/resume",
    key: "resume",
    label: "AI改简历",
    icon: <FileTextOutlined />,
  },
  {
    href: "/analyze",
    key: "analyze",
    label: "匹配分析",
    icon: <BarChartOutlined />,
  },
  {
    href: "/setting",
    key: "setting",
    label: "模型设置",
    icon: <SettingOutlined />,
  },
];

export function AppShell({ children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
          Select: { controlHeight: 34 },
          Tabs: { horizontalMargin: "0", titleFontSize: 13 },
        },
      }}
    >
      <Layout className="overflow-hidden h-screen bg-app-bg">
        <Sider
          width="10%"
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <div className="flex justify-center items-center gap-2 px-2 my-6">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-lg font-extrabold text-white">
              JA
            </span>
            {collapsed ? null : (
              <div>
                <h2 className="font-bold">Job Agent</h2>
                <small className="block text-muted">AI 求职控制台</small>
              </div>
            )}
          </div>

          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
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
        </Sider>
        <Content className="p-4 overflow-auto">{children}</Content>
      </Layout>
    </ConfigProvider>
  );
}
