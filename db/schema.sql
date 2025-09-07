-- Segments and rules
CREATE TABLE IF NOT EXISTS street_segment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  geom GEOMETRY(LINESTRING, 4326)
);

CREATE TABLE IF NOT EXISTS parking_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES street_segment(id) ON DELETE CASCADE,
  rule_type TEXT, -- free|2h|permit|paid|cleaning|unknown
  max_duration_min INT,
  days TEXT,
  start_time TIME,
  end_time TIME,
  permit_zone TEXT,
  exceptions JSONB,
  source TEXT,
  confidence TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Points: garages/meters/lots
CREATE TABLE IF NOT EXISTS parking_poi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_type TEXT,  -- garage|meter|lot
  name TEXT,
  props JSONB,
  geom GEOMETRY(POINT, 4326),
  source TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_segment_geom ON street_segment USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_poi_geom ON parking_poi USING GIST (geom);
