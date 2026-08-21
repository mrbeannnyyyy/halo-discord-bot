import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/staff";
import { notifyInterviewAccepted, notifyInterviewCancelled, notifyInterviewDecision, notifyInterviewScheduled } from "@/lib/discord";
import { syncInterviewQueue } from "@/lib/interview-queue";

const updateInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("edit"), answers: z.array(z.string().trim().min(1).max(1000)).length(3), submittedAt: z.string().datetime() }),
  z.object({ action: z.literal("pass") }),
  z.object({ action: z.literal("decline") }),
  z.object({ action: z.literal("cancel_interview") }),
  z.object({ action: z.literal("schedule"), scheduledFor: z.string().datetime(), timezone: z.string().min(1).max(100), notes: z.string().max(2000).optional() }),
]);
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const input = updateInput.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  const { id } = await params;
  if (input.data.action === "edit") {
    const edit = input.data;
    await requirePermission("applications.edit");
    const application = await prisma.application.findUnique({ where: { id }, include: { answers: { orderBy: { questionKey: "asc" } } } });
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    await prisma.$transaction([prisma.application.update({ where: { id }, data: { submittedAt: new Date(edit.submittedAt) } }), ...application.answers.map((answer, index) => prisma.applicationAnswer.update({ where: { id: answer.id }, data: { value: edit.answers[index] || answer.value } }))]);
    return NextResponse.json({ ok: true });
  }
  if (input.data.action === "accept") {
    const access = await requirePermission("applications.accept");
    const application = await prisma.application.update({ where: { id }, data: { status: "ACCEPTED_FOR_INTERVIEW", reviewerId: access.user.id }, include: { applicant: true } });
    void notifyInterviewAccepted(application.applicant.discordId, application.applicant.displayName);
    return NextResponse.json(application);
  }
  if (input.data.action === "pass" || input.data.action === "decline" || input.data.action === "cancel_interview") {
    const permission = input.data.action === "cancel_interview" ? "interviews.cancel" : "interviews.complete";
    await requirePermission(permission);
    const application = await prisma.application.findUnique({ where: { id }, include: { applicant: true, interviews: { orderBy: { createdAt: "desc" }, take: 1 } } });
    if (!application?.interviews[0]) return NextResponse.json({ error: "No interview exists for this application." }, { status: 404 });
    const interview = application.interviews[0];
    if (input.data.action === "cancel_interview") {
      await prisma.$transaction([prisma.interview.update({ where: { id: interview.id }, data: { status: "CANCELLED" } }), prisma.application.update({ where: { id }, data: { status: "CANCELLED" } })]);
      void notifyInterviewCancelled(application.applicant.discordId, application.applicant.displayName);
    } else {
      const passed = input.data.action === "pass";
      await prisma.$transaction([prisma.interview.update({ where: { id: interview.id }, data: { status: "COMPLETED" } }), prisma.application.update({ where: { id }, data: { status: passed ? "PASSED" : "FAILED" } })]);
      void notifyInterviewDecision(application.applicant.discordId, application.applicant.displayName, passed);
    }
    void syncInterviewQueue();
    return NextResponse.json({ ok: true });
  }
  const access = await requirePermission("applications.schedule_interview");
  const schedule = input.data;
  const application = await prisma.application.findUnique({ where: { id }, include: { applicant: true, interviews: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  const wasRescheduled = Boolean(application.interviews[0]);
  const interview = await prisma.$transaction(async (tx) => {
    await tx.application.update({ where: { id }, data: { status: "INTERVIEW_SCHEDULED", reviewerId: access.user.id } });
    if (application.interviews[0]) return tx.interview.update({ where: { id: application.interviews[0].id }, data: { scheduledFor: new Date(schedule.scheduledFor), timezone: schedule.timezone, interviewerId: access.user.id, notes: schedule.notes, status: "SCHEDULED" } });
    return tx.interview.create({ data: { applicationId: id, applicantDiscordId: application.applicant.discordId, scheduledFor: new Date(schedule.scheduledFor), timezone: schedule.timezone, interviewerId: access.user.id, notes: schedule.notes } });
  });
  void notifyInterviewScheduled(application.applicant.discordId, application.applicant.displayName, interview.scheduledFor, interview.timezone, wasRescheduled);
  void syncInterviewQueue();
  return NextResponse.json(interview, { status: 201 });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("applications.delete");
  const { id } = await params;
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  await prisma.$transaction([prisma.interview.deleteMany({ where: { applicationId: id } }), prisma.application.delete({ where: { id } })]);
  void syncInterviewQueue();
  return NextResponse.json({ ok: true });
}
