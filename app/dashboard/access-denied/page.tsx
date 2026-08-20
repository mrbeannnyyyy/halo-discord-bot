import Link from "next/link";
import { Logo } from "@/components/ui";
export default function AccessDenied() { return <main className="auth"><Logo /><p className="eyebrow" style={{ marginTop: 40 }}>Staff workspace</p><h1>Access denied.</h1><p className="muted">Your Discord account is not a member of the staff server with an authorized role.</p><Link className="button" href="/account">Return to my account</Link></main>; }
