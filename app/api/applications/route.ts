import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { thankApplicantForApplying } from "@/lib/discord";
const input = z.object({ answers: z.record(z.string(), z.string().trim().max(1000)) });
export async function POST(request: NextRequest) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const result = input.safeParse(await request.json()); if (!result.success) return NextResponse.json({ error: "Please answer every question before submitting." }, { status: 400 });
  const settings = await prisma.websiteContent.findMany({ where: { key: { in: ["applicationsOpen", "applicationOpenDate", "applicationCloseDate"] } } });
  const setting = Object.fromEntries(settings.map((item) => [item.key, item.value])); const now = new Date();
  if (setting.applicationsOpen === "false" || (setting.applicationOpenDate && now < new Date(setting.applicationOpenDate)) || (setting.applicationCloseDate && now > new Date(setting.applicationCloseDate))) return NextResponse.json({ error: "Applications are currently closed." }, { status: 403 });
  const questions = await prisma.applicationQuestion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  if (!questions.length) return NextResponse.json({ error: "Applications are not configured yet." }, { status: 503 });
  if (questions.some((question) => question.required && !result.data.answers[question.key]?.trim())) return NextResponse.json({ error: "Please answer every required question." }, { status: 400 });
  const active = await prisma.application.findFirst({ where: { applicantId: user.id, status: { in: ["PENDING", "UNDER_REVIEW", "ACCEPTED_FOR_INTERVIEW", "INTERVIEW_SCHEDULED"] } } });
  if (active) return NextResponse.json({ error: "You already have an active application." }, { status: 409 });
  const application = await prisma.application.create({ data: { applicantId: user.id, answers: { create: questions.filter((question) => result.data.answers[question.key]?.trim()).map((question) => ({ questionKey: question.key, value: result.data.answers[question.key] })) } } });
  void thankApplicantForApplying({ id: application.id, applicantName: user.displayName, discordId: user.discordId });
  return NextResponse.json({ id: application.id }, { status: 201 });
}
