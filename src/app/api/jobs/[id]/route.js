import { errorJson, json } from "../../_response.js";
import { getJob } from "../jobService.js";

export const runtime = "nodejs";

export async function GET(_request, context) {
  try {
    const { id } = await context.params;
    return json(await getJob(id));
  } catch (error) {
    return errorJson(error);
  }
}
