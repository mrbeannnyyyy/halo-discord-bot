import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Halo — Community applications", description: "The thoughtful way into a better community." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
