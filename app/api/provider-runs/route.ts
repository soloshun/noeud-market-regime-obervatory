import { NextResponse } from "next/server";

import { getProviderRuns } from "@/lib/server-data";

export async function GET(req: Request) {
  const pair = new URL(req.url).searchParams.get("pair") ?? undefined;
  return NextResponse.json({ runs: await getProviderRuns(pair ?? undefined) });
}
