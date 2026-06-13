import { getAsOf, getSignalHorizonBenchmarkResults } from "@/lib/server-data";

export async function GET() {
  const [asOf, results] = await Promise.all([
    getAsOf(),
    getSignalHorizonBenchmarkResults(),
  ]);
  return Response.json({ as_of_date: asOf, results });
}
