export function readStorage(key) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) || "";
}

export function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}
