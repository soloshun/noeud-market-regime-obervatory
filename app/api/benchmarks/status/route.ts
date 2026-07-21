import { getAsOf, getBenchmarkEvaluationStatuses } from "@/lib/server-data";

export async function GET() {
  const [asOf, statuses] = await Promise.all([
    getAsOf(),
    getBenchmarkEvaluationStatuses(),
  ]);
  return Response.json({ as_of_date: asOf, statuses });
}
