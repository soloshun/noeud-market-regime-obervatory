import { NextResponse } from "next/server";

import { getHistory, getSnapshot } from "@/lib/server-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  if (!(await getSnapshot(pair))) {
    return NextResponse.json({ detail: `Unsupported pair: ${pair}` }, { status: 404 });
  }
  return NextResponse.json({
    pair: pair.toUpperCase(),
    points: await getHistory(pair),
  });
}
