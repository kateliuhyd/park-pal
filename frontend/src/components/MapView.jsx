import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import TimerButton from "./TimerButton";

const styleUrl = import.meta.env.VITE_MAP_STYLE;
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function MapView({ filters, locateToRef }) {
  const mapRef = useRef(null);        // MapLibre map instance
  const containerRef = useRef(null);  // HTML container div
  const [center, setCenter] = useState([-121.8863, 37.3382]); // San José

  /**
   * Fetch nearby data from backend and update map sources.
   * Safe to call multiple times; will no-op if map isn't ready.
   */
  async function fetchNearby([lng, lat]) {
    const map = mapRef.current;
    if (!map) return;

    const qs = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: "800",
      filters: filters.join(","),
    });
    const res = await fetch(`${API_BASE}/api/parking/nearby?${qs.toString()}`);
    const data = await res.json();

    // Build GeoJSON features for POIs
    const pois = {
      type: "FeatureCollection",
      features: (data.pois || []).map((p) => ({
        type: "Feature",
        geometry: p.geometry,
        properties: { poi_type: p.poi_type, name: p.name, ...(p.props || {}) },
      })),
    };

    // Build GeoJSON features for street segments
    const segs = {
      type: "FeatureCollection",
      features: (data.segments || []).map((s) => ({
        type: "Feature",
        geometry: s.geometry,
        properties: {
          segment_id: s.segment_id,
          name: s.name,
          rule_type: s.rule_type,
          max_duration_min: s.max_duration_min,
          days: s.days,
          start_time: s.start_time,
          end_time: s.end_time,
          permit_zone: s.permit_zone,
          source: s.source,
          confidence: s.confidence,
        },
      })),
    };

    // Wait until style & sources exist before setting data
    ensureStyleReady(() => {
      if (map.getSource("pois")) map.getSource("pois").setData(pois);
      if (map.getSource("segments")) map.getSource("segments").setData(segs);
      applyFiltersSafely(); // re-apply filters after data refresh
    });
  }

  /**
   * Smoothly fly the map to a given [lng, lat] and then fetch data there.
   */
  function panTo([lng, lat]) {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom: 15 });
    // Fetch a moment later so the center/viewport is settled
    setTimeout(() => fetchNearby([lng, lat]), 200);
  }

  /**
   * Expose panTo to parent via a ref (used by SearchBar).
   */
  useEffect(() => {
    if (locateToRef) locateToRef.current = panTo;
  }, [locateToRef]);

  /**
   * Utility: run a function after the style/layers are fully ready.
   */
  function ensureStyleReady(fn) {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) {
      // Extra guard: ensure our layers exist (first load)
      if (map.getLayer("segments-line") && map.getLayer("poi-garage")) {
        fn();
      } else {
        map.once("idle", () => ensureStyleReady(fn));
      }
    } else {
      map.once("load", () => ensureStyleReady(fn));
    }
  }

  /**
   * Apply UI filters to layers. Only runs after style is ready.
   */
  function applyFiltersSafely() {
    const map = mapRef.current;
    if (!map) return;

    ensureStyleReady(() => {
      // Toggle garage visibility (you can add meter toggle similarly)
      if (map.getLayer("poi-garage")) {
        map.setLayoutProperty(
          "poi-garage",
          "visibility",
          filters.includes("garage") ? "visible" : "none"
        );
      }

      // Compose conditions for segment rule types
      const conds = [];
      if (filters.includes("free")) conds.push(["==", ["get", "rule_type"], "free"]);
      if (filters.includes("2h")) conds.push(["==", ["get", "rule_type"], "2h"]);
      if (filters.includes("permit")) conds.push(["==", ["get", "rule_type"], "permit"]);
      // (Optional) if you add "paid" or "unknown", push here as well.

      if (map.getLayer("segments-line")) {
        if (conds.length > 0) {
          map.setLayoutProperty("segments-line", "visibility", "visible");
          map.setFilter("segments-line", ["any", ...conds]);
        } else {
          // Hide if no segment filters are selected
          map.setLayoutProperty("segments-line", "visibility", "none");
        }
      }
    });
  }

  /**
   * Initialize map once.
   */
  useEffect(() => {
    if (!styleUrl) {
      console.error("Missing VITE_MAP_STYLE");
      return;
    }
    if (mapRef.current) return; // Prevent double init

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center,
      zoom: 14,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      // Define sources
      map.addSource("pois", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("segments", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      // Define layers (order matters)
      map.addLayer({
        id: "poi-garage",
        type: "circle",
        source: "pois",
        filter: ["==", ["get", "poi_type"], "garage"],
        paint: {
          "circle-radius": 6,
          "circle-color": "#1f77b4",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.5,
        },
      });
      map.addLayer({
        id: "poi-meter",
        type: "circle",
        source: "pois",
        filter: ["==", ["get", "poi_type"], "meter"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#d62728",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.2,
        },
      });
      map.addLayer({
        id: "segments-line",
        type: "line",
        source: "segments",
        paint: {
          "line-width": 4,
          "line-color": [
            "match",
            ["get", "rule_type"],
            "free",
            "#2ca02c",
            "2h",
            "#1f77b4",
            "permit",
            "#9467bd",
            "paid",
            "#ff7f0e",
            "#9e9e9e", // default/unknown
          ],
        },
      });

      // Initial fetch + apply filters
      fetchNearby(center);
      applyFiltersSafely();
    });

    // Update data when the map stops moving
    let timer;
    map.on("moveend", () => {
      const c = map.getCenter();
      setCenter([c.lng, c.lat]);
      clearTimeout(timer);
      timer = setTimeout(() => fetchNearby([c.lng, c.lat]), 150);
    });

    // Click to open a detail popup + attach a timer button
    map.on("click", "segments-line", (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties || {};

      const el = document.createElement("div");
      el.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px">${p.name || "Street segment"}</div>
        <div style="font-size:13px;line-height:1.4">
          <div>Rule: ${p.rule_type || "unknown"} ${p.max_duration_min ? `(${p.max_duration_min} min)` : ""}</div>
          <div>Days: ${p.days || "-"}</div>
          <div>Time: ${p.start_time || "-"} – ${p.end_time || "-"}</div>
          <div>Permit: ${p.permit_zone || "N/A"}</div>
          <div style="color:#6b7280;font-size:12px">Source: ${p.source || "-"} (${p.confidence || "-"})</div>
        </div>
        <div id="timer-here" style="margin-top:8px"></div>
      `;
      new maplibregl.Popup({ offset: 12 }).setLngLat(e.lngLat).setDOMContent(el).addTo(map);

      // Mount a React TimerButton into the popup content
      setTimeout(() => {
        const mount = document.getElementById("timer-here");
        if (mount) {
          import("react-dom/client").then(({ createRoot }) => {
            const minutes = Number(p.max_duration_min || 0);
            createRoot(mount).render(<TimerButton minutes={minutes} label="Set reminder" />);
          });
        }
      }, 0);
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Re-apply filters when filter selection changes.
   * This effect doesn't re-fetch data; map movement triggers fetches.
   */
  useEffect(() => {
    applyFiltersSafely();
  }, [filters]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
