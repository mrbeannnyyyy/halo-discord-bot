import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { Status } from "@/components/ui";

export default async function Dashboard() {
  const [total, pending, recent, upcoming] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.application.findMany({ take: 5, orderBy: { submittedAt: "desc" }, include: { applicant: true } }),
    prisma.interview.findMany({ where: { status: "SCHEDULED", scheduledFor: { gte: new Date() } }, take: 5, orderBy: { scheduledFor: "asc" }, include: { application: { include: { applicant: true } } } }),
  ]);
  return <DashboardShell><section className="metrics"><div className="metric"><span>TOTAL APPLICATIONS</span><b>{total}</b></div><div className="metric"><span>PENDING REVIEW</span><b>{pending}</b></div><div className="metric"><span>UPCOMING INTERVIEWS</span><b>{upcoming.length}</b></div><div className="metric"><span>NEWEST SUBMISSION</span><b>{recent.length ? "1" : "—"}</b></div></section><section className="grid"><div className="card"><h2>Recent applications</h2>{recent.length ? recent.map((item)=><div className="row" key={item.id}><span><b>{item.applicant.displayName}</b><br/><span className="muted">Submitted {item.submittedAt.toLocaleDateString()}</span></span><Status kind={item.status === "PENDING" ? "pending" : ""}>{item.status.replaceAll("_", " ")}</Status></div>) : <p className="muted">No applications yet. New submissions will appear here.</p>}</div><div className="card"><h2>Up next</h2>{upcoming.length ? upcoming.map((item)=><div className="row" key={item.id}><span><b>{item.application.applicant.displayName}</b><br/><span className="muted">{item.scheduledFor.toLocaleString()} · {item.timezone}</span></span><Status>Scheduled</Status></div>) : <p className="muted">No upcoming interviews.</p>}<Link className="muted" href="/dashboard/interviews" style={{display:"block",marginTop:17}}>View interviews →</Link></div></section></DashboardShell>;
}
