import { resumeStorageKey } from "./config";
import { readStorage, writeStorage } from "./util";

export function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function createResumeItem(index, resume = "", overrides = {}) {
  return {
    id: `resume-${Date.now()}-${index}`,
    title: index === 1 ? "原始的简历" : `简历 ${index}`,
    version: index === 1 ? "原始的我" : "新建简历",
    role: "",
    updated: getToday(),
    resume,
    highlight: [],
    matchAnalysis: {},
    active: index === 1,
    ...overrides,
  };
}

export function createInitialResumeItem() {
  return {
    id: "resume-initial",
    title: "原始的简历",
    version: "原始的我",
    role: "",
    updated: "",
    resume: "",
    highlight: [],
    matchAnalysis: {},
    active: true,
  };
}

export function createInitialResumeItems() {
  return [createInitialResumeItem()];
}

export function normalizeResumeItems(items) {
  const sourceItems =
    Array.isArray(items) && items.length > 0 ? items : createInitialResumeItems();
  const activeIndex = Math.max(
    0,
    sourceItems.findIndex((item) => item.active)
  );

  return sourceItems.map((item, index) => ({
    ...createResumeItem(index + 1),
    ...item,
    id: item.id || `resume-${index + 1}`,
    active: index === activeIndex,
    resume: item.resume || "",
    highlight: Array.isArray(item.highlight) ? item.highlight : [],
    matchAnalysis: normalizeMatchAnalysis(item.matchAnalysis),
  }));
}

function normalizeMatchAnalysis(matchAnalysis) {
  if (!matchAnalysis || typeof matchAnalysis !== "object") return {};

  if (matchAnalysis.match && matchAnalysis.dimensions) {
    return {
      legacy: {
        key: "legacy",
        title: "历史分析结果",
        jd: "",
        createdAt: "",
        analysis: matchAnalysis,
      },
    };
  }

  return matchAnalysis;
}

export function readResumeItems() {
  const savedItems = readStorage(resumeStorageKey);

  if (!savedItems) return createInitialResumeItems();

  try {
    return normalizeResumeItems(JSON.parse(savedItems));
  } catch {
    return createInitialResumeItems();
  }
}

export function persistResumeItems(items) {
  writeStorage(resumeStorageKey, JSON.stringify(normalizeResumeItems(items)));
}

export function getActiveResumeItem(items = readResumeItems()) {
  return items.find((item) => item.active) || items[0] || createInitialResumeItem();
}

export function readActiveResume() {
  return getActiveResumeItem().resume || "";
}

export function setActiveResumeItem(items, activeId) {
  return normalizeResumeItems(
    items.map((item) => ({
      ...item,
      active: item.id === activeId,
    }))
  );
}

export function updateResumeItem(items, itemId, updates) {
  return normalizeResumeItems(
    items.map((item) =>
      item.id === itemId ? { ...item, ...updates, updated: getToday() } : item
    )
  );
}

export function upsertActiveResume(resume, updates = {}) {
  const items = readResumeItems();
  const activeItem = getActiveResumeItem(items);
  const nextItems = updateResumeItem(items, activeItem.id, {
    ...updates,
    resume: resume || "",
  });

  persistResumeItems(nextItems);
  return nextItems;
}
