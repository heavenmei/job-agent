import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import { errorJson, json } from "../../_response.js";
import { callLLM } from "../../_llm.js";

export const runtime = "nodejs";

const workerUrl = pathToFileURL(
  join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "dist",
    "pdf-parse",
    "web",
    "pdf.worker.mjs"
  )
).href;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      const error = new Error("请上传简历文件");
      error.status = 400;
      throw error;
    }

    const fileName = file.name || "resume.pdf";
    const fileType = file.type || "";
    const extension = fileName.split(".").pop()?.toLowerCase();

    if (fileType !== "application/pdf" && extension !== "pdf") {
      const error = new Error("当前仅支持解析 PDF 简历");
      error.status = 400;
      throw error;
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    PDFParse.setWorker(workerUrl);

    const parser = new PDFParse({ data: bytes });
    let result;
    try {
      result = await parser.getText({ pageJoiner: "\n\n" });
    } finally {
      await parser.destroy();
    }

    console.log("PDFParse done");

    const markdown = await toMarkdownWithLlm(result.text || "");

    return json({
      markdown,
      fileName,
      pages: result.pages?.length || result.total || null,
    });
  } catch (error) {
    return errorJson(error);
  }
}

function toMarkdown(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line, index) => {
      if (index === 0) return `# ${line}`;
      if (isSectionTitle(line)) return `\n## ${line}`;
      return line;
    })
    .join("\n");
}

async function toMarkdownWithLlm(text) {
  const fallback = () => toMarkdown(text);

  if (!process.env.DASHSCOPE_API_KEY || !text.trim()) return fallback();

  try {
    const markdown = await callLLM({
      messages: [
        {
          role: "system",
          content:
            "你是简历整理助手。把 PDF 抽取出的简历纯文本整理为干净的 Markdown，只保留原始信息，不编造、不点评。",
        },
        {
          role: "user",
          content: `请将以下简历文本转换为 Markdown。要求：姓名或标题使用一级标题，主要模块使用二级标题，列表项用短横线，删除页眉页脚和重复空白，只输出 Markdown。\n\n${text.slice(
            0,
            24000
          )}`,
        },
      ],
    });

    return markdown.trim() || fallback();
  } catch {
    return fallback();
  }
}

function isSectionTitle(line) {
  return (
    line.length <= 16 &&
    /^(个人信息|教育背景|工作经历|项目经历|实习经历|校园经历|技能|专业技能|自我评价|荣誉|证书|求职意向)/.test(
      line
    )
  );
}
