import { DashboardShell } from "@/components/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { ApplicationSettingsForm } from "@/app/dashboard/website/applications/settings-form";
import { QuestionManager } from "@/app/dashboard/website/applications/question-manager";
export default async function ApplicationSettings(){const [rows,questions]=await Promise.all([prisma.websiteContent.findMany({where:{key:{in:["applicationsOpen","applicationOpenDate","applicationCloseDate"]}}}),prisma.applicationQuestion.findMany({orderBy:{sortOrder:"asc"}})]);const initial=Object.fromEntries(rows.map(row=>[row.key,row.value]));return <DashboardShell><p className="eyebrow">Website management</p><h1 style={{fontFamily:"Playfair Display"}}>Applications</h1><ApplicationSettingsForm initial={initial}/><QuestionManager initial={questions}/></DashboardShell>}
