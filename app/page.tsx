import Link from "next/link";
import type { CSSProperties } from "react";
import { PublicNav } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const defaults: Record<string, string> = { siteName: "Halo", heroEyebrow: "Applications are now open", heroTitle: "Find your place in the", heroAccent: "next chapter.", heroDescription: "Halo is a thoughtful community for people who want to build, contribute and belong. Take a few minutes to tell us what you would bring.", primaryCta: "Apply with Discord", secondaryCta: "Explore the process", closingNote: "Applications close 31 August · Responses within 7 days", processEyebrow: "A simple, human process", processTitle: "Clear from first click to first hello.", step1Title: "Tell us your story", step1Description: "Sign in with Discord and complete a guided application at your own pace.", step2Title: "Meet the team", step2Description: "Our reviewers read every application. Strong fits receive a short interview invitation.", step3Title: "Make an impact", step3Description: "Join a community that values kindness, craft and putting people first.", backgroundColor: "#0b0d10", surfaceColor: "#111419", accentColor: "#7c85ff", heroArtStart: "#171b21", heroArtEnd: "#0d1015" };

export default async function Home() {
  const items = await prisma.websiteContent.findMany();
  const content = { ...defaults, ...Object.fromEntries(items.map((item) => [item.key, item.value])) };
  const now = new Date();
  const opensAt = content.applicationOpenDate ? new Date(content.applicationOpenDate) : null;
  const closesAt = content.applicationCloseDate ? new Date(content.applicationCloseDate) : null;
  const applicationsAreOpen = content.applicationsOpen !== "false" && (!opensAt || opensAt <= now) && (!closesAt || closesAt >= now);
  const formatDate = (date: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
  const applicationStatus = applicationsAreOpen ? (closesAt ? `Applications close ${formatDate(closesAt)}` : "Applications are open · Closing date to be announced") : (opensAt && opensAt > now ? `Applications open ${formatDate(opensAt)}` : "Applications are currently closed");
  const style = { "--page-bg": content.backgroundColor, "--page-surface": content.surfaceColor, "--page-accent": content.accentColor, "--hero-art-start": content.heroArtStart, "--hero-art-end": content.heroArtEnd } as CSSProperties;
  return <div className="page public-page" style={style}><PublicNav siteName={content.siteName}/><main className="shell"><section className="hero"><div><p className="eyebrow">{applicationsAreOpen ? content.heroEyebrow : "Applications are currently closed"}</p><h1>{content.heroTitle} <em>{content.heroAccent}</em></h1><p className="lede">{content.heroDescription}</p><div className="actions">{applicationsAreOpen && <Link className="button" href="/auth/discord?next=%2Fapply">{content.primaryCta} <span>→</span></Link>}<a className="button ghost" href="#process">{content.secondaryCta}</a></div><p className="muted" style={{marginTop:18}}>{applicationStatus}</p></div><div className="hero-art" aria-hidden><div className="orbit"/><div className="planet"/><div className="dot"/><p style={{position:"absolute",bottom:20,left:22,color:"#9198a4",fontSize:12,letterSpacing:1}}>{content.siteName.toUpperCase()} COMMUNITY · 2026</p></div></section><section className="section" id="process"><p className="eyebrow">{content.processEyebrow}</p><h2>{content.processTitle}</h2><div className="process"><article><strong>01</strong><h3>{content.step1Title}</h3><p className="muted">{content.step1Description}</p></article><article><strong>02</strong><h3>{content.step2Title}</h3><p className="muted">{content.step2Description}</p></article><article><strong>03</strong><h3>{content.step3Title}</h3><p className="muted">{content.step3Description}</p></article></div></section></main></div>;
}
