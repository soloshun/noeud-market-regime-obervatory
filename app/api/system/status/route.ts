import { getDataSourceStatus } from "@/lib/server-data";

export async function GET() {
  return Response.json(getDataSourceStatus());
}
