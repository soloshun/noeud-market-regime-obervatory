import { NextResponse } from "next/server";

import { getAllValidations, getAsOf } from "@/lib/server-data";

export async function GET() {
  return NextResponse.json({
    as_of_date: await getAsOf(),
    runs: await getAllValidations(),
  });
}
