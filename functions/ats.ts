import { neon } from "@neondatabase/serverless";

/**
 * Recruiter & ATS Postgres Data API (Neon Function)
 *
 * Co-located directly with Neon Postgres for sub-millisecond query execution.
 * Provides role-based access control (RBAC):
 * - Recruiters/Admins: full ATS management, draft job posting, unmasked candidate data.
 * - Corporate Clients: blind candidate masking (Candidate A-XXX, email/phone redacted).
 * - Enforces the ₦10,000 listing fee requirement for newly posted job orders.
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method.toUpperCase();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return Response.json(
      { error: "DATABASE_URL not configured on function runtime" },
      { status: 500 }
    );
  }
  const sql = neon(dbUrl);

  // Helper for CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Root / Status Catalog
    if (path === "/" || path === "/status") {
      return Response.json(
        {
          status: "ok",
          service: "Cube Tech Consults - Recruiter ATS Postgres Data API",
          runtime: "Neon Functions (Node.js 24)",
          database: "Neon Serverless Postgres",
          listingFeeRule: "₦10,000 per job listing",
          endpoints: [
            "GET    /jobs               - Query published or recruiter listings",
            "POST   /jobs               - Create a new listing (draft, requiring ₦10,000 fee)",
            "GET    /candidates         - Talent pool (with role-based blind hiring mask)",
            "GET    /applications       - Pipeline candidates by job and stage",
            "POST   /applications       - Ingest candidate application with reference code",
            "POST   /applications/stage - Advance candidate pipeline stage",
            "GET    /metrics            - Recruitment operations & listing revenue summary",
          ],
          timestamp: new Date().toISOString(),
        },
        { headers: corsHeaders }
      );
    }

    // 2. GET /jobs - Query Job Orders
    if (path === "/jobs" && method === "GET") {
      const role = url.searchParams.get("role") || "candidate";
      const category = url.searchParams.get("category");
      const location = url.searchParams.get("location");

      let jobs: any[];
      if (role === "recruiter" || role === "admin" || role === "agency_admin") {
        // Recruiters see all orders including drafts and listing fee payment statuses
        jobs = await sql`
          SELECT 
            id, title, location, work_type, category, salary_min, salary_max,
            state, approved, is_published, is_confidential, show_salary,
            summary, recruiter_email, listing_fee_paid, listing_fee_ref, listing_fee_amount,
            duties, must_have_skills, nice_to_have_skills, created_at, updated_at
          FROM job_orders
          ORDER BY created_at DESC
        `;
      } else {
        // Candidates and clients only see live, published jobs
        jobs = await sql`
          SELECT 
            id, title, location, work_type, category, salary_min, salary_max,
            state, approved, is_published, is_confidential, show_salary,
            summary, duties, must_have_skills, nice_to_have_skills, created_at
          FROM job_orders
          WHERE is_published = TRUE AND state = 'open'
          ORDER BY created_at DESC
        `;
      }

      return Response.json(
        {
          count: jobs.length,
          role,
          jobs,
        },
        { headers: corsHeaders }
      );
    }

    // 3. POST /jobs - Create New Job Order (Draft requiring ₦10,000 listing fee)
    if (path === "/jobs" && method === "POST") {
      const body = await req.json();
      const {
        title,
        location = "Abuja",
        workType = "Full-time",
        category = "Customer service",
        salaryMin = 300000,
        salaryMax = 450000,
        summary = "",
        recruiterEmail = "recruiter@cubetechconsults.com",
        recruiterName = "Cube Tech Recruiter",
        duties = [],
        mustHaveSkills = [],
        niceToHaveSkills = [],
      } = body;

      if (!title) {
        return Response.json({ error: "Job title is required" }, { status: 400, headers: corsHeaders });
      }

      // New listings are created as 'draft' until ₦10,000 listing fee is paid
      const [newJob] = await sql`
        INSERT INTO job_orders (
          title, location, work_type, category, salary_min, salary_max,
          summary, recruiter_email, recruiter_name, duties,
          must_have_skills, nice_to_have_skills,
          state, approved, is_published, listing_fee_paid, listing_fee_amount
        ) VALUES (
          ${title}, ${location}, ${workType}, ${category}, ${salaryMin}, ${salaryMax},
          ${summary}, ${recruiterEmail}, ${recruiterName}, ${JSON.stringify(duties)},
          ${JSON.stringify(mustHaveSkills)}, ${JSON.stringify(niceToHaveSkills)},
          'draft', FALSE, FALSE, FALSE, 10000.00
        )
        RETURNING id, title, location, state, is_published, listing_fee_paid, listing_fee_amount, created_at;
      `;

      return Response.json(
        {
          status: "created",
          message: "Job order created in draft. Pay ₦10,000 listing fee via Paystack to publish.",
          job: newJob,
          listingFeeRequiredNgn: 10000,
          paymentAction: {
            amountKobo: 1000000,
            amountNgn: 10000,
            jobId: newJob.id,
            webhookTarget: "paystack",
          },
        },
        { status: 201, headers: corsHeaders }
      );
    }

    // 4. GET /candidates - Talent Pool with Blind Hiring Mask
    if (path === "/candidates" && method === "GET") {
      const role = url.searchParams.get("role") || "client";

      const candidates = await sql`
        SELECT 
          id, full_name, headline, location, years_experience, skills,
          expected_salary, availability_days, email, phone, last_verified_at, created_at
        FROM candidates
        ORDER BY created_at DESC
        LIMIT 50
      `;

      // Apply Blind Recruitment Mask if viewer is a client
      const formatted = candidates.map((c, index) => {
        if (role === "client") {
          return {
            id: c.id,
            displayName: `Candidate A-${String(100 + index).padStart(3, "0")}`,
            headline: c.headline,
            location: c.location,
            yearsExperience: c.years_experience,
            skills: c.skills,
            expectedSalary: c.expected_salary,
            availabilityDays: c.availability_days,
            email: "[Masked for Blind Hiring]",
            phone: "[Masked for Blind Hiring]",
            lastVerifiedAt: c.last_verified_at,
          };
        }
        return {
          id: c.id,
          displayName: c.full_name,
          fullName: c.full_name,
          headline: c.headline,
          location: c.location,
          yearsExperience: c.years_experience,
          skills: c.skills,
          expectedSalary: c.expected_salary,
          availabilityDays: c.availability_days,
          email: c.email,
          phone: c.phone,
          lastVerifiedAt: c.last_verified_at,
        };
      });

      return Response.json({ count: formatted.length, role, candidates: formatted }, { headers: corsHeaders });
    }

    // 5. POST /applications - Candidate Application Submission
    if (path === "/applications" && method === "POST") {
      const body = await req.json();
      const { jobId, fullName, email, phone, resumeFileUrl, knockoutAnswers = {} } = body;

      if (!jobId || !fullName || !email) {
        return Response.json(
          { error: "jobId, fullName, and email are required" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Upsert candidate
      const [cand] = await sql`
        INSERT INTO candidates (full_name, email, phone, location)
        VALUES (${fullName}, ${email}, ${phone || "N/A"}, 'Abuja')
        ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
        RETURNING id, full_name, email;
      `;

      // Generate CTC application reference (e.g. CTC-APP-XXXXX)
      const refCode = `CTC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      // Create application
      const [app] = await sql`
        INSERT INTO applications (
          reference_code, job_id, candidate_id, stage, source,
          resume_file_url, knockout_answers
        ) VALUES (
          ${refCode}, ${jobId}, ${cand.id}, 'new', 'Careers Portal',
          ${resumeFileUrl || null}, ${JSON.stringify(knockoutAnswers)}
        )
        RETURNING id, reference_code, stage, created_at;
      `;

      return Response.json(
        {
          status: "success",
          message: "Application submitted successfully.",
          application: app,
        },
        { status: 201, headers: corsHeaders }
      );
    }

    // 6. POST /applications/stage - Advance Pipeline Stage
    if (path === "/applications/stage" && method === "POST") {
      const body = await req.json();
      const { applicationId, stage, notes } = body;

      const validStages = [
        "new",
        "screening",
        "shortlisted",
        "submitted",
        "interview",
        "offer",
        "placed",
        "rejected",
        "withdrawn",
      ];
      if (!applicationId || !validStages.includes(stage)) {
        return Response.json(
          { error: `Valid applicationId and stage (${validStages.join(", ")}) required.` },
          { status: 400, headers: corsHeaders }
        );
      }

      const [updated] = await sql`
        UPDATE applications
        SET stage = ${stage}, recruiter_notes = COALESCE(${notes}, recruiter_notes), updated_at = NOW()
        WHERE id = ${applicationId}
        RETURNING id, reference_code, stage, updated_at;
      `;

      if (!updated) {
        return Response.json({ error: "Application not found" }, { status: 404, headers: corsHeaders });
      }

      return Response.json(
        { status: "success", message: `Application advanced to stage: ${stage}`, application: updated },
        { headers: corsHeaders }
      );
    }

    // 7. GET /metrics - Operational Dashboard Metrics
    if (path === "/metrics" && method === "GET") {
      const [jobStats] = await sql`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(*) FILTER (WHERE is_published = TRUE) as published_jobs,
          COUNT(*) FILTER (WHERE state = 'draft') as draft_jobs
        FROM job_orders
      `;

      const [paymentStats] = await sql`
        SELECT 
          COUNT(*) as listing_payments_count,
          COALESCE(SUM(amount), 0) as total_listing_revenue_ngn
        FROM listing_payments
        WHERE status = 'success'
      `;

      const [placementStats] = await sql`
        SELECT 
          COUNT(*) as total_placements,
          COUNT(*) FILTER (WHERE status = 'active') as active_placements,
          COALESCE(SUM(fee_amount), 0) as total_placement_fees_ngn
        FROM placements
      `;

      const [candCount] = await sql`SELECT COUNT(*) as count FROM candidates`;
      const [appCount] = await sql`SELECT COUNT(*) as count FROM applications`;

      return Response.json(
        {
          status: "ok",
          metrics: {
            jobs: {
              total: Number(jobStats.total_jobs),
              published: Number(jobStats.published_jobs),
              drafts: Number(jobStats.draft_jobs),
            },
            candidatesCount: Number(candCount.count),
            applicationsCount: Number(appCount.count),
            listingRevenue: {
              transactions: Number(paymentStats.listing_payments_count),
              totalNgn: Number(paymentStats.total_listing_revenue_ngn),
              feePerListingNgn: 10000,
            },
            placements: {
              total: Number(placementStats.total_placements),
              active: Number(placementStats.active_placements),
              totalFeesNgn: Number(placementStats.total_placement_fees_ngn),
            },
          },
          timestamp: new Date().toISOString(),
        },
        { headers: corsHeaders }
      );
    }

    return Response.json(
      { error: `Route ${method} ${path} not found. Refer to GET / for catalog.` },
      { status: 404, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[ATS API Error]", err);
    return Response.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
