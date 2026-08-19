import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function staffAccess() {
  const user = await currentUser();
  if (!user) redirect("/auth/discord?next=%2Fdashboard");
  const guildId = process.env.STAFF_GUILD_ID;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !token) return { user, allowed: false, permissions: [] as string[] };

  const memberResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user.discordId}`, {
    headers: { Authorization: `Bot ${token}` }, cache: "no-store",
  });
  if (!memberResponse.ok) return { user, allowed: false, permissions: [] as string[] };
  const member = await memberResponse.json() as { roles: string[] };
  const roles = await prisma.staffRole.findMany({
    where: { discordRoleId: { in: member.roles } }, include: { permissions: true },
  });
  const permissions = [...new Set(roles.flatMap((role) => role.permissions.map((item) => item.permission)))];
  const bootstrapRoleId = process.env.INITIAL_ADMIN_DISCORD_ROLE_ID;
  const isBootstrapAdmin = Boolean(bootstrapRoleId && member.roles.includes(bootstrapRoleId));
  const allPermissions = ["applications.view", "applications.review", "applications.edit", "applications.accept", "applications.reject", "applications.delete", "applications.schedule_interview", "interviews.view", "interviews.manage", "interviews.schedule", "interviews.reschedule", "interviews.cancel", "interviews.complete", "website.view", "website.edit", "website.change_background", "website.manage_content", "staff.view", "staff.manage", "staff.manage_roles"];
  return { user, allowed: roles.length > 0 || isBootstrapAdmin, permissions: isBootstrapAdmin ? allPermissions : permissions, roleIds: roles.map((role) => role.discordRoleId) };
}

export async function requirePermission(permission: string) {
  const access = await staffAccess();
  if (!access.allowed || !access.permissions.includes(permission)) redirect("/access-denied");
  return access;
}
