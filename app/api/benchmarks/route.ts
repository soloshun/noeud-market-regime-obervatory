import { getAsOf, getBenchmarkResults } from "@/lib/server-data";

export async function GET() {
  const [asOf, results] = await Promise.all([getAsOf(), getBenchmarkResults()]);
  return Response.json({ as_of_date: asOf, results });
}
