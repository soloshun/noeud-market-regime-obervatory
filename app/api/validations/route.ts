import { NextResponse } from "next/server";

import { getAllValidations, getAsOf } from "@/lib/mock/dataset";

export function GET() {
  return NextResponse.json({ as_of_date: getAsOf(), runs: getAllValidations() });
}
