import json, sys
from shapely.geometry import shape
from sqlalchemy import text
from db import SessionLocal

def import_poi(path, poi_type, source="official"):
    with open(path, "r") as f: gj = json.load(f)
    feats = gj.get("features", [])
    with SessionLocal() as s:
        for ft in feats:
            sql = text("""
              INSERT INTO parking_poi (poi_type, name, props, geom, source)
              VALUES (:t, :name, :props, ST_SetSRID(ST_GeomFromGeoJSON(:g),4326), :src)
            """)
            props = ft.get("properties", {})
            s.execute(sql, {
                "t": poi_type,
                "name": props.get("name","POI"),
                "props": json.dumps(props),
                "g": json.dumps(ft["geometry"]),
                "src": source
            })
        s.commit()

def import_segments_with_rules(path, default_rule="unknown"):
    with open(path, "r") as f: gj = json.load(f)
    feats = gj.get("features", [])
    with SessionLocal() as s:
        for ft in feats:
            props = ft.get("properties", {})
            sql_seg = text("""
              INSERT INTO street_segment (id, name, geom)
              VALUES (gen_random_uuid(), :name, ST_SetSRID(ST_GeomFromGeoJSON(:g),4326))
              RETURNING id
            """)
            seg_id = s.execute(sql_seg, {"name": props.get("name","Street"),
                                         "g": json.dumps(ft["geometry"])}).scalar()

            sql_rule = text("""
              INSERT INTO parking_rule (segment_id, rule_type, max_duration_min, days, start_time, end_time,
                                        permit_zone, exceptions, source, confidence)
              VALUES (:sid, :rule_type, :maxm, :days, :st, :et, :permit, :exceptions, :source, :conf)
            """)
            s.execute(sql_rule, {
              "sid": seg_id,
              "rule_type": props.get("rule_type", default_rule),
              "maxm": props.get("max_duration_min"),
              "days": props.get("days"),
              "st": props.get("start_time"),
              "et": props.get("end_time"),
              "permit": props.get("permit_zone"),
              "exceptions": json.dumps(props.get("exceptions")) if props.get("exceptions") is not None else None,
              "source": props.get("source","manual"),
              "conf": props.get("confidence","medium")
            })
        s.commit()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: etl_import_geojson <geojson_path> <type: garage|meter|segments>")
        sys.exit(1)
    path, t = sys.argv[1], sys.argv[2]
    if t in ("garage","meter","lot"):
        import_poi(path, t)
    elif t == "segments":
        import_segments_with_rules(path)
    else:
        print("Unknown type")
