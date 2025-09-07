import React from "react";

export default function Filters({value, onChange}) {
  const options = ["garage","free","2h","permit"];
  const toggle = (k) => {
    const set = new Set(value);
    set.has(k) ? set.delete(k) : set.add(k);
    onChange([...set]);
  };
  return (
    <div className="card" style={{marginBottom:12}}>
      <div className="section-title">Filters</div>
      {options.map(k => (
        <label key={k} style={{display:"flex", gap:8, alignItems:"center", padding:"4px 0"}}>
          <input type="checkbox" checked={value.includes(k)} onChange={() => toggle(k)} />
          <span style={{textTransform:"capitalize"}}>{k}</span>
        </label>
      ))}
    </div>
  );
}
