import { requireUser } from "@/lib/session";
export default async function ApplyLayout({ children }: { children: React.ReactNode }) { await requireUser("/apply"); return children; }
