-- Migration: Add consultation_requests and workspace_users tables

CREATE TABLE consultation_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  site_address text NOT NULL,
  preferred_date timestamptz,
  notes text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid_offline')),
  meeting_status text NOT NULL DEFAULT 'requested' CHECK (meeting_status IN ('requested', 'scheduled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workspace_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update triggers
CREATE TRIGGER consultations_updated_at BEFORE UPDATE ON consultation_requests
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER workspace_users_updated_at BEFORE UPDATE ON workspace_users
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Indexes
CREATE INDEX idx_consultations_lead ON consultation_requests(lead_id);
CREATE INDEX idx_consultations_payment ON consultation_requests(payment_status);
CREATE INDEX idx_consultations_meeting ON consultation_requests(meeting_status);
CREATE INDEX idx_workspace_users_email ON workspace_users(email);
