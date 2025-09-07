import React, { useState } from "react";

const MAPBOX = import.meta.env.VITE_MAPBOX_GEOCODING_TOKEN;

export default function SearchBar({ onLocate }) {
  const [q, setQ] = useState("");

 async function geocode() {
  if (!q.trim()) return;
  const key = import.meta.env.VITE_MAPTILER_KEY;
  if (!key) {
    alert("No MapTiler key set in .env");
    return;
  }

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${key}`;
  const r = await fetch(url);
  const data = await r.json();
  const f = data.features?.[0];
  if (f) onLocate(f.center);
  else alert("No result");
}


  function onKey(e){ if(e.key==="Enter") geocode(); }

  return (
    <div className="card" style={{marginBottom:12}}>
      <div className="section-title">Search</div>
      <div className="row">
        <input className="input" placeholder="Search address / place" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={onKey}/>
        <button className="btn btn-primary" onClick={geocode}>Go</button>
      </div>
      <div className="small" style={{marginTop:6}}>Powered by Mapbox Geocoding · Optional</div>
    </div>
  );
}
