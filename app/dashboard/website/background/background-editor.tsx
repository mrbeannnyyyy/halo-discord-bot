"use client";

import { useState } from "react";

type Values = Record<string, string>;
const fields = [
  ["backgroundColor", "Page background"],
  ["surfaceColor", "Card background"],
  ["accentColor", "Button and highlight colour"],
  ["heroArtStart", "Hero art first colour"],
  ["heroArtEnd", "Hero art second colour"],
] as const;

export function BackgroundEditor({ initial }: { initial: Values }) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState("");
  async function save() {
    setMessage("Saving…");
    const response = await fetch("/api/staff/website-content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values }) });
    setMessage(response.ok ? "Saved. Refresh the home page to see it." : (await response.json()).error || "Could not save changes.");
  }
  return <div className="card">
    <h2>Website appearance</h2>
    <p className="muted">Choose the colours used on the public start page.</p>
    <div className="editor-grid colour-grid">{fields.map(([key, label]) => <label className="field" key={key}>{label}<span className="colour-input"><input type="color" value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}/><input className="input" value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}/></span></label>)}</div>
    <div className="appearance-preview" style={{ background: `linear-gradient(135deg, ${values.heroArtStart}, ${values.heroArtEnd})`, borderColor: values.accentColor }}><span style={{ color: values.accentColor }}>Preview</span></div>
    <button className="button" onClick={save}>Save appearance</button>
    {message && <p className="muted">{message}</p>}
  </div>;
}
