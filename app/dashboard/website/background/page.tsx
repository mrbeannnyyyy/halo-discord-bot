import { DashboardShell } from "@/components/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { BackgroundEditor } from "./background-editor";

const defaults = { backgroundColor: "#0b0d10", surfaceColor: "#111419", accentColor: "#7c85ff", heroArtStart: "#171b21", heroArtEnd: "#0d1015" };

export default async function Background(){ const items = await prisma.websiteContent.findMany({ where: { key: { in: Object.keys(defaults) } } }); const values = { ...defaults, ...Object.fromEntries(items.map((item) => [item.key, item.value])) }; return <DashboardShell><p className="eyebrow">Appearance</p><h1 style={{fontFamily:"Playfair Display"}}>Background</h1><BackgroundEditor initial={values}/></DashboardShell>}
