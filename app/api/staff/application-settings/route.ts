import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/staff";
const input = z.object({ applicationsOpen: z.boolean(), applicationOpenDate: z.string().datetime().nullable(), applicationCloseDate: z.string().datetime().nullable() });
export async function PATCH(request: NextRequest) { await requirePermission("website.edit"); const parsed = input.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid application settings." }, { status: 400 }); await prisma.$transaction(Object.entries(parsed.data).map(([key, value]) => prisma.websiteContent.upsert({ where: { key }, update: { value: value === null ? "" : String(value) }, create: { key, value: value === null ? "" : String(value) } }))); return NextResponse.json({ ok: true }); }
