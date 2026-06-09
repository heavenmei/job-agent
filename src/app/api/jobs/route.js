import { errorJson, json } from "../_response.js";
import { listJobs } from "./jobService.js";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    return json(await listJobs(searchParams));
  } catch (error) {
    return errorJson(error);
  }
}
