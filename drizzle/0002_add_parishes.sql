-- Add parishes table for regional cost multipliers
-- Each parish in Jamaica has a different construction cost due to
-- transport, labour availability, and material sourcing distances.

CREATE TABLE parishes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  cost_multiplier numeric(5,3) NOT NULL DEFAULT 1.000
    CHECK (cost_multiplier > 0 AND cost_multiplier <= 3.000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER parishes_updated_at BEFORE UPDATE ON parishes
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS: public read, workspace write (matches existing pattern)
ALTER TABLE parishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_parishes" ON parishes FOR SELECT USING (true);
CREATE POLICY "auth_insert_parishes" ON parishes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_parishes" ON parishes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_parishes" ON parishes FOR DELETE USING (auth.role() = 'authenticated');

-- Add parish_id FK to leads so every estimate is tagged to a parish
ALTER TABLE leads ADD COLUMN parish_id uuid REFERENCES parishes(id);
CREATE INDEX idx_leads_parish ON leads(parish_id);

-- Add parish coverage to partners for intelligent lead routing
ALTER TABLE partners ADD COLUMN parishes_served uuid[] DEFAULT '{}';

-- Seed all 14 parishes with default 1.000 multiplier
-- The Quantity Surveyor will update these with real values
INSERT INTO parishes (name, cost_multiplier) VALUES
  ('Kingston', 1.000),
  ('St. Andrew', 1.000),
  ('St. Thomas', 1.050),
  ('Portland', 1.080),
  ('St. Mary', 1.060),
  ('St. Ann', 1.040),
  ('Trelawny', 1.060),
  ('St. James', 1.020),
  ('Hanover', 1.070),
  ('Westmoreland', 1.060),
  ('St. Elizabeth', 1.050),
  ('Manchester', 1.030),
  ('Clarendon', 1.030),
  ('St. Catherine', 1.010);
