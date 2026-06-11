import { defaultLlmSettings, llmSettingsStorageKey } from "./config";
import { readStorage } from "./util";

export function normalizeLlmSettings(settings = {}) {
  return {
    ...defaultLlmSettings,
    ...settings,
    provider:
      typeof settings.provider === "string" && settings.provider.trim()
        ? settings.provider.trim()
        : defaultLlmSettings.provider,
    model:
      typeof settings.model === "string" && settings.model.trim()
        ? settings.model.trim()
        : defaultLlmSettings.model,
    apiKey: typeof settings.apiKey === "string" ? settings.apiKey.trim() : "",
    baseURL:
      typeof settings.baseURL === "string" && settings.baseURL.trim()
        ? settings.baseURL.trim()
        : defaultLlmSettings.baseURL,
    temperature: clampNumber(
      settings.temperature,
      0,
      2,
      defaultLlmSettings.temperature
    ),
    topP: clampNumber(settings.topP, 0, 1, defaultLlmSettings.topP),
    maxTokens: clampNumber(
      settings.maxTokens,
      256,
      32768,
      defaultLlmSettings.maxTokens
    ),
    timeout: clampNumber(settings.timeout, 10, 300, defaultLlmSettings.timeout),
    enableThinking: Boolean(settings.enableThinking),
  };
}

export function parseLlmSettings(value, fallback = defaultLlmSettings) {
  if (!value) return fallback;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return normalizeLlmSettings(parsed);
  } catch {
    return fallback;
  }
}

export function readSavedLlmSettings() {
  const savedSettings = readStorage(llmSettingsStorageKey);
  return savedSettings ? parseLlmSettings(savedSettings, null) : null;
}

export function readLlmSettingsFromStorage() {
  return readSavedLlmSettings() || defaultLlmSettings;
}

export function withLlmSettings(payload = {}) {
  const llmSettings = readSavedLlmSettings();
  return llmSettings ? { ...payload, llmSettings } : payload;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(max, Math.max(min, number));
}
