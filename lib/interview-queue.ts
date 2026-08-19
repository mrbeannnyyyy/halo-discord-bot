import { prisma } from "@/lib/prisma";

export async function syncInterviewQueue() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.INTERVIEW_QUEUE_CHANNEL_ID;
  if (!token || !channelId) return;
  const interviews = await prisma.interview.findMany({ where: { status: { in: ["SCHEDULED", "WAITING", "IN_PROGRESS"] }, scheduledFor: { gte: new Date() } }, orderBy: { scheduledFor: "asc" }, include: { application: { include: { applicant: true } } } });
  const lines = interviews.length ? interviews.map((item) => `<@${item.applicantDiscordId}> — <t:${Math.floor(item.scheduledFor.getTime() / 1000)}:f>`).join("\n") : "No upcoming interviews.";
  const body = { embeds: [{ title: "🎤 INTERVIEW QUEUE", color: 0x7c85ff, description: `**Upcoming interviews**\n${lines}`, footer: { text: "Halo interview operations" } }] };
  const headers = { Authorization: `Bot ${token}`, "Content-Type": "application/json" };
  const messages = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=100`, { headers, cache: "no-store" });
  if (!messages.ok) { console.error("Interview queue could not be read."); return; }
  const existing = (await messages.json() as { id: string; author: { bot: boolean }; embeds: { title?: string }[] }[]).find((message) => message.author.bot && message.embeds[0]?.title === "🎤 INTERVIEW QUEUE");
  const endpoint = existing ? `https://discord.com/api/v10/channels/${channelId}/messages/${existing.id}` : `https://discord.com/api/v10/channels/${channelId}/messages`;
  const result = await fetch(endpoint, { method: existing ? "PATCH" : "POST", headers, body: JSON.stringify(body) });
  if (!result.ok) console.error("Interview queue could not be updated.");
}
