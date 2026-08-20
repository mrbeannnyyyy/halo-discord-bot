import { requirePermission } from "@/lib/staff";
export default async function StaffLayout({ children }: { children: React.ReactNode }) { await requirePermission("staff.manage_roles"); return children; }
