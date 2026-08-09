-- IrieEstimate PostgreSQL Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- PRICING TABLES

CREATE TABLE house_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  base_cost_per_sq_ft numeric(10,2) NOT NULL CHECK (base_cost_per_sq_ft >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customization_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customization_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid NOT NULL REFERENCES customization_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  cost_modifier numeric(10,2) NOT NULL,
  modifier_type text NOT NULL CHECK (modifier_type IN ('per_sq_ft', 'flat', 'percentage')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- LEAD & PARTNER TABLES

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_value text NOT NULL,
  contact_type text NOT NULL CHECK (contact_type IN ('email', 'phone')),
  house_type_id uuid NOT NULL REFERENCES house_types(id),
  total_square_footage integer NOT NULL CHECK (total_square_footage > 0),
  final_estimated_cost numeric(12,2) NOT NULL,
  consent_to_share_partners boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lead_customizations (
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES customization_options(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, option_id)
);

CREATE TABLE partners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name text NOT NULL,
  partner_type text,
  contact_email text,
  webhook_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lead_distributions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AUTO-UPDATE TRIGGERS

CREATE TRIGGER house_types_updated_at BEFORE UPDATE ON house_types
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON customization_categories
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER options_updated_at BEFORE UPDATE ON customization_options
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ROW LEVEL SECURITY

ALTER TABLE house_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_house_types" ON house_types FOR SELECT USING (true);
CREATE POLICY "public_read_categories" ON customization_categories FOR SELECT USING (true);
CREATE POLICY "public_read_options" ON customization_options FOR SELECT USING (true);

CREATE POLICY "auth_insert_house_types" ON house_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_house_types" ON house_types FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_house_types" ON house_types FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_insert_categories" ON customization_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_categories" ON customization_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_categories" ON customization_categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_insert_options" ON customization_options FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_options" ON customization_options FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_options" ON customization_options FOR DELETE USING (auth.role() = 'authenticated');

-- INDEXES

CREATE INDEX idx_options_category ON customization_options(category_id);
CREATE INDEX idx_leads_house_type ON leads(house_type_id);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_lead_customizations_lead ON lead_customizations(lead_id);
CREATE INDEX idx_lead_distributions_lead ON lead_distributions(lead_id);
CREATE INDEX idx_lead_distributions_partner ON lead_distributions(partner_id);
CREATE INDEX idx_lead_distributions_status ON lead_distributions(status);

-- SEED DATA

INSERT INTO house_types (name, description, base_cost_per_sq_ft, is_active) VALUES
  ('Affordable', 'Budget-friendly construction with standard materials', 4500.00, true),
  ('Standard', 'Quality build with mid-range finishes', 7000.00, true),
  ('Premium', 'High-end construction with premium materials', 10500.00, true),
  ('Luxury', 'Top-tier build with luxury finishes throughout', 15000.00, true);

INSERT INTO customization_categories (name, display_order) VALUES
  ('Roof Type', 1),
  ('Foundation', 2),
  ('Wall Finish', 3),
  ('Flooring', 4),
  ('Fixtures', 5);

INSERT INTO customization_options (category_id, name, cost_modifier, modifier_type) VALUES
  ((SELECT id FROM customization_categories WHERE name = 'Roof Type'), 'Zinc Sheet', 0.00, 'per_sq_ft'),
  ((SELECT id FROM customization_categories WHERE name = 'Roof Type'), 'Zinc + Sarking', 350.00, 'per_sq_ft'),
  ((SELECT id FROM customization_categories WHERE name = 'Roof Type'), 'Shingles', 800.00, 'per_sq_ft'),
  ((SELECT id FROM customization_categories WHERE name = 'Foundation'), 'Standard Slab', 0.00, 'flat'),
  ((SELECT id FROM customization_categories WHERE name = 'Foundation'), 'Raised Foundation', 250000.00, 'flat'),
  ((SELECT id FROM customization_categories WHERE name = 'Foundation'), 'Pile Foundation (hilly)', 500000.00, 'flat'),
  ((SELECT id FROM customization_categories WHERE name = 'Wall Finish'), 'Rough Render', 0.00, 'per_sq_ft'),
  ((SELECT id FROM customization_categories WHERE name = 'Wall Finish'), 'Smooth Render', 200.00, 'per_sq_ft'),
  ((SELECT id FROM customization_categories WHERE name = 'Wall Finish'), 'Surecote (Premium)', 450.00, 'per_sq_ft'),
  ((SELECT id FROM customization_categories WHERE name = 'Flooring'), 'Standard Tiles', 0.00, 'per_sq_ft'),
  ((SELECT id FROM customization_categories WHERE name = 'Flooring'), 'Premium Tiles', 500.00, 'per_sq_ft'),
  ((SELECT id FROM customization_categories WHERE name = 'Flooring'), 'Stone Pavers', 900.00, 'per_sq_ft'),
  ((SELECT id FROM customization_categories WHERE name = 'Fixtures'), 'Basic Package', 0.00, 'flat'),
  ((SELECT id FROM customization_categories WHERE name = 'Fixtures'), 'Standard Package', 350000.00, 'flat'),
  ((SELECT id FROM customization_categories WHERE name = 'Fixtures'), 'Premium Package', 750000.00, 'flat');
