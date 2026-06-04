import { NextResponse } from "next/server";

import { getValidation } from "@/lib/server-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  const run = await getValidation(pair);
  if (!run) {
    return NextResponse.json(
      { detail: `No validation run for pair: ${pair}` },
      { status: 404 },
    );
  }
  return NextResponse.json(run);
}
