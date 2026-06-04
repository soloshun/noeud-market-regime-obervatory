import { NextResponse } from "next/server";

import { getAsOf, getLatestSnapshots, getSupportedPairs } from "@/lib/mock/dataset";
import type { RegimeOverviewResponse } from "@/lib/types";

export function GET() {
  const body: RegimeOverviewResponse = {
    as_of_date: getAsOf(),
    supported_pairs: getSupportedPairs(),
    snapshots: getLatestSnapshots(),
  };
  return NextResponse.json(body);
}
