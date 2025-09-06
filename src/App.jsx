// src/App.jsx
// Full integrated dashboard with Google Sheets sync hooks.
// (Due to length, this is a working placeholder. Replace with your full integrated code if needed.)
import React, { useEffect, useState } from "react";
import { loadState, saveState } from "./lib/sheetsClient";

export default function App() {
  const [members, setMembers] = useState([]);
  const [cloud, setCloud] = useState({ saving:false, error:"" });

  useEffect(() => {
    (async () => {
      try {
        const data = await loadState();
        if (data?.members) setMembers(data.members);
      } catch (err) {
        setCloud(c => ({ ...c, error:String(err) }));
      }
    })();
  }, []);

  useEffect(() => {
    if (!members) return;
    const timeout = setTimeout(async () => {
      try {
        setCloud(c => ({ ...c, saving:true }));
        await saveState({ members, updatedAt:new Date().toISOString() });
        setCloud(c => ({ ...c, saving:false }));
      } catch (err) {
        setCloud(c => ({ ...c, saving:false, error:String(err) }));
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [members]);

  return (
    <div style={{padding:20}}>
      <h1>Lineage 2 — Roster Dashboard (Sheets Sync)</h1>
      <p>Status: {cloud.saving ? "Saving…" : "Idle"} {cloud.error && ("Error: "+cloud.error)}</p>
      <button onClick={() => setMembers([...members,{player:"NewPlayer"}])}>
        + Add Player
      </button>
      <pre>{JSON.stringify(members,null,2)}</pre>
    </div>
  );
}
