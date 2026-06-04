import { NextResponse } from "next/server";

import { getPrices, getSnapshot } from "@/lib/mock/dataset";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  if (!getSnapshot(pair)) {
    return NextResponse.json({ detail: `Unsupported pair: ${pair}` }, { status: 404 });
  }
  return NextResponse.json({ pair: pair.toUpperCase(), observations: getPrices(pair) });
}
