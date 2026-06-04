import { NextResponse } from "next/server";

import { getValidationsForPair } from "@/lib/server-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  const runs = await getValidationsForPair(pair);
  return NextResponse.json({ pair: pair.toUpperCase(), runs });
}
