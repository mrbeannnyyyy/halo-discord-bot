import { staffAccess } from "@/lib/staff";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await staffAccess();
  if (!access.allowed) redirect("/access-denied");
  return children;
}
