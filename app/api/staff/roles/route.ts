import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/staff";
import { prisma } from "@/lib/prisma";

const roleInput = z.object({
  discordRoleId: z.string().regex(/^\d{17,20}$/, "Enter a valid Discord role ID."),
  name: z.string().trim().min(1).max(100),
  permissions: z.array(z.string().regex(/^[a-z]+\.[a-z_]+$/)).min(1),
});

export async function POST(request: NextRequest) {
  await requirePermission("staff.manage_roles");
  const parsed = roleInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid role configuration." }, { status: 400 });
  const role = await prisma.staffRole.upsert({
    where: { discordRoleId: parsed.data.discordRoleId },
    update: { name: parsed.data.name, permissions: { deleteMany: {}, create: parsed.data.permissions.map((permission) => ({ permission })) } },
    create: { discordRoleId: parsed.data.discordRoleId, name: parsed.data.name, permissions: { create: parsed.data.permissions.map((permission) => ({ permission })) } },
    include: { permissions: true },
  });
  return NextResponse.json({ id: role.id, discordRoleId: role.discordRoleId, permissions: role.permissions.map((item) => item.permission) });
}

export async function DELETE(request: NextRequest) {
  await requirePermission("staff.manage_roles");
  const roleId = new URL(request.url).searchParams.get("roleId");
  if (!roleId || !/^\d{17,20}$/.test(roleId)) return NextResponse.json({ error: "A valid role ID is required." }, { status: 400 });
  await prisma.staffRole.delete({ where: { discordRoleId: roleId } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
