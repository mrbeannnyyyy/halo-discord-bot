export async function thankApplicantForApplying(application: { id: string; applicantName: string; discordId: string }) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return;
  const dmChannel = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST", headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: application.discordId }),
  });
  if (!dmChannel.ok) { console.error("Applicant thank-you DM channel could not be opened."); return; }
  const channel = await dmChannel.json() as { id: string };
  const response = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [{ title: "Thank you for applying!", color: 0x7c85ff, description: `Hi ${application.applicantName}, we received your Halo application. Our team will review it carefully and contact you on Discord when there is an update.`, footer: { text: `Application ${application.id}` } }] }),
  });
  if (!response.ok) console.error("Applicant thank-you DM could not be delivered.");
}

async function sendDm(discordId: string, embed: Record<string, unknown>) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return false;
  const dm = await fetch("https://discord.com/api/v10/users/@me/channels", { method: "POST", headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ recipient_id: discordId }) });
  if (!dm.ok) return false;
  const channel = await dm.json() as { id: string };
  const message = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, { method: "POST", headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ embeds: [embed] }) });
  return message.ok;
}

export async function notifyInterviewAccepted(discordId: string, applicantName: string) {
  const sent = await sendDm(discordId, { title: "You have been selected for an interview", color: 0x7c85ff, description: `Hi ${applicantName}, congratulations — your Halo application has been accepted for an interview. We will send your date and time soon.` });
  if (!sent) console.error("Interview acceptance DM could not be delivered.");
}

export async function notifyInterviewScheduled(discordId: string, applicantName: string, date: Date, timezone: string, rescheduled: boolean) {
  const invite = process.env.INTERVIEW_SERVER_INVITE;
  const dateText = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: timezone }).format(date);
  const sent = await sendDm(discordId, { title: rescheduled ? "Your interview was rescheduled" : "Interview scheduled", color: 0x7c85ff, description: `Hi ${applicantName}, your Halo interview is ${rescheduled ? "now" : "scheduled"} for **${dateText} (${timezone})**.${invite ? `\n\nJoin the interview server: ${invite}` : ""}` });
  if (!sent) console.error("Interview schedule DM could not be delivered.");
}

export async function notifyInterviewDecision(discordId: string, applicantName: string, passed: boolean) {
  const text = passed ? `Hi ${applicantName}, congratulations! You have passed your Halo interview. A member of the team will contact you with next steps.` : `Hi ${applicantName}, thank you for taking the time to interview with Halo. After reviewing your interview, we will not be moving forward at this time.`;
  const sent = await sendDm(discordId, { title: passed ? "Interview outcome: passed" : "Interview outcome", color: passed ? 0xa9e9c2 : 0xff8c8c, description: text });
  if (!sent) console.error("Interview decision DM could not be delivered.");
}

export async function notifyInterviewCancelled(discordId: string, applicantName: string) {
  const sent = await sendDm(discordId, { title: "Interview cancelled", color: 0xff8c8c, description: `Hi ${applicantName}, your Halo interview has been cancelled. Please contact the team if you have questions.` });
  if (!sent) console.error("Interview cancellation DM could not be delivered.");
}
