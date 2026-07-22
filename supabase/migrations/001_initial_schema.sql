-- ============================================================
-- Swami Abhyasika — Student Management System
-- Supabase Postgres Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Courses ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO courses (name, sort_order) VALUES
  ('UPSC MPSC', 1),
  ('IIT JEE/MHT CET', 2),
  ('MEDICAL', 3),
  ('OTHER', 4)
ON CONFLICT DO NOTHING;

-- ─── Fee Tiers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_tiers (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gender  TEXT NOT NULL CHECK (gender IN ('Male','Female','Other','All')),
  shift   TEXT NOT NULL CHECK (shift  IN ('Day','Night','Both')),
  months  INT  NOT NULL CHECK (months IN (1,2,3,6,12)),
  fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE (gender, shift, months)
);

-- ─── Students ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         TEXT NOT NULL UNIQUE, -- STU-0001
  name               TEXT NOT NULL,
  phone              TEXT NOT NULL,
  email              TEXT,
  gender             TEXT NOT NULL CHECK (gender IN ('Male','Female','Other')),
  address            TEXT,
  photo_url          TEXT,
  conditions         TEXT,
  course             TEXT NOT NULL,
  shift              TEXT NOT NULL CHECK (shift IN ('Day','Night','Both')),
  admission_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  fee_due_date       DATE,
  subscription_months INT,
  total_fees         NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_fees          NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_status         TEXT NOT NULL DEFAULT 'Active'
                       CHECK (fee_status IN ('Active','Overdue','Inactive','Expired')),
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sequence helper for student IDs (stored per insert)
CREATE SEQUENCE IF NOT EXISTS student_seq START 1;

-- ─── Payment History ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  from_date     DATE NOT NULL,
  months        INT  NOT NULL,
  next_due_date DATE NOT NULL,
  shift         TEXT NOT NULL CHECK (shift IN ('Day','Night','Both')),
  method        TEXT NOT NULL CHECK (method IN ('Cash','UPI','Online Transfer','Cheque','Demand Draft','Card','Free')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seat Bookings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seat_bookings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seat_number    INT  NOT NULL CHECK (seat_number BETWEEN 1 AND 84),
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booking_date   DATE NOT NULL,
  slots          JSONB NOT NULL DEFAULT '[]', -- [{label,start,end}]
  fee            NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Cash'
                   CHECK (payment_method IN ('Cash','UPI','Online Transfer','Cheque','Demand Draft','Card','Free')),
  status         TEXT NOT NULL DEFAULT 'Active'
                   CHECK (status IN ('Active','Expired','Cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seat_bookings_date   ON seat_bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_student ON seat_bookings (student_id);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_seat    ON seat_bookings (seat_number, booking_date);

-- ─── Cash Closings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_closings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  closing_date        DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  opening_cash        NUMERIC(10,2) NOT NULL DEFAULT 0,
  cash_collected      NUMERIC(10,2) NOT NULL DEFAULT 0,
  upi_online_total    NUMERIC(10,2) NOT NULL DEFAULT 0,
  actual_closing_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
  difference          NUMERIC(10,2) NOT NULL DEFAULT 0,
  closed_by           TEXT NOT NULL,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'Closed'
                        CHECK (status IN ('Open','Closed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── App Settings (singleton row) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reminder_days_before       INT  NOT NULL DEFAULT 5,
  overdue_days_threshold     INT  NOT NULL DEFAULT 7,
  owner_pin                  TEXT NOT NULL DEFAULT '1234',
  theme                      TEXT NOT NULL DEFAULT 'dark',
  accent_color               TEXT NOT NULL DEFAULT 'purple',
  font_size                  TEXT NOT NULL DEFAULT 'medium',
  institution_name           TEXT NOT NULL DEFAULT 'Swami Abhyasika',
  institution_admin_name     TEXT NOT NULL DEFAULT 'Admin',
  institution_phone          TEXT NOT NULL DEFAULT '',
  institution_email          TEXT NOT NULL DEFAULT '',
  institution_address        TEXT NOT NULL DEFAULT '',
  whatsapp_template_overdue  TEXT NOT NULL DEFAULT 'Dear {name}, your library fee of ₹{amount} was due on {due_date}. Please renew your subscription. Thank you!',
  whatsapp_template_upcoming TEXT NOT NULL DEFAULT 'Dear {name}, your library fee of ₹{amount} is due on {due_date}. Please renew on time. Thank you!'
);

-- Insert default settings if not present
INSERT INTO app_settings DEFAULT VALUES
ON CONFLICT DO NOTHING;

-- ─── Pending Deletes ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_deletes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name  TEXT NOT NULL,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending','Approved','Rejected'))
);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

ALTER TABLE courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_tiers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_bookings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_deletes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (single-admin app)
CREATE POLICY "authenticated_all" ON courses
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON fee_tiers
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON students
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON payment_history
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON seat_bookings
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON cash_closings
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON app_settings
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON pending_deletes
  TO authenticated USING (true) WITH CHECK (true);

-- ─── Storage Bucket for Student Photos ───────────────────────────────────────
-- Run in Supabase dashboard or via CLI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', false);
-- CREATE POLICY "auth_read_photos"   ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student-photos');
-- CREATE POLICY "auth_insert_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-photos');
-- CREATE POLICY "auth_update_photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'student-photos') WITH CHECK (bucket_id = 'student-photos');
-- CREATE POLICY "auth_delete_photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'student-photos');
