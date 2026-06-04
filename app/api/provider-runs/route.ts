import { NextResponse } from "next/server";

import { getProviderRuns } from "@/lib/mock/dataset";

export function GET(req: Request) {
  const pair = new URL(req.url).searchParams.get("pair") ?? undefined;
  return NextResponse.json({ runs: getProviderRuns(pair ?? undefined) });
}
