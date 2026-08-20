import { requirePermission } from "@/lib/staff";
export default async function WebsiteLayout({ children }: { children: React.ReactNode }) { await requirePermission("website.view"); return children; }
