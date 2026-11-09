-- ====================================================================
-- Cube Tech Consults — Production Database Schema (PostgreSQL / Supabase)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(128) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(64),
    fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    guarantee_days INTEGER NOT NULL DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. JOB ORDERS TABLE
CREATE TABLE IF NOT EXISTS job_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(128) NOT NULL DEFAULT 'Abuja',
    work_type VARCHAR(64) NOT NULL DEFAULT 'Full-time',
    category VARCHAR(128) NOT NULL DEFAULT 'Customer service',
    salary_min NUMERIC(12, 2) NOT NULL DEFAULT 300000,
    salary_max NUMERIC(12, 2) NOT NULL DEFAULT 450000,
    min_years_experience INTEGER NOT NULL DEFAULT 3,
    closes_at DATE NOT NULL,
    state VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'open', 'filled', 'closed')),
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    is_confidential BOOLEAN NOT NULL DEFAULT TRUE,
    show_salary BOOLEAN NOT NULL DEFAULT TRUE,
    summary TEXT,
    duties JSONB NOT NULL DEFAULT '[]'::jsonb,
    must_have_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    nice_to_have_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CANDIDATES TALENT POOL TABLE
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    headline VARCHAR(255),
    location VARCHAR(128) NOT NULL,
    years_experience NUMERIC(4, 1) NOT NULL DEFAULT 0,
    skills TEXT[] NOT NULL DEFAULT '{}',
    expected_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    availability_days INTEGER NOT NULL DEFAULT 0,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(64) NOT NULL,
    last_verified_at DATE NOT NULL DEFAULT CURRENT_DATE,
    drive_sync_status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (drive_sync_status IN ('synced', 'queued')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_code VARCHAR(32) UNIQUE NOT NULL,
    job_id UUID NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    stage VARCHAR(32) NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'screening', 'shortlisted', 'submitted', 'interview', 'offer', 'placed', 'rejected', 'withdrawn')),
    source VARCHAR(64) NOT NULL DEFAULT 'Careers site',
    knockout_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    resume_file_url TEXT,
    resume_file_name VARCHAR(255),
    recruiter_notes TEXT,
    is_revealed_to_client BOOLEAN NOT NULL DEFAULT FALSE,
    rejection_reason TEXT,
    client_feedback TEXT,
    is_on_hold BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PLACEMENTS TABLE
CREATE TABLE IF NOT EXISTS placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    candidate_name VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    monthly_salary NUMERIC(12, 2) NOT NULL,
    fee_amount NUMERIC(12, 2) NOT NULL,
    guarantee_days INTEGER NOT NULL DEFAULT 90,
    invoice_status VARCHAR(32) NOT NULL DEFAULT 'Draft' CHECK (invoice_status IN ('Draft', 'Sent', 'Paid', 'Overdue')),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left')),
    left_day INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT & DRIVE LOGS
CREATE TABLE IF NOT EXISTS drive_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    source VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Queued' CHECK (status IN ('Synced', 'Duplicate', 'Needs review', 'Queued')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    actor_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. INDEXES FOR HIGH-SPEED QUERIES
CREATE INDEX IF NOT EXISTS idx_jobs_published ON job_orders(is_published, state);
CREATE INDEX IF NOT EXISTS idx_apps_reference ON applications(reference_code);
CREATE INDEX IF NOT EXISTS idx_apps_job_stage ON applications(job_id, stage);
CREATE INDEX IF NOT EXISTS idx_cands_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_cands_skills ON candidates USING GIN(skills);

-- 9. BLIND RECRUITMENT CLIENT VIEW
-- Masks candidate name and direct contacts until stage is interview, offer, or placed
CREATE OR REPLACE VIEW v_client_candidate_feed AS
SELECT 
    a.id AS application_id,
    a.job_id,
    j.title AS job_title,
    j.client_id,
    a.stage,
    a.is_on_hold,
    CASE 
        WHEN a.is_revealed_to_client OR a.stage IN ('interview', 'offer', 'placed') THEN c.full_name
        ELSE 'Candidate A-' || LPAD((MOD(ABS(HASHTEXT(a.id::text)), 900) + 100)::text, 3, '0')
    END AS display_name,
    c.headline,
    c.location,
    c.years_experience,
    c.skills,
    c.availability_days,
    CASE 
        WHEN a.is_revealed_to_client OR a.stage IN ('interview', 'offer', 'placed') THEN c.email
        ELSE NULL 
    END AS contact_email,
    CASE 
        WHEN a.is_revealed_to_client OR a.stage IN ('interview', 'offer', 'placed') THEN c.phone
        ELSE NULL 
    END AS contact_phone,
    a.updated_at
FROM applications a
JOIN candidates c ON a.candidate_id = c.id
JOIN job_orders j ON a.job_id = j.id
WHERE a.stage IN ('submitted', 'interview', 'offer', 'placed');
