"use client";

import { useState } from "react";

type Values = Record<string, string>;

const fields = [
  ["siteName", "Community name"],
  ["heroEyebrow", "Small heading above the title"],
  ["heroTitle", "Main title"],
  ["heroAccent", "Highlighted title words"],
  ["heroDescription", "Description"],
  ["primaryCta", "Apply button text"],
  ["secondaryCta", "Second button text"],
  ["closingNote", "Note below the buttons"],
  ["processEyebrow", "Process small heading"],
  ["processTitle", "Process heading"],
  ["step1Title", "Step 1 title"],
  ["step1Description", "Step 1 description"],
  ["step2Title", "Step 2 title"],
  ["step2Description", "Step 2 description"],
  ["step3Title", "Step 3 title"],
  ["step3Description", "Step 3 description"],
] as const;

export function HomeEditor({ initial }: { initial: Values }) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState("");
  const update = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  async function save() {
    setMessage("Saving…");
    const response = await fetch("/api/staff/website-content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    setMessage(response.ok ? "Saved. Refresh the home page to see it." : (await response.json()).error || "Could not save changes.");
  }

  return <div className="card">
    <h2>Edit your public start page</h2>
    <p className="muted">Everything below appears on the public home page. Button links stay safe and unchanged.</p>
    <div className="editor-grid">
      {fields.map(([key, label]) => <label className="field" key={key}>{label}
        {key.includes("Description") || key === "heroTitle" || key === "processTitle" ?
          <textarea className="input" rows={key.includes("Description") ? 3 : 2} value={values[key] || ""} onChange={(event) => update(key, event.target.value)} /> :
          <input className="input" value={values[key] || ""} onChange={(event) => update(key, event.target.value)} />}
      </label>)}
    </div>
    <button className="button" onClick={save}>Save home page</button>
    {message && <p className="muted">{message}</p>}
  </div>;
}
