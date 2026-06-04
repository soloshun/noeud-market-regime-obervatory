import { NextResponse } from "next/server";

import { getAsOf, getLatestSnapshots, getSupportedPairs } from "@/lib/server-data";
import type { RegimeOverviewResponse } from "@/lib/types";

export async function GET() {
  const body: RegimeOverviewResponse = {
    as_of_date: await getAsOf(),
    supported_pairs: await getSupportedPairs(),
    snapshots: await getLatestSnapshots(),
  };
  return NextResponse.json(body);
}
