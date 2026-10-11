import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { ApiError, tokenMatches } from "@/lib/owner-api-core";
import { matchRoute, ownerRoutes } from "@/lib/owner-ops";

// The owner's JSON API (see README). Authenticated by OWNER_API_TOKEN, never by the panel's session cookie.
export const dynamic = "force-dynamic";

const reply = (status: number, message: string) => NextResponse.json({ message }, { status, headers: { "cache-control": "no-store" } });

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  // Off unless a token is configured, and indistinguishable from a missing route to everyone else.
  if (!env.OWNER_API_TOKEN) return reply(404, "Not found");
  if (!tokenMatches(request.headers.get("authorization"), env.OWNER_API_TOKEN)) return reply(401, "Unauthorized");

  const { path } = await params;
  const found = matchRoute(ownerRoutes, request.method, "/" + path.join("/"));
  if (!found.route) return reply(found.pathMatched ? 405 : 404, found.pathMatched ? "Method not allowed" : "Not found");

  const body = request.method === "GET" ? null : await request.json().catch(() => null);
  try {
    const result = await found.route.handler({ params: found.params, query: request.nextUrl.searchParams, body });
    if (request.method !== "GET") console.info("[owner-api]", request.method, "/" + path.join("/"), "ok");
    return NextResponse.json(result ?? { ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) return reply(error.status, error.message);
    console.error("[owner-api]", request.method, "/" + path.join("/"), error);
    return reply(500, "Internal error");
  }
}

export { handle as GET, handle as POST, handle as PATCH };
