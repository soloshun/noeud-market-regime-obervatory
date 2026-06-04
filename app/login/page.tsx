import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ActivityIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/";
  const error = typeof params.error === "string" ? params.error : undefined;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (await verifySessionToken(token)) {
    redirect(nextPath.startsWith("/login") ? "/" : nextPath);
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Subtle dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_75%)]" />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ActivityIcon className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Regime Observatory</h1>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
              Deterministic FX market-regime engine and LLM validation. Internal use only.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription>Enter the shared key to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/auth/login" method="post" className="space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Shared key</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter the observatory key"
                  className="h-10"
                  required
                  autoFocus
                />
              </div>
              {error === "invalid" && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  That key did not match the configured observatory secret.
                </div>
              )}
              <Button type="submit" className="h-10 w-full font-medium">
                Enter observatory
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60">
          Noeud · Regime Observatory
        </p>
      </div>
    </main>
  );
}
