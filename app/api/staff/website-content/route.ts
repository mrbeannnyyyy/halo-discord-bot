import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/staff";

const input = z.object({
  values: z.record(z.string().min(1).max(80), z.string().max(5_000)),
});

export async function PATCH(request: NextRequest) {
  await requirePermission("website.edit");
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid website content." }, { status: 400 });

  await prisma.$transaction(
    Object.entries(parsed.data.values).map(([key, value]) =>
      prisma.websiteContent.upsert({ where: { key }, update: { value }, create: { key, value } }),
    ),
  );
  return NextResponse.json({ ok: true });
}
