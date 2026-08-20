import { requirePermission } from "@/lib/staff";
export default async function ApplicationsLayout({ children }: { children: React.ReactNode }) { await requirePermission("applications.view"); return children; }
