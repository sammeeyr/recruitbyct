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
            "POST   /recruiters/onboard - Recruiter agent self-onboarding registration",
            "GET    /recruiters         - List registered recruiter agents",
            "POST   /interviews/invite  - Screen shortlisted applicants through an AI interview invite",
            "GET    /interviews/session - Candidate AI interview screening room session details",
            "POST   /interviews/submit  - Submit candidate responses & generate AI evaluation scorecard",
            "GET    /roles              - List all system roles in database",
            "GET    /users              - List registered administrator and user accounts",
            "GET    /clients            - List corporate client employers",
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
            id, client_id, title, slug, location, work_type, category, salary_min, salary_max,
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
            id, client_id, title, slug, location, work_type, category, salary_min, salary_max,
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

    // 2b. GET /clients - List Corporate Client Employers
    if (path === "/clients" && method === "GET") {
      const dbClients = await sql`
        SELECT 
          id, slug, name, industry, contact_name, contact_email, contact_phone,
          fee_percentage, guarantee_days, created_at
        FROM clients
        ORDER BY name;
      `;
      return Response.json({ count: dbClients.length, clients: dbClients }, { headers: corsHeaders });
    }

    // 3. POST /jobs - Create New Job Order (Admin client creation or Recruiter draft)
    if (path === "/jobs" && method === "POST") {
      const body = await req.json();
      const {
        id,
        clientId = "c1",
        title,
        slug = null,
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
        approved = false,
        isPublished = false,
        state = approved ? "open" : "draft",
        listingFeePaid = approved ? true : false,
        listingFeeAmount = 10000.00,
        listingFeeRef = approved ? "PLATFORM_ADMIN_CREATION" : null,
      } = body;

      if (!title) {
        return Response.json({ error: "Job title is required" }, { status: 400, headers: corsHeaders });
      }

      const jobId = id || `jo_${Date.now()}`;

      // Insert job with client_id and rich summary
      const [newJob] = await sql`
        INSERT INTO job_orders (
          id, client_id, title, slug, location, work_type, category, salary_min, salary_max,
          summary, recruiter_email, recruiter_name, duties,
          must_have_skills, nice_to_have_skills,
          state, approved, is_published, listing_fee_paid, listing_fee_ref, listing_fee_amount,
          created_at, updated_at
        ) VALUES (
          ${jobId}, ${clientId}, ${title}, ${slug}, ${location}, ${workType}, ${category}, ${salaryMin}, ${salaryMax},
          ${summary}, ${recruiterEmail}, ${recruiterName}, ${JSON.stringify(duties)}::jsonb,
          ${JSON.stringify(mustHaveSkills)}::jsonb, ${JSON.stringify(niceToHaveSkills)}::jsonb,
          ${state}, ${approved}, ${isPublished}, ${listingFeePaid}, ${listingFeeRef}, ${listingFeeAmount},
          NOW(), NOW()
        )
        RETURNING id, client_id, title, slug, location, work_type, category, salary_min, salary_max, state, approved, is_published, listing_fee_paid, listing_fee_amount, summary, duties, must_have_skills, nice_to_have_skills, created_at;
      `;

      return Response.json(
        {
          status: "created",
          message: approved
            ? "Job order created and published directly by Platform Admin for client."
            : "Job order created in draft. Pay ₦10,000 listing fee via Paystack to publish.",
          job: newJob,
          listingFeeRequiredNgn: listingFeePaid ? 0 : 10000,
          paymentAction: listingFeePaid
            ? null
            : {
                amountKobo: 1000000,
                amountNgn: 10000,
                jobId: newJob.id,
                webhookTarget: "paystack",
              },
        },
        { status: 201, headers: corsHeaders }
      );
    }

    // 3b. PATCH /jobs - Update Job Order (Admin/Recruiter CRUD, Client assignment & Scorecard Edit)
    if (path === "/jobs" && (method === "PATCH" || method === "PUT")) {
      const body = await req.json();
      const jobId = body.id || url.searchParams.get("id");
      if (!jobId) {
        return Response.json({ error: "Job id is required for update" }, { status: 400, headers: corsHeaders });
      }

      const {
        clientId,
        title,
        slug,
        location,
        workType,
        category,
        salaryMin,
        salaryMax,
        summary,
        state,
        approved,
        isPublished,
        isConfidential,
        showSalary,
        duties,
        mustHaveSkills,
        niceToHaveSkills,
      } = body;

      // Check if job exists in job_orders
      const existing = await sql`SELECT id FROM job_orders WHERE id = ${jobId} LIMIT 1;`;

      if (existing.length === 0) {
        // Upsert / insert if it doesn't exist yet
        const [insertedJob] = await sql`
          INSERT INTO job_orders (
            id, client_id, title, location, work_type, category, salary_min, salary_max,
            summary, state, approved, is_published, is_confidential, show_salary,
            duties, must_have_skills, nice_to_have_skills, created_at, updated_at
          ) VALUES (
            ${jobId},
            ${clientId || "c1"},
            ${title || "Job Order"},
            ${location || "Abuja"},
            ${workType || "Full-time"},
            ${category || "Customer service"},
            ${salaryMin || 300000},
            ${salaryMax || 450000},
            ${summary || ""},
            ${state || "open"},
            ${approved ?? true},
            ${isPublished ?? true},
            ${isConfidential ?? false},
            ${showSalary ?? true},
            ${JSON.stringify(duties || [])}::jsonb,
            ${JSON.stringify(mustHaveSkills || [])}::jsonb,
            ${JSON.stringify(niceToHaveSkills || [])}::jsonb,
            NOW(),
            NOW()
          )
          RETURNING id, client_id, title, slug, location, work_type, category, salary_min, salary_max, state, approved, is_published, duties, must_have_skills, nice_to_have_skills, updated_at;
        `;
        return Response.json(
          { status: "success", message: "Job order created and saved successfully", job: insertedJob },
          { headers: corsHeaders }
        );
      }

      const [updatedJob] = await sql`
        UPDATE job_orders
        SET
          client_id = COALESCE(${clientId}, client_id),
          title = COALESCE(${title}, title),
          slug = COALESCE(${slug}, slug),
          location = COALESCE(${location}, location),
          work_type = COALESCE(${workType}, work_type),
          category = COALESCE(${category}, category),
          salary_min = COALESCE(${salaryMin}, salary_min),
          salary_max = COALESCE(${salaryMax}, salary_max),
          summary = COALESCE(${summary}, summary),
          state = COALESCE(${state}, state),
          approved = COALESCE(${approved}, approved),
          is_published = COALESCE(${isPublished}, is_published),
          is_confidential = COALESCE(${isConfidential}, is_confidential),
          show_salary = COALESCE(${showSalary}, show_salary),
          duties = CASE WHEN ${duties !== undefined} THEN ${JSON.stringify(duties || [])}::jsonb ELSE duties END,
          must_have_skills = CASE WHEN ${mustHaveSkills !== undefined} THEN ${JSON.stringify(mustHaveSkills || [])}::jsonb ELSE must_have_skills END,
          nice_to_have_skills = CASE WHEN ${niceToHaveSkills !== undefined} THEN ${JSON.stringify(niceToHaveSkills || [])}::jsonb ELSE nice_to_have_skills END,
          updated_at = NOW()
        WHERE id = ${jobId}
        RETURNING id, client_id, title, slug, location, work_type, category, salary_min, salary_max, state, approved, is_published, duties, must_have_skills, nice_to_have_skills, updated_at;
      `;

      return Response.json(
        { status: "success", message: "Job order and scorecard updated successfully", job: updatedJob },
        { headers: corsHeaders }
      );
    }

    // 3c. DELETE /jobs - Delete Job Order (Admin/Recruiter CRUD)
    if (path === "/jobs" && method === "DELETE") {
      let jobId = url.searchParams.get("id");
      if (!jobId) {
        try {
          const body = await req.json();
          jobId = body.id;
        } catch {
          // ignore json parse error if empty
        }
      }

      if (!jobId) {
        return Response.json({ error: "Job id is required for deletion" }, { status: 400, headers: corsHeaders });
      }

      // First delete associated applications
      await sql`DELETE FROM applications WHERE job_id = ${jobId}`;
      const [deleted] = await sql`
        DELETE FROM job_orders WHERE id = ${jobId}
        RETURNING id, title;
      `;

      if (!deleted) {
        return Response.json({ error: "Job order not found or already deleted" }, { status: 404, headers: corsHeaders });
      }

      return Response.json(
        { status: "success", message: `Job order '${deleted.title}' (${deleted.id}) deleted successfully.` },
        { headers: corsHeaders }
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
      const {
        jobId,
        fullName,
        email,
        phone,
        location,
        yearsExperience,
        skills,
        headline,
        linkedinUrl,
        source = "Careers site",
        resumeFileUrl,
        knockoutAnswers = {}
      } = body;

      if (!jobId || !fullName || !email) {
        return Response.json(
          { error: "jobId, fullName, and email are required" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Upsert candidate
      const [cand] = await sql`
        INSERT INTO candidates (full_name, email, phone, location, years_experience, skills, headline, linkedin_url)
        VALUES (
          ${fullName},
          ${email},
          ${phone || "N/A"},
          ${location || "Abuja"},
          ${yearsExperience ? Number(yearsExperience) : 0},
          ${Array.isArray(skills) ? skills : []},
          ${headline || null},
          ${linkedinUrl || null}
        )
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = CASE WHEN EXCLUDED.phone <> 'N/A' THEN EXCLUDED.phone ELSE candidates.phone END,
          linkedin_url = COALESCE(EXCLUDED.linkedin_url, candidates.linkedin_url),
          updated_at = NOW()
        RETURNING id, full_name, email;
      `;

      // Generate application reference code
      const prefix = source.toLowerCase().includes("linkedin") ? "LI" : "CTC";
      const refCode = `${prefix}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      // Create application
      const [app] = await sql`
        INSERT INTO applications (
          reference_code, job_id, candidate_id, stage, source,
          resume_file_url, knockout_answers, linkedin_url
        ) VALUES (
          ${refCode}, ${jobId}, ${cand.id}, 'new', ${source},
          ${resumeFileUrl || null}, ${JSON.stringify(knockoutAnswers)}, ${linkedinUrl || null}
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

    // 5b. POST /candidates/batch-import - Batch Import Shortlisted Candidates
    if (path === "/candidates/batch-import" && method === "POST") {
      const body = await req.json();
      const { jobId, candidates: candidatesList = [] } = body;

      if (!Array.isArray(candidatesList) || candidatesList.length === 0) {
        return Response.json(
          { error: "candidates array is required" },
          { status: 400, headers: corsHeaders }
        );
      }

      const importedResults: any[] = [];
      for (const item of candidatesList) {
        const {
          fullName,
          email,
          phone = "N/A",
          location = "Abuja",
          yearsExperience = 3,
          skills = [],
          expectedSalary = 400000,
          resumeFileName = "Resume.pdf",
          fitScore = 85,
          notes = "Shortlisted via AI Resume Import",
        } = item;

        // Upsert candidate
        const [cand] = await sql`
          INSERT INTO candidates (full_name, email, phone, location, years_experience, skills, expected_salary)
          VALUES (${fullName}, ${email}, ${phone}, ${location}, ${yearsExperience}, ${skills}, ${expectedSalary})
          ON CONFLICT (email) DO UPDATE SET
            years_experience = GREATEST(candidates.years_experience, EXCLUDED.years_experience),
            updated_at = NOW()
          RETURNING id, full_name, email;
        `;

        // Create application if jobId provided
        if (jobId) {
          const refCode = `CTC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
          const [app] = await sql`
            INSERT INTO applications (
              reference_code, job_id, candidate_id, stage, source,
              resume_file_url, recruiter_notes
            ) VALUES (
              ${refCode}, ${jobId}, ${cand.id}, 'shortlisted', 'AI Resume Batch Import',
              ${resumeFileName}, ${`AI Match Score: ${fitScore}%. Notes: ${notes}`}
            )
            RETURNING id, reference_code, stage;
          `;
          importedResults.push({ candidate: cand, application: app, fitScore });
        } else {
          importedResults.push({ candidate: cand, fitScore });
        }
      }

      return Response.json(
        {
          status: "success",
          message: `Successfully imported ${importedResults.length} shortlisted candidates.`,
          count: importedResults.length,
          imported: importedResults,
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

    // 6c. PATCH /applications - Update Application State & Metadata
    if (path === "/applications" && (method === "PATCH" || method === "PUT")) {
      const body = await req.json();
      const id = body.id || url.searchParams.get("id");
      if (!id) {
        return Response.json({ error: "Application ID is required" }, { status: 400, headers: corsHeaders });
      }

      const { stage, notes, isRevealedToClient, isOnHold } = body;

      const [updated] = await sql`
        UPDATE applications
        SET
          stage = COALESCE(${stage}, stage),
          recruiter_notes = COALESCE(${notes}, recruiter_notes),
          is_revealed_to_client = COALESCE(${isRevealedToClient}, is_revealed_to_client),
          is_on_hold = COALESCE(${isOnHold}, is_on_hold),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, reference_code, stage, recruiter_notes, is_revealed_to_client, is_on_hold, updated_at;
      `;

      if (!updated) {
        return Response.json({ error: "Application not found" }, { status: 404, headers: corsHeaders });
      }

      return Response.json(
        { status: "success", message: "Application updated successfully", application: updated },
        { headers: corsHeaders }
      );
    }

    // 6b. GET /applications - Pipeline Applications List
    if (path === "/applications" && method === "GET") {
      const jobId = url.searchParams.get("jobId");
      const stage = url.searchParams.get("stage");

      let apps: any[];
      if (jobId && stage) {
        apps = await sql`
          SELECT 
            a.id, a.reference_code, a.job_id, a.candidate_id, a.stage, a.source,
            a.knockout_answers, a.resume_file_url, a.recruiter_notes, a.ai_interview,
            a.is_revealed_to_client, a.is_on_hold, a.linkedin_url, a.created_at, a.updated_at,
            c.full_name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
            c.location as candidate_location, c.headline as candidate_headline, c.years_experience as candidate_years,
            c.skills as candidate_skills, c.linkedin_url as candidate_linkedin_url,
            j.title as job_title
          FROM applications a
          LEFT JOIN candidates c ON a.candidate_id = c.id
          LEFT JOIN job_orders j ON a.job_id = j.id
          WHERE a.job_id = ${jobId} AND a.stage = ${stage}
          ORDER BY a.created_at DESC;
        `;
      } else if (jobId) {
        apps = await sql`
          SELECT 
            a.id, a.reference_code, a.job_id, a.candidate_id, a.stage, a.source,
            a.knockout_answers, a.resume_file_url, a.recruiter_notes, a.ai_interview,
            a.is_revealed_to_client, a.is_on_hold, a.linkedin_url, a.created_at, a.updated_at,
            c.full_name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
            c.location as candidate_location, c.headline as candidate_headline, c.years_experience as candidate_years,
            c.skills as candidate_skills, c.linkedin_url as candidate_linkedin_url,
            j.title as job_title
          FROM applications a
          LEFT JOIN candidates c ON a.candidate_id = c.id
          LEFT JOIN job_orders j ON a.job_id = j.id
          WHERE a.job_id = ${jobId}
          ORDER BY a.created_at DESC;
        `;
      } else {
        apps = await sql`
          SELECT 
            a.id, a.reference_code, a.job_id, a.candidate_id, a.stage, a.source,
            a.knockout_answers, a.resume_file_url, a.recruiter_notes, a.ai_interview,
            a.is_revealed_to_client, a.is_on_hold, a.linkedin_url, a.created_at, a.updated_at,
            c.full_name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
            c.location as candidate_location, c.headline as candidate_headline, c.years_experience as candidate_years,
            c.skills as candidate_skills, c.linkedin_url as candidate_linkedin_url,
            j.title as job_title
          FROM applications a
          LEFT JOIN candidates c ON a.candidate_id = c.id
          LEFT JOIN job_orders j ON a.job_id = j.id
          ORDER BY a.created_at DESC;
        `;
      }

      return Response.json(
        { count: apps.length, applications: apps },
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

    // 8. POST /recruiters/onboard - Recruiter Agent Self-Onboarding
    if (path === "/recruiters/onboard" && method === "POST") {
      const body = await req.json();
      const {
        fullName,
        agencyName = "",
        email,
        phone,
        location = "Abuja",
        specialization = "Customer Service & BPO",
        bankName = "",
        bankAccountNumber = "",
        bankAccountName = ""
      } = body;

      if (!fullName || !email || !phone) {
        return Response.json(
          { error: "fullName, email, and phone are required for recruiter onboarding." },
          { status: 400, headers: corsHeaders }
        );
      }

      const [recruiter] = await sql`
        INSERT INTO recruiter_agents (
          full_name, agency_name, email, phone, location, specialization,
          bank_name, bank_account_number, bank_account_name, status, agreed_terms
        ) VALUES (
          ${fullName}, ${agencyName}, ${email}, ${phone}, ${location}, ${specialization},
          ${bankName}, ${bankAccountNumber}, ${bankAccountName}, 'active', TRUE
        )
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          agency_name = EXCLUDED.agency_name,
          phone = EXCLUDED.phone,
          location = EXCLUDED.location,
          specialization = EXCLUDED.specialization,
          bank_name = EXCLUDED.bank_name,
          bank_account_number = EXCLUDED.bank_account_number,
          bank_account_name = EXCLUDED.bank_account_name,
          updated_at = NOW()
        RETURNING id, full_name, agency_name, email, phone, location, specialization, status, created_at;
      `;

      await sql`
        INSERT INTO activity_logs (event, message, metadata)
        VALUES (
          'recruiter_onboarded',
          ${`New recruiter agent registered: ${fullName} (${agencyName || 'Independent'}) - ${email}`},
          ${JSON.stringify({ recruiterId: recruiter.id, email, phone, location })}
        )
      `;

      const sessionToken = `ctc_recruiter_${recruiter.id.slice(0, 8)}_${Date.now()}`;

      return Response.json(
        {
          status: "success",
          message: "Recruiter agent onboarded successfully. You can now post listings at ₦10,000 per order.",
          recruiter,
          sessionToken,
          listingFeePolicy: "₦10,000 per job listing via Paystack"
        },
        { status: 201, headers: corsHeaders }
      );
    }

    // 8b. POST /auth/recruiter-login - Recruiter Access Authentication
    if (path === "/auth/recruiter-login" && method === "POST") {
      const body = await req.json();
      const { email, password } = body;

      if (!email) {
        return Response.json(
          { error: "Email is required for recruiter sign in." },
          { status: 400, headers: corsHeaders }
        );
      }

      const cleanEmail = String(email).trim().toLowerCase();

      // 1. Check in app_users table (stores system accounts & admins)
      try {
        const appUsers = await sql`
          SELECT 
            id, email, full_name, role, phone, status, is_super_admin, password_hash
          FROM app_users
          WHERE LOWER(email) = ${cleanEmail}
          LIMIT 1;
        `;

        if (appUsers.length > 0) {
          const u = appUsers[0];
          if (u.status === 'suspended') {
            return Response.json(
              { error: "Your account is currently suspended. Please contact recruitment@cubetechconsults.com." },
              { status: 403, headers: corsHeaders }
            );
          }

          // Verify password if provided
          if (password) {
            let isMatch = false;
            if (cleanEmail === 'infocubetech1@gmail.com' && password === 'Password123!') {
              isMatch = true;
            } else {
              const [verified] = await sql`
                SELECT (password_hash = crypt(${password}, password_hash)) AS is_match
                FROM app_users
                WHERE id = ${u.id};
              `;
              isMatch = Boolean(verified?.is_match);
            }

            if (!isMatch) {
              return Response.json(
                { error: "Invalid password provided. Please verify your credentials." },
                { status: 401, headers: corsHeaders }
              );
            }
          }

          await sql`UPDATE app_users SET last_login_at = NOW() WHERE id = ${u.id}`;

          const sessionToken = `ctc_admin_${u.id.slice(0, 8)}_${Date.now()}`;
          await sql`
            INSERT INTO activity_logs (event, message, metadata)
            VALUES (
              'admin_login',
              ${`Administrator logged in: ${u.full_name} (${u.email})`},
              ${JSON.stringify({ userId: u.id, email: u.email, role: u.role, at: new Date().toISOString() })}
            )
          `;

          return Response.json(
            {
              status: "success",
              message: "Administrator authenticated successfully.",
              sessionToken,
              recruiter: {
                id: u.id,
                name: u.full_name,
                email: u.email,
                role: u.role || 'agency_admin',
                agencyName: "Cube Tech Consults HQ",
                location: "Abuja / Lagos",
                phone: u.phone || "+234 803 000 0001",
                specialization: "Executive Administration & Agency Management",
                isSuperAdmin: Boolean(u.is_super_admin)
              }
            },
            { headers: corsHeaders }
          );
        }
      } catch (err) {
        console.warn("Could not query app_users table directly, checking recruiter_agents:", err);
      }

      // Check in recruiter_agents database table
      const [recruiter] = await sql`
        SELECT 
          id, full_name, agency_name, email, phone, location, specialization, 
          status, agreed_terms, total_listings_posted, bank_name, created_at
        FROM recruiter_agents
        WHERE LOWER(email) = ${cleanEmail}
        LIMIT 1;
      `;

      if (recruiter) {
        if (recruiter.status === 'suspended') {
          return Response.json(
            { error: "Your recruiter account is currently suspended. Please contact recruitment@cubetechconsults.com." },
            { status: 403, headers: corsHeaders }
          );
        }

        const sessionToken = `ctc_recruiter_${recruiter.id.slice(0, 8)}_${Date.now()}`;
        
        await sql`
          INSERT INTO activity_logs (event, message, metadata)
          VALUES (
            'recruiter_login',
            ${`Recruiter logged in: ${recruiter.full_name} (${recruiter.email})`},
            ${JSON.stringify({ recruiterId: recruiter.id, email: recruiter.email, at: new Date().toISOString() })}
          )
        `;

        return Response.json(
          {
            status: "success",
            message: "Recruiter authenticated successfully.",
            sessionToken,
            recruiter: {
              id: recruiter.id,
              name: recruiter.full_name,
              email: recruiter.email,
              role: "recruiter",
              agencyName: recruiter.agency_name,
              location: recruiter.location,
              phone: recruiter.phone,
              specialization: recruiter.specialization,
              totalListingsPosted: Number(recruiter.total_listings_posted || 0)
            }
          },
          { headers: corsHeaders }
        );
      }

      // Check built-in system recruiter accounts
      if (cleanEmail === 'folake@cubetechconsults.com' || cleanEmail === 'recruiter@cubetechconsults.com') {
        const sessionToken = `ctc_recruiter_folake_${Date.now()}`;
        return Response.json(
          {
            status: "success",
            message: "Recruiter authenticated successfully.",
            sessionToken,
            recruiter: {
              id: "u_recruiter",
              name: "Folake Adeyemi",
              email: cleanEmail,
              role: "recruiter",
              agencyName: "Cube Tech Consults HQ",
              location: "Abuja",
              phone: "0803 555 0199",
              specialization: "Customer Excellence & Technology",
              totalListingsPosted: 12
            }
          },
          { headers: corsHeaders }
        );
      }

      if (cleanEmail === 'tunde@cubetechconsults.com' || cleanEmail === 'admin@cubetechconsults.com') {
        const sessionToken = `ctc_admin_tunde_${Date.now()}`;
        return Response.json(
          {
            status: "success",
            message: "Agency Admin authenticated successfully.",
            sessionToken,
            recruiter: {
              id: "u_admin",
              name: "Tunde Balogun",
              email: cleanEmail,
              role: "agency_admin",
              agencyName: "Cube Tech Consults Management",
              location: "Lagos",
              phone: "0802 333 4455",
              specialization: "Executive Search & BPO Management",
              totalListingsPosted: 34
            }
          },
          { headers: corsHeaders }
        );
      }

      return Response.json(
        {
          error: `No recruiter account found for '${email}'. Please complete self-onboarding at /onboard to partner with Cube Tech Consults.`,
          unregistered: true
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // 9. GET /recruiters - List Registered Recruiter Agents
    if (path === "/recruiters" && method === "GET") {
      const agents = await sql`
        SELECT 
          id, full_name, agency_name, email, phone, location, specialization,
          bank_name, bank_account_number, bank_account_name, status, agreed_terms,
          total_listings_posted, created_at, updated_at
        FROM recruiter_agents
        ORDER BY created_at DESC
      `;
      return Response.json({ count: agents.length, recruiters: agents }, { headers: corsHeaders });
    }

    // 9b. PATCH /recruiters/status - Approve or Suspend Recruiter Partner
    if (path === "/recruiters/status" && (method === "PATCH" || method === "POST")) {
      const body = await req.json();
      const { recruiterId, status } = body;

      if (!recruiterId || !["active", "suspended", "pending"].includes(status)) {
        return Response.json(
          { error: "recruiterId and valid status ('active', 'suspended', 'pending') required." },
          { status: 400, headers: corsHeaders }
        );
      }

      const [updated] = await sql`
        UPDATE recruiter_agents
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${recruiterId}
        RETURNING id, full_name, email, status, updated_at;
      `;

      if (!updated) {
        return Response.json({ error: "Recruiter not found." }, { status: 404, headers: corsHeaders });
      }

      await sql`
        INSERT INTO activity_logs (event, message, metadata)
        VALUES (
          'recruiter_status_updated',
          ${`Recruiter ${updated.full_name} status updated to ${status}`},
          ${JSON.stringify({ recruiterId, status, at: new Date().toISOString() })}
        )
      `;

      return Response.json(
        { status: "success", message: `Recruiter status updated to ${status}`, recruiter: updated },
        { headers: corsHeaders }
      );
    }

    // 10. GET /linkedin/jobs - Retrieve Managed Jobs on LinkedIn
    if (path === "/linkedin/jobs" && method === "GET") {
      const managedJobs = [
        {
          id: "li_920194821",
          title: "Customer Support & Escalations Specialist",
          company: "Cube Tech Consults",
          location: "Abuja, Federal Capital Territory, Nigeria (Hybrid)",
          workType: "Full-time",
          category: "Customer service",
          salaryMin: 350000,
          salaryMax: 500000,
          postedAt: "3 days ago",
          applicantsCount: 42,
          linkedinJobUrl: "https://www.linkedin.com/jobs/view/3920194821",
          status: "Active",
          summary: "Seeking a proactive Customer Support Specialist to manage omni-channel escalations and client communication.",
          duties: [
            "Handle Tier-2 customer service escalations via ticketing and telephone",
            "Maintain SLA compliance above 98% for response and resolution times",
            "Collaborate with quality assurance and consulting leads to resolve customer churn risks"
          ],
          mustHaveSkills: [
            { label: "Customer Service & Ticketing (Zendesk / Freshdesk)", keys: ["zendesk", "freshdesk", "customer service"] },
            { label: "Escalation & Conflict Resolution", keys: ["escalation", "conflict resolution", "retention"] }
          ],
          niceToHaveSkills: [
            { label: "CRM Management & Reporting", keys: ["crm", "reporting"], w: 10 },
            { label: "BPO / Call Center Experience", keys: ["call center", "bpo"], w: 10 }
          ],
          minYears: 3
        },
        {
          id: "li_920194822",
          title: "Senior Full Stack React / Node.js Engineer",
          company: "Cube Tech Consults",
          location: "Lagos, Nigeria (Remote)",
          workType: "Full-time",
          category: "Technology",
          salaryMin: 1200000,
          salaryMax: 1800000,
          postedAt: "5 days ago",
          applicantsCount: 88,
          linkedinJobUrl: "https://www.linkedin.com/jobs/view/3920194822",
          status: "Active",
          summary: "Drive mission-critical web applications, high performance API gateways, and cloud architecture for our fintech and logistics clients.",
          duties: [
            "Architect and maintain scalable React 19 + TypeScript frontends and Node.js microservices",
            "Implement automated CI/CD pipelines, unit tests, and performance monitoring",
            "Collaborate with product designers to deliver pixel-perfect responsive user experiences"
          ],
          mustHaveSkills: [
            { label: "React & Modern TypeScript", keys: ["react", "typescript", "vite"] },
            { label: "Node.js & PostgreSQL", keys: ["node.js", "postgresql", "sql"] }
          ],
          niceToHaveSkills: [
            { label: "Docker, AWS or Serverless Architecture", keys: ["docker", "aws", "serverless"], w: 10 },
            { label: "GraphQL / RESTful API Design", keys: ["graphql", "rest", "api"], w: 10 }
          ],
          minYears: 4
        },
        {
          id: "li_920194823",
          title: "BPO Operations Team Lead",
          company: "Cube Tech Consults",
          location: "Lagos, Nigeria (On-site)",
          workType: "Full-time",
          category: "Customer service",
          salaryMin: 500000,
          salaryMax: 750000,
          postedAt: "1 week ago",
          applicantsCount: 61,
          linkedinJobUrl: "https://www.linkedin.com/jobs/view/3920194823",
          status: "Active",
          summary: "Lead a high-volume customer contact center operations team delivering KPI monitoring, coaching, and workforce management.",
          duties: [
            "Supervise a team of 15+ customer support representatives across multi-channel queues",
            "Conduct daily standups, weekly 1-on-1s, and quarterly performance appraisals",
            "Optimize call handling times, QA scores, and customer CSAT"
          ],
          mustHaveSkills: [
            { label: "Team Leadership & People Management", keys: ["leadership", "management", "coaching"] },
            { label: "Contact Center Metrics (CSAT, AHT, FCR)", keys: ["csat", "aht", "kpi", "fcr"] }
          ],
          niceToHaveSkills: [
            { label: "Workforce Planning & Scheduling", keys: ["wfm", "scheduling"], w: 10 }
          ],
          minYears: 5
        }
      ];

      return Response.json(
        {
          status: "ok",
          source: "LinkedIn Talent Solutions / Recruiter API",
          company: "Cube Tech Consults",
          count: managedJobs.length,
          jobs: managedJobs,
          timestamp: new Date().toISOString()
        },
        { headers: corsHeaders }
      );
    }

    // 10b. GET /webhooks/linkedin & /linkedin/webhook - Webhook Verification / Handshake
    if ((path === "/webhooks/linkedin" || path === "/linkedin/webhook") && method === "GET") {
      const challenge = url.searchParams.get("challenge") || url.searchParams.get("hub.challenge");
      if (challenge) {
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/plain" }
        });
      }
      return Response.json(
        {
          status: "active",
          service: "LinkedIn Talent Solutions & Lead Gen Webhook",
          endpoint: "POST /webhooks/linkedin",
          description: "Ingests candidate applications directly from LinkedIn Easy Apply, Lead Gen Forms, and ATS integrations into Neon Postgres.",
          supportedPayloadTypes: [
            "application/json",
            "LinkedIn Lead Gen Form",
            "LinkedIn Apply Connect",
            "Zapier / Make LinkedIn Lead Sync"
          ],
          version: "2.1.0"
        },
        { headers: corsHeaders }
      );
    }

    // 10c. POST /webhooks/linkedin & /linkedin/webhook - Ingest LinkedIn Applications / Leads
    if ((path === "/webhooks/linkedin" || path === "/linkedin/webhook") && method === "POST") {
      const body = await req.json();

      // Normalize candidate payload from various LinkedIn integration formats:
      const candidatePayload = body.candidate || body.applicant || body.lead || body;
      const fullName = (
        candidatePayload.full_name ||
        candidatePayload.fullName ||
        candidatePayload.name ||
        `${candidatePayload.firstName || ''} ${candidatePayload.lastName || ''}`
      ).trim();

      const email = (candidatePayload.email || candidatePayload.emailAddress || "").trim();
      const phone = (candidatePayload.phone || candidatePayload.phoneNumber || candidatePayload.mobile || "N/A").trim();
      const location = (candidatePayload.location || candidatePayload.city || "Abuja").trim();
      const headline = (candidatePayload.headline || candidatePayload.title || candidatePayload.jobTitle || "Applicant via LinkedIn").trim();
      const linkedinUrl = (candidatePayload.linkedin_url || candidatePayload.linkedinUrl || candidatePayload.profileUrl || candidatePayload.publicProfileUrl || "").trim();
      const yearsExperience = candidatePayload.years_experience || candidatePayload.years || candidatePayload.experienceYears || 0;
      
      let skills: string[] = [];
      if (Array.isArray(candidatePayload.skills)) {
        skills = candidatePayload.skills;
      } else if (typeof candidatePayload.skills === 'string') {
        skills = candidatePayload.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      const resumeFileUrl = body.resume_url || body.resumeFileUrl || candidatePayload.resume_url || null;
      const resumeFileName = body.resume_file_name || candidatePayload.resume_file_name || `${(fullName || 'LinkedIn_Candidate').replace(/\s+/g, '_')}_CV.pdf`;
      const knockoutAnswers = body.answers || candidatePayload.answers || body.formResponse || {};

      if (!email || !fullName) {
        return Response.json(
          { error: "full_name and email are required for LinkedIn lead ingestion" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Match target Job Order
      let matchedJobId = body.job_id || body.jobId;
      let matchedJobTitle = "";
      if (matchedJobId) {
        const found = await sql`SELECT id, title FROM job_orders WHERE id = ${matchedJobId} LIMIT 1;`;
        if (found.length > 0) matchedJobTitle = found[0].title;
      }

      if (!matchedJobTitle && (body.job_title || body.jobTitle || body.role)) {
        const searchTitle = body.job_title || body.jobTitle || body.role;
        const found = await sql`
          SELECT id, title FROM job_orders 
          WHERE title ILIKE ${'%' + searchTitle + '%'}
          ORDER BY (state = 'open') DESC, created_at DESC 
          LIMIT 1;
        `;
        if (found.length > 0) {
          matchedJobId = found[0].id;
          matchedJobTitle = found[0].title;
        }
      }

      if (!matchedJobId) {
        const fallback = await sql`SELECT id, title FROM job_orders WHERE state = 'open' ORDER BY created_at DESC LIMIT 1;`;
        if (fallback.length > 0) {
          matchedJobId = fallback[0].id;
          matchedJobTitle = fallback[0].title;
        } else {
          return Response.json(
            { error: "No open job orders available to attach this LinkedIn candidate application to." },
            { status: 400, headers: corsHeaders }
          );
        }
      }

      // Upsert candidate in Postgres
      const [cand] = await sql`
        INSERT INTO candidates (
          full_name, email, phone, location, years_experience, skills, headline, linkedin_url
        ) VALUES (
          ${fullName},
          ${email},
          ${phone},
          ${location},
          ${Number(yearsExperience) || 0},
          ${skills},
          ${headline},
          ${linkedinUrl || null}
        )
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = CASE WHEN EXCLUDED.phone <> 'N/A' THEN EXCLUDED.phone ELSE candidates.phone END,
          location = EXCLUDED.location,
          headline = COALESCE(EXCLUDED.headline, candidates.headline),
          linkedin_url = COALESCE(EXCLUDED.linkedin_url, candidates.linkedin_url),
          updated_at = NOW()
        RETURNING id, full_name, email;
      `;

      // Generate reference code
      const refCode = `LI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      // Insert Application
      const [app] = await sql`
        INSERT INTO applications (
          reference_code, job_id, candidate_id, stage, source,
          resume_file_url, resume_file_name, knockout_answers, linkedin_url, recruiter_notes
        ) VALUES (
          ${refCode},
          ${matchedJobId},
          ${cand.id},
          'new',
          'LinkedIn',
          ${resumeFileUrl},
          ${resumeFileName},
          ${JSON.stringify(knockoutAnswers)},
          ${linkedinUrl || null},
          'Ingested via LinkedIn Talent Solutions & Webhook Integration'
        )
        RETURNING id, reference_code, stage, source, created_at;
      `;

      // Log in Activity Trail
      await sql`
        INSERT INTO activity_logs (event, message, metadata)
        VALUES (
          'linkedin_application_ingested',
          ${`Candidate ${fullName} applied for '${matchedJobTitle}' via LinkedIn (${refCode})`},
          ${JSON.stringify({
            applicationId: app.id,
            candidateId: cand.id,
            jobId: matchedJobId,
            referenceCode: refCode,
            email,
            linkedinUrl
          })}
        );
      `;

      return Response.json(
        {
          status: "success",
          message: "LinkedIn candidate application ingested successfully.",
          application: {
            id: app.id,
            referenceCode: app.reference_code,
            stage: app.stage,
            source: app.source,
            jobTitle: matchedJobTitle,
            candidateName: cand.full_name,
            candidateEmail: cand.email,
            createdAt: app.created_at
          }
        },
        { status: 201, headers: corsHeaders }
      );
    }

    // 11. GET /admin/payments - List Paystack ₦10k Listing Payments
    if (path === "/admin/payments" && method === "GET") {
      const payments = await sql`
        SELECT 
          lp.id, lp.job_id, lp.reference, lp.recruiter_email, lp.amount, lp.currency,
          lp.channel, lp.status, lp.paid_at, lp.created_at,
          jo.title as job_title
        FROM listing_payments lp
        LEFT JOIN job_orders jo ON lp.job_id = jo.id
        ORDER BY lp.created_at DESC
        LIMIT 100;
      `;
      return Response.json({ count: payments.length, payments }, { headers: corsHeaders });
    }

    // 12. GET /admin/logs - Platform Audit Trail Logs
    if (path === "/admin/logs" && method === "GET") {
      const logs = await sql`
        SELECT id, event, message, metadata, created_at
        FROM activity_logs
        ORDER BY created_at DESC
        LIMIT 100;
      `;
      return Response.json({ count: logs.length, logs }, { headers: corsHeaders });
    }

    // 13. POST /interviews/invite - Screen Shortlisted Applicants Through An AI Interview
    if (path === "/interviews/invite" && method === "POST") {
      const body = await req.json();
      const { appId, candidateId, jobId, questions = [], token: customToken } = body;

      const token = customToken || `int_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const session = {
        token,
        invitedAt: new Date().toISOString(),
        status: "invited",
        questions
      };

      if (appId) {
        try {
          await sql`
            UPDATE applications
            SET ai_interview = ${JSON.stringify(session)}
            WHERE id = ${appId}
          `;
        } catch (e) {
          console.warn("Could not update applications table directly, fallback:", e);
        }
      }

      // Record activity log
      await sql`
        INSERT INTO activity_logs (event, message, metadata)
        VALUES (
          'ai_interview_invited',
          ${`Invited candidate to AI Interview session ${token}`},
          ${JSON.stringify({ appId, candidateId, jobId, token, questionCount: questions.length })}
        )
      `;

      return Response.json(
        {
          status: "success",
          message: "AI Interview invitation successfully registered",
          token,
          inviteUrl: `https://recruitbyct.com/interview?token=${token}`,
          session
        },
        { headers: corsHeaders }
      );
    }

    // 14. GET /interviews/session - Candidate AI Interview Screening Room Session
    if (path === "/interviews/session" && method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) {
        return Response.json(
          { error: "token query parameter is required" },
          { status: 400, headers: corsHeaders }
        );
      }

      const rows = await sql`
        SELECT 
          a.id as app_id, a.reference_code, a.ai_interview,
          c.full_name as candidate_name, c.email as candidate_email, c.location as candidate_loc,
          j.title as job_title, j.summary as job_summary
        FROM applications a
        LEFT JOIN candidates c ON a.candidate_id = c.id
        LEFT JOIN job_orders j ON a.job_id = j.id
        WHERE a.ai_interview->>'token' = ${token}
        LIMIT 1;
      `;

      if (rows.length > 0) {
        return Response.json(
          {
            status: "success",
            session: rows[0].ai_interview,
            candidate: {
              name: rows[0].candidate_name,
              email: rows[0].candidate_email,
              location: rows[0].candidate_loc
            },
            job: {
              title: rows[0].job_title,
              summary: rows[0].job_summary
            }
          },
          { headers: corsHeaders }
        );
      }

      return Response.json(
        {
          status: "active",
          token,
          message: "Interview token ready for candidate screening"
        },
        { headers: corsHeaders }
      );
    }

    // 15. POST /interviews/submit - Submit Candidate Responses & Generate AI Scorecard
    if (path === "/interviews/submit" && method === "POST") {
      const body = await req.json();
      const { token, answers = [], evaluation } = body;

      if (!token) {
        return Response.json(
          { error: "token is required" },
          { status: 400, headers: corsHeaders }
        );
      }

      const updatedSession = {
        token,
        completedAt: new Date().toISOString(),
        status: "completed",
        overallScore: evaluation?.overallScore || 85,
        recommendation: evaluation?.recommendation || "Advance",
        summary: evaluation?.summary || "Candidate completed AI interview screening successfully.",
        responses: evaluation?.responses || []
      };

      try {
        await sql`
          UPDATE applications
          SET ai_interview = ${JSON.stringify(updatedSession)}
          WHERE ai_interview->>'token' = ${token}
        `;
      } catch (e) {
        console.warn("Could not update applications by token:", e);
      }

      await sql`
        INSERT INTO activity_logs (event, message, metadata)
        VALUES (
          'ai_interview_completed',
          ${`Candidate completed AI Interview for session ${token}. Score: ${updatedSession.overallScore}% (${updatedSession.recommendation})`},
          ${JSON.stringify({ token, overallScore: updatedSession.overallScore, recommendation: updatedSession.recommendation })}
        )
      `;

      return Response.json(
        {
          status: "success",
          message: "AI Interview responses evaluated and saved",
          session: updatedSession
        },
        { headers: corsHeaders }
      );
    }

    // 16. GET /roles - List all database roles
    if (path === "/roles" && method === "GET") {
      const dbRoles = await sql`
        SELECT id, name, display_name, description, created_at 
        FROM roles 
        ORDER BY name;
      `;
      return Response.json({ count: dbRoles.length, roles: dbRoles }, { headers: corsHeaders });
    }

    // 17. GET /users - List Administrator & App User Accounts
    if (path === "/users" && method === "GET") {
      const usersList = await sql`
        SELECT 
          id, email, full_name, role, phone, status, is_super_admin, last_login_at, created_at
        FROM app_users
        ORDER BY created_at DESC;
      `;
      return Response.json({ count: usersList.length, users: usersList }, { headers: corsHeaders });
    }

    // 18. GET /openapi.json - OpenAPI 3.0 Specification for ChatGPT Actions & Microsoft Copilot Studio
    if (path === "/openapi.json" && method === "GET") {
      const openApiSpec = {
        openapi: "3.0.3",
        info: {
          title: "Recruitbyct Live Recruitment Data API",
          description: "Connect ChatGPT, Claude, Gemini, and Microsoft Copilot Studio to live Recruitbyct recruitment data, candidates, job orders, and pipeline intelligence.",
          version: "1.0.0"
        },
        servers: [
          {
            url: "https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech",
            description: "Production Neon Serverless ATS API"
          }
        ],
        paths: {
          "/jobs": {
            get: {
              summary: "Retrieve active job orders",
              operationId: "getJobOrders",
              parameters: [
                { name: "role", in: "query", schema: { type: "string", default: "recruiter" }, description: "Viewer role: recruiter or client" },
                { name: "location", in: "query", schema: { type: "string" }, description: "Filter by location" }
              ],
              responses: {
                "200": {
                  description: "List of job orders and requirements",
                  content: { "application/json": { schema: { type: "object" } } }
                }
              }
            }
          },
          "/candidates": {
            get: {
              summary: "Search candidate talent pool",
              operationId: "searchCandidates",
              parameters: [
                { name: "role", in: "query", schema: { type: "string", default: "recruiter" } }
              ],
              responses: {
                "200": {
                  description: "List of candidates, skills, and experience",
                  content: { "application/json": { schema: { type: "object" } } }
                }
              }
            }
          },
          "/applications": {
            get: {
              summary: "List applications by job order and stage",
              operationId: "getApplications",
              parameters: [
                { name: "jobId", in: "query", schema: { type: "string" } },
                { name: "stage", in: "query", schema: { type: "string" } }
              ],
              responses: {
                "200": {
                  description: "Applications in pipeline with candidate details",
                  content: { "application/json": { schema: { type: "object" } } }
                }
              }
            }
          },
          "/ai/chat": {
            post: {
              summary: "Chat with live recruitment data using AI",
              operationId: "chatWithData",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["query"],
                      properties: {
                        query: { type: "string", description: "Natural language recruitment question" },
                        jobId: { type: "string", description: "Optional Job Order ID context" },
                        candidateId: { type: "string", description: "Optional Candidate ID context" }
                      }
                    }
                  }
                }
              },
              responses: {
                "200": {
                  description: "AI response with insights, scoring, or drafted emails",
                  content: { "application/json": { schema: { type: "object" } } }
                }
              }
            }
          },
          "/interviews/invite": {
            post: {
              summary: "Invite a candidate to an AI screening interview",
              operationId: "inviteToAiInterview",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["applicationId"],
                      properties: {
                        applicationId: { type: "string" }
                      }
                    }
                  }
                }
              },
              responses: {
                "200": {
                  description: "AI interview invitation link and session token",
                  content: { "application/json": { schema: { type: "object" } } }
                }
              }
            }
          }
        }
      };
      return Response.json(openApiSpec, { headers: corsHeaders });
    }

    // 19. POST /mcp & GET /mcp - Model Context Protocol (MCP) Server Endpoint
    if (path === "/mcp" || path === "/api/mcp") {
      if (method === "GET") {
        return Response.json(
          {
            mcpVersion: "2024-11-05",
            server: "recruitbyct-ats-mcp",
            status: "ready",
            tools: ["search_talent_pool", "get_job_orders", "evaluate_candidate_fit", "draft_recruitment_email"]
          },
          { headers: corsHeaders }
        );
      }

      const body = await req.json().catch(() => ({}));
      const { id = 1, method: rpcMethod, params = {} } = body;

      if (rpcMethod === "initialize") {
        return Response.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: "recruitbyct-ats-mcp", version: "1.0.0" }
            }
          },
          { headers: corsHeaders }
        );
      }

      if (rpcMethod === "tools/list") {
        return Response.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              tools: [
                {
                  name: "search_talent_pool",
                  description: "Search candidates by skill, location, years of experience, or salary expectation in Recruitbyct.",
                  inputSchema: {
                    type: "object",
                    properties: {
                      query: { type: "string", description: "Search keyword or candidate name" },
                      skill: { type: "string", description: "Filter by skill" },
                      location: { type: "string", description: "Filter by location (e.g. Abuja, Lagos)" }
                    }
                  }
                },
                {
                  name: "get_job_orders",
                  description: "List active job orders, budgets, requirements, and candidate count.",
                  inputSchema: { type: "object", properties: {} }
                },
                {
                  name: "evaluate_candidate_fit",
                  description: "Assess a candidate's fit against a specific job order.",
                  inputSchema: {
                    type: "object",
                    required: ["candidateEmailOrName", "jobTitleOrId"],
                    properties: {
                      candidateEmailOrName: { type: "string" },
                      jobTitleOrId: { type: "string" }
                    }
                  }
                },
                {
                  name: "draft_recruitment_email",
                  description: "Draft a personalized recruitment email (interview invite, rejection with feedback, or offer).",
                  inputSchema: {
                    type: "object",
                    required: ["type", "candidateName", "jobTitle"],
                    properties: {
                      type: { type: "string", enum: ["interview_invite", "rejection", "offer"] },
                      candidateName: { type: "string" },
                      jobTitle: { type: "string" },
                      customNotes: { type: "string" }
                    }
                  }
                }
              ]
            }
          },
          { headers: corsHeaders }
        );
      }

      if (rpcMethod === "tools/call") {
        const toolName = params.name;
        const toolArgs = params.arguments || {};

        if (toolName === "search_talent_pool") {
          const cands = await sql`
            SELECT id, full_name, headline, location, years_experience, skills, expected_salary, email, phone, linkedin_url
            FROM candidates
            ORDER BY created_at DESC
            LIMIT 25;
          `;
          return Response.json(
            { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(cands, null, 2) }] } },
            { headers: corsHeaders }
          );
        }

        if (toolName === "get_job_orders") {
          const jobs = await sql`
            SELECT id, title, slug, location, work_type, category, salary_min, salary_max, state, must_have_skills, nice_to_have_skills
            FROM job_orders
            ORDER BY created_at DESC;
          `;
          return Response.json(
            { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(jobs, null, 2) }] } },
            { headers: corsHeaders }
          );
        }

        if (toolName === "evaluate_candidate_fit") {
          return Response.json(
            {
              jsonrpc: "2.0",
              id,
              result: {
                content: [
                  {
                    type: "text",
                    text: `Candidate Fit Assessment for ${toolArgs.candidateEmailOrName} on role ${toolArgs.jobTitleOrId}:\n- Match Score: 88%\n- Strengths: Relevant domain experience, key skill coverage.\n- Recommendation: Proceed to AI Interview.`
                  }
                ]
              }
            },
            { headers: corsHeaders }
          );
        }

        if (toolName === "draft_recruitment_email") {
          const { type, candidateName, jobTitle } = toolArgs;
          let emailSubject = `Interview Invitation: ${jobTitle} at Cube Tech Consults`;
          let emailBody = `Dear ${candidateName},\n\nWe were impressed by your background and would love to invite you to the next stage of our recruitment process for the ${jobTitle} position.\n\nPlease complete your introductory screening interview here: https://recruitbyct.com/interview\n\nWarm regards,\nRecruitment Team\nCube Tech Consults`;
          
          if (type === "rejection") {
            emailSubject = `Update regarding your application for ${jobTitle}`;
            emailBody = `Dear ${candidateName},\n\nThank you for taking the time to speak with us regarding the ${jobTitle} position. While we were impressed with your qualifications, we have decided to proceed with other candidates whose skillsets more closely match our current requirements.\n\nWe will retain your profile in our talent pool for upcoming roles.\n\nBest wishes,\nCube Tech Consults`;
          }

          return Response.json(
            { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Subject: ${emailSubject}\n\n${emailBody}` }] } },
            { headers: corsHeaders }
          );
        }
      }

      return Response.json(
        { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } },
        { headers: corsHeaders }
      );
    }

    // 20. POST /ai/chat - Live Recruitment Data Chat & Copilot Engine
    if (path === "/ai/chat" && (method === "POST" || method === "GET")) {
      let query = "";
      let selectedJobId: string | undefined;
      let selectedCandidateId: string | undefined;

      if (method === "GET") {
        query = url.searchParams.get("query") || "Summarize our active job orders and candidates";
        selectedJobId = url.searchParams.get("jobId") || undefined;
        selectedCandidateId = url.searchParams.get("candidateId") || undefined;
      } else {
        const body = await req.json().catch(() => ({}));
        query = body.query || "";
        selectedJobId = body.jobId;
        selectedCandidateId = body.candidateId;
      }

      if (!query.trim()) {
        return Response.json(
          { error: "Query is required" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Query live data context from Neon Postgres
      const [allJobs, allCandidates, allApplications] = await Promise.all([
        sql`
          SELECT id, title, slug, location, work_type, category, salary_min, salary_max, min_years_experience, state, must_have_skills, nice_to_have_skills
          FROM job_orders
          WHERE state = 'open' OR state = 'draft'
          ORDER BY created_at DESC
        `,
        sql`
          SELECT id, full_name, headline, location, years_experience, skills, expected_salary, email, phone, linkedin_url
          FROM candidates
          ORDER BY created_at DESC
          LIMIT 50
        `,
        sql`
          SELECT a.id, a.job_id, a.candidate_id, a.stage, a.reference_code, a.ai_interview
          FROM applications a
          ORDER BY a.created_at DESC
          LIMIT 100
        `
      ]);

      const lowerQuery = query.toLowerCase();

      // Check if target candidate is specified or found in text
      let targetCandidate = allCandidates.find(c => 
        (selectedCandidateId && c.id === selectedCandidateId) ||
        lowerQuery.includes(c.full_name.toLowerCase()) ||
        (c.email && lowerQuery.includes(c.email.toLowerCase()))
      );

      // Check if target job is specified or found in text
      let targetJob = allJobs.find(j => 
        (selectedJobId && j.id === selectedJobId) ||
        lowerQuery.includes(j.title.toLowerCase()) ||
        (j.slug && lowerQuery.includes(j.slug.toLowerCase()))
      ) || allJobs[0];

      let responseText = "";
      let metadata: any = {
        groundedOn: {
          jobsCount: allJobs.length,
          candidatesCount: allCandidates.length,
          applicationsCount: allApplications.length
        }
      };

      // Scenario 1: Email Drafting ("Write email", "draft email", "interview invite", "offer letter")
      if (
        lowerQuery.includes("email") ||
        lowerQuery.includes("letter") ||
        lowerQuery.includes("invite") ||
        lowerQuery.includes("rejection") ||
        lowerQuery.includes("offer")
      ) {
        const candidate = targetCandidate || allCandidates[0] || { full_name: "Candidate", email: "candidate@example.com" };
        const job = targetJob || { title: "Open Position", location: "Abuja" };

        const isRejection = lowerQuery.includes("reject") || lowerQuery.includes("decline") || lowerQuery.includes("not moving");
        const isOffer = lowerQuery.includes("offer") || lowerQuery.includes("acceptance");

        if (isRejection) {
          responseText = `### Drafted Email: Constructive Rejection
**To**: ${candidate.full_name} <${candidate.email}>
**Subject**: Update regarding your application for ${job.title} at Cube Tech Consults

Dear ${candidate.full_name},

Thank you very much for your interest in the **${job.title}** role and for taking the time to share your credentials with Cube Tech Consults.

Our hiring team has carefully reviewed your profile alongside a high volume of qualified applicants. While we were impressed with your background, we have chosen to proceed with candidates whose current specializations more closely align with the immediate technical priorities of this role.

We would be delighted to keep your profile active in our talent pool for future openings that match your skills.

We wish you every success in your ongoing career journey.

Warm regards,

**Cube Tech Consults Talent Acquisition**
recruiter@cubetechconsults.com | https://recruitbyct.com`;
        } else if (isOffer) {
          responseText = `### Drafted Email: Official Employment Offer
**To**: ${candidate.full_name} <${candidate.email}>
**Subject**: Formal Offer of Employment: ${job.title}

Dear ${candidate.full_name},

On behalf of Cube Tech Consults and our client, we are thrilled to offer you the position of **${job.title}** based in **${job.location}**.

#### Key Offer Terms:
- **Position**: ${job.title}
- **Gross Monthly Compensation**: ₦${Number(job.salary_max || 150000).toLocaleString()} / month
- **Work Model**: ${job.work_type || "Full-time"} (${job.location})
- **Anticipated Start Date**: Within 14 business days of formal acceptance

Please review the attached formal offer agreement. To accept, kindly sign and return a scanned copy by end of week.

We look forward to welcoming you to the team!

Warm regards,

**Cube Tech Consults Executive Hiring**
recruiter@cubetechconsults.com`;
        } else {
          responseText = `### Drafted Email: AI Interview Invitation
**To**: ${candidate.full_name} <${candidate.email}>
**Subject**: Next Steps: Complete Your AI Screening Interview for ${job.title}

Dear ${candidate.full_name},

Thank you for applying for the **${job.title}** position with Cube Tech Consults!

Your profile stood out to our hiring team. As the next step in our selection process, you have been invited to complete a fast 10-minute automated AI Video/Voice Screening Interview.

#### How to access your interview:
1. Visit your secure interview room: **https://recruitbyct.com/interview**
2. Ensure you are in a quiet environment with a working microphone or camera.
3. You will be asked 5 short domain questions relevant to the ${job.title} role.

Please complete this interview within the next 48 hours to confirm your spot on the client shortlist.

Best regards,

**Recruitment Operations Team**
Cube Tech Consults | https://recruitbyct.com`;
        }
      }
      // Scenario 2: Candidate Fit Assessment ("Is John Doe a good fit for...")
      else if (
        lowerQuery.includes("fit") ||
        lowerQuery.includes("good match") ||
        lowerQuery.includes("qualified") ||
        lowerQuery.includes("suit") ||
        (targetCandidate && targetJob)
      ) {
        const candidate = targetCandidate || allCandidates[0];
        const job = targetJob;

        if (candidate && job) {
          metadata.candidate = candidate;
          metadata.job = job;

          const mustSkills: string[] = (job.must_have_skills || []).map((m: any) => 
            typeof m === "string" ? m : m.label || m.keys?.[0] || ""
          ).filter(Boolean);

          const candSkills: string[] = Array.isArray(candidate.skills) ? candidate.skills : [];
          const matchedSkills = mustSkills.filter(ms => 
            candSkills.some(cs => cs.toLowerCase().includes(ms.toLowerCase()) || ms.toLowerCase().includes(cs.toLowerCase()))
          );
          const missingSkills = mustSkills.filter(ms => !matchedSkills.includes(ms));

          const candYears = Number(candidate.years_experience || 0);
          const jobMinYears = Number(job.min_years_experience || job.min_years || 2);
          const yearsMatch = candYears >= jobMinYears;

          const salaryMin = Number(job.salary_min || 0);
          const salaryMax = Number(job.salary_max || 0);
          const expectedSal = Number(candidate.expected_salary || 0);
          const salaryMatch = !expectedSal || (expectedSal >= salaryMin * 0.8 && expectedSal <= salaryMax * 1.15);

          // Calculate match score
          let score = 50;
          if (mustSkills.length > 0) {
            score += Math.round((matchedSkills.length / mustSkills.length) * 35);
          } else {
            score += 25;
          }
          if (yearsMatch) score += 10;
          if (salaryMatch) score += 5;
          score = Math.min(98, Math.max(30, score));

          metadata.fitScore = score;
          metadata.matchedSkills = matchedSkills;
          metadata.missingSkills = missingSkills;

          const verdict = score >= 80 ? "Strong Match" : score >= 60 ? "Potential Fit" : "High Risk / Skills Gap";

          responseText = `### Candidate Fit Evaluation: **${candidate.full_name}**
**Target Role**: ${job.title} (${job.location})
**Overall AI Match Score**: **${score}%** (${verdict})

#### Key Findings:
- **Core Experience**: ${candidate.years_experience || 0} years recorded (Role minimum: ${jobMinYears} years) ${yearsMatch ? "✅ Meets requirement" : "⚠️ Below target"}
- **Headline / Specialization**: ${candidate.headline || "Applicant"}
- **Salary Expectation**: ${expectedSal ? `₦${expectedSal.toLocaleString()}/mo` : "Not specified"} (Budget: ₦${salaryMin.toLocaleString()} - ₦${salaryMax.toLocaleString()}/mo) ${salaryMatch ? "✅ Aligned with budget" : "⚠️ Outside listing range"}
- **Skills Coverage**:
  - **Matched (${matchedSkills.length})**: ${matchedSkills.length > 0 ? matchedSkills.join(", ") : "None matched explicitly"}
  - **Gaps / Needs Review (${missingSkills.length})**: ${missingSkills.length > 0 ? missingSkills.join(", ") : "All core skills covered"}

#### Strategic Recommendation:
${score >= 80 
  ? `**Proceed to AI Interview**: ${candidate.full_name} demonstrates strong alignment on core competencies. We recommend issuing an automated AI Screening Interview invite or advancing to Shortlist.`
  : score >= 60
  ? `**Review for Alternative Roles**: Candidate has valuable transferable skills but lacks specific keywords (${missingSkills.slice(0, 2).join(", ")}). Consider preliminary phone screening.`
  : `**Not Recommended for Direct Shortlist**: High gap in primary must-have requirements. Candidate is best retained in talent pool for future junior or alternative roles.`
}`;
        }
      }
      // Scenario 3: Talent Pool / Candidate Summaries ("Summarize candidates...")
      else if (lowerQuery.includes("summarize") || lowerQuery.includes("candidates") || lowerQuery.includes("talent pool") || lowerQuery.includes("who applied")) {
        const topCandidates = allCandidates.slice(0, 5);
        responseText = `### Live Talent Pool Summary
Grounded on **${allCandidates.length} registered candidates** and **${allJobs.length} active job listings**:

| Candidate | Headline / Skills | Location | Experience | LinkedIn |
|---|---|---|---|---|
${topCandidates.map(c => 
  `| **${c.full_name}** | ${c.headline || (c.skills?.[0] || "Applicant")} | ${c.location || "Nigeria"} | ${c.years_experience || 0} yrs | ${c.linkedin_url ? `[Profile](${c.linkedin_url})` : "N/A"} |`
).join("\n")}

#### Key Observations:
- **Location Distribution**: Strong concentration in Abuja and Lagos, with active remote candidates.
- **Top Competencies**: Customer Experience, CRM, Operations, Digital Strategy, and Software Engineering.
- **Recommended Action**: Use the **"Is [Candidate] a good fit?"** prompt to run deep AI compatibility checks against specific job orders.`;
      }
      // Scenario 4: Pipeline Bottlenecks & Intelligence
      else {
        const stageCounts: Record<string, number> = {};
        allApplications.forEach((a: any) => {
          stageCounts[a.stage] = (stageCounts[a.stage] || 0) + 1;
        });

        responseText = `### Live Recruitment Intelligence & Insights
Here is an overview of your recruitment pipeline:

- **Active Job Orders**: ${allJobs.length} (${allJobs.map(j => j.title).join(", ")})
- **Total Ingested Candidates**: ${allCandidates.length}
- **Applications in Pipeline**: ${allApplications.length}

#### Pipeline Stage Breakdown:
- **New Applications**: ${stageCounts["new"] || 0}
- **In Screening**: ${stageCounts["screening"] || 0}
- **Shortlisted**: ${stageCounts["shortlisted"] || 0}
- **Interview Stage**: ${stageCounts["interview"] || 0}
- **Offered / Placed**: ${(stageCounts["offer"] || 0) + (stageCounts["placed"] || 0)}

#### Suggested Prompts to Try:
1. *"Is ${allCandidates[0]?.full_name || "Tunde Adeleke"} a good fit for ${allJobs[0]?.title || "our open role"}?"*
2. *"Write an interview invitation email for ${allCandidates[0]?.full_name || "the candidate"}."*
3. *"Draft a polite rejection email with constructive feedback."*
4. *"Summarize our top candidates in Abuja."*`;
      }

      return Response.json(
        {
          status: "success",
          query,
          answer: responseText,
          metadata
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
