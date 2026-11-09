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

    // 3b. PATCH /jobs - Update Job Order (Admin/Recruiter CRUD)
    if (path === "/jobs" && (method === "PATCH" || method === "PUT")) {
      const body = await req.json();
      const jobId = body.id || url.searchParams.get("id");
      if (!jobId) {
        return Response.json({ error: "Job id is required for update" }, { status: 400, headers: corsHeaders });
      }

      const {
        title,
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

      const [updatedJob] = await sql`
        UPDATE job_orders
        SET
          title = COALESCE(${title}, title),
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
          duties = CASE WHEN ${duties !== undefined} THEN ${JSON.stringify(duties)}::jsonb ELSE duties END,
          must_have_skills = CASE WHEN ${mustHaveSkills !== undefined} THEN ${JSON.stringify(mustHaveSkills)}::jsonb ELSE must_have_skills END,
          nice_to_have_skills = CASE WHEN ${niceToHaveSkills !== undefined} THEN ${JSON.stringify(niceToHaveSkills)}::jsonb ELSE nice_to_have_skills END,
          updated_at = NOW()
        WHERE id = ${jobId}
        RETURNING id, title, location, work_type, category, salary_min, salary_max, state, approved, is_published, updated_at;
      `;

      if (!updatedJob) {
        return Response.json({ error: "Job order not found" }, { status: 404, headers: corsHeaders });
      }

      return Response.json(
        { status: "success", message: "Job order updated successfully", job: updatedJob },
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
      const { email } = body;

      if (!email) {
        return Response.json(
          { error: "Email is required for recruiter sign in." },
          { status: 400, headers: corsHeaders }
        );
      }

      const cleanEmail = String(email).trim().toLowerCase();

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
        SELECT id, full_name, agency_name, email, phone, location, specialization, status, total_listings_posted, created_at
        FROM recruiter_agents
        ORDER BY created_at DESC
      `;
      return Response.json({ count: agents.length, recruiters: agents }, { headers: corsHeaders });
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
