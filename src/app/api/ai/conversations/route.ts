import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** The history list: newest first, without the message bodies. */
export async function GET() {
  if (!(await isOwner())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const rows = await db.aiConversation.findMany({ select: { id: true, title: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 200 });
  return NextResponse.json(rows, { headers: { "cache-control": "no-store" } });
}
