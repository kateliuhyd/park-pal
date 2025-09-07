import React, { useRef, useState } from "react";
import MapView from "./components/MapView";
import Filters from "./components/Filters";
import SearchBar from "./components/SearchBar";
import Legend from "./components/Legend";

export default function App() {
  const [filters, setFilters] = useState(["garage","free","2h","permit"]);
  const locateToRef = useRef(null);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="h1">San José Parking Finder</div>
        <SearchBar onLocate={(center)=> locateToRef.current?.(center)} />
        <Filters value={filters} onChange={setFilters}/>
        <div className="card">
          <div className="section-title">About</div>
          <div className="small">
            City-wide baseline (garages/meters). Accurate street rules in SJSU/Downtown first. Always check on-site signs.
          </div>
        </div>
        <Legend/>
      </aside>
      <main>
        <MapView filters={filters} locateToRef={locateToRef}/>
      </main>
    </div>
  );
}
