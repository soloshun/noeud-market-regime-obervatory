import { NextResponse } from "next/server";

import { getSnapshot } from "@/lib/mock/dataset";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  const snapshot = getSnapshot(pair);
  if (!snapshot) {
    return NextResponse.json({ detail: `Unsupported pair: ${pair}` }, { status: 404 });
  }
  return NextResponse.json(snapshot);
}
