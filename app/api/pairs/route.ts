import { NextResponse } from "next/server";

import { getAsOf, getSupportedPairs } from "@/lib/server-data";

export async function GET() {
  return NextResponse.json({
    as_of_date: await getAsOf(),
    pairs: await getSupportedPairs(),
  });
}
