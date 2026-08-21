import { requirePermission } from "@/lib/staff";
export default async function InterviewsLayout({ children }: { children: React.ReactNode }) { await requirePermission("interviews.view"); return children; }
