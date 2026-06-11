"use client";

import {
  ApiOutlined,
  KeyOutlined,
  ReloadOutlined,
  RobotOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  AutoComplete,
  Input,
  InputNumber,
  Select,
  Slider,
  Switch,
  Tag,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  defaultLlmSettings,
  llmModelOptions,
  llmProviderOptions,
  llmSettingsStorageKey,
} from "../config";
import {
  normalizeLlmSettings,
  readLlmSettingsFromStorage,
} from "../llmSettings";
import { removeStorage, writeStorage } from "../util";

export default function SettingPage() {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState(defaultLlmSettings);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const savedSettings = readLlmSettingsFromStorage();

      setSettings(savedSettings);
      form.setFieldsValue(savedSettings);
    });

    return () => {
      cancelled = true;
    };
  }, [form]);

  const previewItems = useMemo(
    () => [
      ["服务商", providerLabel(settings.provider)],
      ["模型", settings.model],
      ["API Key", maskApiKey(settings.apiKey)],
      ["温度", settings.temperature],
      ["Top P", settings.topP],
      ["最大输出", settings.maxTokens],
      ["超时", `${settings.timeout}s`],
    ],
    [settings]
  );

  function saveSettings(values) {
    const nextSettings = normalizeLlmSettings(values);

    writeStorage(llmSettingsStorageKey, JSON.stringify(nextSettings));
    setSettings(nextSettings);
    form.setFieldsValue(nextSettings);
    message.success("模型设置已保存");
  }

  function resetSettings() {
    removeStorage(llmSettingsStorageKey);
    setSettings(defaultLlmSettings);
    form.setFieldsValue(defaultLlmSettings);
    message.success("已恢复默认设置");
  }

  return (
    <AppShell>
      <div className="flex h-full flex-col gap-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-black">模型设置</h1>
            <p className="mt-1 text-[14px] font-bold text-muted">
              LLM Provider、模型参数和生成偏好
            </p>
          </div>
          <Tag color="purple" className="m-0 px-3 py-1 text-[13px] font-black">
            Local
          </Tag>
        </header>

        <div className="grid flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 overflow-auto rounded-[8px] border border-app-border bg-surface p-5 shadow-[0_12px_28px_rgba(29,35,54,0.06)]">
            <Form
              form={form}
              initialValues={defaultLlmSettings}
              layout="vertical"
              onFinish={saveSettings}
              onValuesChange={(_, values) =>
                setSettings(normalizeLlmSettings(values))
              }
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Form.Item
                  label="服务商"
                  name="provider"
                  rules={[{ required: true, message: "请选择服务商" }]}
                >
                  <Select options={llmProviderOptions} />
                </Form.Item>

                <Form.Item
                  label="模型"
                  name="model"
                  rules={[{ required: true, message: "请输入模型名称" }]}
                >
                  <AutoComplete
                    options={llmModelOptions}
                    filterOption={(inputValue, option) =>
                      option.value
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                  />
                </Form.Item>

                <Form.Item
                  className="md:col-span-2"
                  label="API Key"
                  name="apiKey"
                >
                  <Input.Password
                    autoComplete="off"
                    prefix={<KeyOutlined />}
                    placeholder="输入你的 API Key"
                  />
                </Form.Item>

                <Form.Item
                  className="md:col-span-2"
                  label="Base URL"
                  name="baseURL"
                  rules={[{ required: true, message: "请输入 Base URL" }]}
                >
                  <Input prefix={<ApiOutlined />} />
                </Form.Item>

                <Form.Item label="Temperature" name="temperature">
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    marks={{ 0: "0", 1: "1", 2: "2" }}
                  />
                </Form.Item>

                <Form.Item label="Top P" name="topP">
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    marks={{ 0: "0", 0.5: "0.5", 1: "1" }}
                  />
                </Form.Item>

                <Form.Item label="最大输出 Tokens" name="maxTokens">
                  <InputNumber
                    min={256}
                    max={32768}
                    step={256}
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item label="请求超时（秒）" name="timeout">
                  <InputNumber min={10} max={300} step={10} className="w-full" />
                </Form.Item>

                <Form.Item
                  label="启用 Thinking"
                  name="enableThinking"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>

              <footer className="mt-6 flex justify-end gap-3 border-t border-app-border pt-5">
                <Button icon={<ReloadOutlined />} onClick={resetSettings}>
                  恢复默认
                </Button>
                <Button htmlType="submit" icon={<SaveOutlined />} type="primary">
                  保存设置
                </Button>
              </footer>
            </Form>
          </section>

          <aside className="flex min-h-0 flex-col gap-4 overflow-auto">
            <section className="rounded-[8px] border border-app-border bg-surface p-5 shadow-[0_12px_28px_rgba(29,35,54,0.06)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-primary-soft text-[22px] text-primary">
                  <RobotOutlined />
                </span>
                <div>
                  <h2 className="text-[17px] font-black">当前配置</h2>
                  <p className="mt-1 text-[12px] font-bold text-muted">
                    {settings.enableThinking ? "Thinking 已启用" : "Thinking 关闭"}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-3">
                {previewItems.map(([label, value]) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-[6px] bg-surface-muted px-3 py-2"
                    key={label}
                  >
                    <dt className="font-bold text-muted">{label}</dt>
                    <dd className="m-0 truncate text-right font-black text-app-fg">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-[8px] border border-app-border bg-surface p-5 shadow-[0_12px_28px_rgba(29,35,54,0.06)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-[#ecfdf5] text-[22px] text-[#1c9b5f]">
                  <ThunderboltOutlined />
                </span>
                <div>
                  <h2 className="text-[17px] font-black">运行状态</h2>
                  <p className="mt-1 text-[12px] font-bold text-muted">
                    可使用本地 API Key 或服务端环境变量
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Tag color="green" className="m-0 w-fit px-3 py-1 font-black">
                  配置已本地保存
                </Tag>
                <p className="m-0 text-[13px] font-bold leading-[1.7] text-muted">
                  API Key 保存在浏览器本地；未配置时可继续由 DASHSCOPE_API_KEY 等服务端环境变量兜底。
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function providerLabel(value) {
  return (
    llmProviderOptions.find((option) => option.value === value)?.label ||
    value ||
    "未知"
  );
}

function maskApiKey(apiKey) {
  if (!apiKey) return "未配置";
  if (apiKey.length <= 8) return "已配置";

  return `****${apiKey.slice(-4)}`;
}
