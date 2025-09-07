import React, { useEffect, useState } from "react";

export default function TimerButton({ minutes=0, label="Set Reminder" }) {
  const [left, setLeft] = useState(null);
  async function askNotify(){
    if ("Notification" in window && Notification.permission !== "granted") {
      try { await Notification.requestPermission(); } catch {}
    }
  }
  useEffect(()=>{ askNotify(); }, []);

  function startTimer(){
    if (!minutes || minutes <= 0) return alert("No duration available for this rule.");
    const end = Date.now() + minutes*60*1000;
    setLeft(end - Date.now());
    const t = setInterval(()=>{
      const rest = end - Date.now();
      setLeft(rest);
      if (rest <= 0){
        clearInterval(t);
        setLeft(null);
        if ("Notification" in window && Notification.permission === "granted"){
          new Notification("Parking Reminder", { body: "Time is up. Please move your car." });
        } else {
          alert("Parking time is up!");
        }
      }
    }, 1000);
  }

  function fmt(ms){
    const s = Math.max(0, Math.floor(ms/1000));
    const m = Math.floor(s/60), ss = s%60;
    return `${m}:${String(ss).padStart(2,"0")}`;
  }

  return (
    <div>
      <button className="btn btn-primary" onClick={startTimer}>{label}</button>
      {left!=null && <span className="small" style={{marginLeft:8}}>⏱ {fmt(left)}</span>}
    </div>
  );
}
