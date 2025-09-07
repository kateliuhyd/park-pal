import React from "react";
export default function Legend(){
  return (
    <div className="card" style={{marginTop:12}}>
      <div className="section-title">Legend</div>
      <div className="legend">
        <div className="item"><span className="badge" style={{background:"#1f77b4"}} /> Garage</div>
        <div className="item"><span className="badge" style={{background:"#d62728"}} /> Meter</div>
        <div className="item"><span className="badge" style={{background:"#2ca02c"}} /> Free</div>
        <div className="item"><span className="badge" style={{background:"#1f77b4"}} /> 2h</div>
        <div className="item"><span className="badge" style={{background:"#9467bd"}} /> Permit</div>
        <div className="item"><span className="badge" style={{background:"#ff7f0e"}} /> Paid</div>
      </div>
    </div>
  );
}
