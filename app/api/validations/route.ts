import { NextResponse } from "next/server";

import { getAllValidations, getAsOf, getValidationRuns } from "@/lib/server-data";

export async function GET(req: Request) {
  const scope = new URL(req.url).searchParams.get("scope");
  const runs = scope === "all" ? await getValidationRuns() : await getAllValidations();
  return NextResponse.json({ as_of_date: await getAsOf(), runs });
}
