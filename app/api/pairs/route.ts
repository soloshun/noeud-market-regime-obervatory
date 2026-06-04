import { NextResponse } from "next/server";

import { getAsOf, getSupportedPairs } from "@/lib/mock/dataset";

export function GET() {
  return NextResponse.json({ as_of_date: getAsOf(), pairs: getSupportedPairs() });
}
