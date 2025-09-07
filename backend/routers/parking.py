import math
from fastapi import APIRouter
from sqlalchemy import text
from db import SessionLocal

router = APIRouter(prefix="/api")

@router.get("/parking/nearby")
def nearby(lat: float, lng: float, radius: int = 800, filters: str | None = None):
    filter_set = set((filters or "").split(",")) if filters else set()
    with SessionLocal() as s:
        sql_poi = text("""
            SELECT id, poi_type, name, props,
                   ST_AsGeoJSON(geom)::json AS geometry
            FROM parking_poi
            WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography, :r)
            LIMIT 500;
        """)
        pois = [dict(row._mapping) for row in s.execute(sql_poi, {"lat": lat, "lng": lng, "r": radius}).fetchall()]

        sql_seg = text("""
            SELECT ss.id as segment_id, ss.name,
                   ST_AsGeoJSON(ss.geom)::json AS geometry,
                   pr.rule_type, pr.max_duration_min, pr.days, pr.start_time, pr.end_time,
                   pr.permit_zone, pr.source, pr.confidence
            FROM street_segment ss
            JOIN parking_rule pr ON pr.segment_id = ss.id
            WHERE ST_DWithin(ss.geom::geography, ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography, :r)
            LIMIT 500;
        """)
        segs = [dict(row._mapping) for row in s.execute(sql_seg, {"lat": lat, "lng": lng, "r": radius}).fetchall()]

    # Basic rule filter (frontend also filters visually)
    def rule_match(rt):
        if not filter_set or rt is None:
            return True if not filter_set else ("unknown" in filter_set)
        mapping = {"free":"free","2h":"2h","permit":"permit","paid":"paid"}
        return any(k in filter_set and rt == v for k, v in mapping.items())

    segs = [r for r in segs if rule_match(r.get("rule_type"))]
    return {"pois": pois, "segments": segs}


@router.get("/rules/segment/{segment_id}")
def segment_rules(segment_id: str):
    with SessionLocal() as s:
        sql = text("""
            SELECT ss.id as segment_id, ss.name,
                   ST_AsGeoJSON(ss.geom)::json AS geometry,
                   pr.rule_type, pr.max_duration_min, pr.days, pr.start_time, pr.end_time,
                   pr.permit_zone, pr.exceptions, pr.source, pr.confidence, pr.updated_at
            FROM street_segment ss
            LEFT JOIN parking_rule pr ON pr.segment_id = ss.id
            WHERE ss.id = :sid;
        """)
        rows = [dict(row._mapping) for row in s.execute(sql, {"sid": segment_id}).fetchall()]
    return {"segment": rows[0] if rows else None}
