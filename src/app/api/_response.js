import { NextResponse } from "next/server";

export function json(data, init) {
  return NextResponse.json(data, init);
}

export async function readJson(request) {
  const text = await request.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Invalid JSON body");
    error.status = 400;
    throw error;
  }
}

export function errorJson(error) {
  const status = error.status || error.statusCode || 500;
  return json(
    error.payload || {
      error: status >= 500 ? "Internal server error" : error.message,
      message: error.message,
    },
    { status }
  );
}
