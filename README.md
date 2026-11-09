# Cube Tech Consults — High-Performance Recruitment & ATS Platform

A modern, fast, and responsive React web application rebuild of the **Cube Tech Consults** Recruitment and Applicant Tracking System (ATS). Built with **React 19**, **TypeScript**, **Vite**, and custom design tokens matching the brand sheet (Barlow Condensed, Barlow, IBM Plex Mono, red/yellow/black tri-stripe).

Configured for **Vercel** deployment out of the box.

---

## 🚀 Key Features

### 1. Three Integrated Workspaces
- **Public Careers Site (`#careers`)**:
  - Live job board with keyword search (role, skill) and location filtering (Abuja, Lagos, Port Harcourt, Kano, Remote).
  - Quick status filter pills: *All*, *Open*, *Closing soon*, *Filled or closed*.
  - Direct application flow with file dropzone (PDF/DOCX validation, max 5 MB, "Use a sample CV" shortcut).
  - Skill chips picker with real-time tagging.
  - Pre-screening Knockout questions (KO) and candidate consent.
  - Instant reference code generation (e.g. `CTC-7K4M-92QX`) and duplicate candidate profile merging.
  - Alternative Google Form application modal.
- **Application Tracking (`#track`)**:
  - Reference number + email/phone lookup.
  - OTP verification flow (with prototype preview code).
  - Status stepper: `Received` → `Under review` → `Shortlisted` → `Submitted to employer` → `Interview stage` → `Offer stage` → `Placed` (plus stop states `Not progressed`, `Job closed`, `Withdrawn`).
  - "What happens next" actionable guidance.
  - Candidate self-service: Withdraw application, update contact details, request data deletion.
- **Staff ATS Workspace (`#dashboard`, `#pipeline`, `#pool`, `#job-orders`, `#clients`, `#placements`, `#intake`, `#drive-sync`)**:
  - **Dashboard**: Top KPI metrics (Open jobs, Weekly applications, Pending reviews, Placements, Fees booked in ₦), actionable "Needs your approval" queue, candidate stage distribution bar chart, audit activity feed, and placement guarantee countdown watch.
  - **Pipeline (Kanban)**: 7-stage interactive board with HTML5 drag-and-drop, match score badges (high/mid/low), relative time tags, and mobile stage transition selectors.
  - **Talent Pool**: Searchable candidate database with location filter, days-since-verified tracker, and dynamic **"Rank against a job order"** AI matching engine.
  - **Job Orders**: Scorecard approval status, listing visibility toggles (confidential client name, salary range), closing date tracking, and candidate counts.
  - **Clients**: Client directory with negotiated fee percentages (e.g. 15%), guarantee periods (60/90 days), and 1-click client portal preview.
  - **Placements & Invoicing**: Automated recruitment fee calculations (`Salary × 12 × Client Fee %`), invoice status management (Draft, Sent, Paid, Overdue), guarantee progress bars, and replacement search drafting if a candidate departs early.
  - **Multi-channel Intake**: Careers upload, Google Form integration, Google Drive resumes folder, and Google Sheet log with pause/resume toggle.
  - **Drive Sync**: Simulated Google Drive folder hierarchy (`Cube Tech Recruitment / Client / Role / CV.pdf`), connect/disconnect toggle, and sync audit log with retry capabilities.
- **Client Portal (`#client-portal`)**:
  - Client switcher for multi-client previews.
  - **Blind Recruitment Shield**: Candidate names and contact info remain anonymized (`Candidate A-248`) until the client requests an interview.
  - Client decision flow: Request interview, Put on hold, Pass (with reason feedback: *Not enough experience*, *Salary expectation too high*, *Not the right culture fit*, *Role no longer open*), Make offer, Approve offer.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite 6 (sub-second HMR, optimized tree-shaking, production chunk splitting)
- **Styling**: Native CSS tokens matching the design system (`--display`, `--body`, `--mono`, `--red`, `--yellow`, `--black`, `--tri`)
- **State Management**: Reactive Context Store with `localStorage` persistence and instant factory reset
- **Icons**: Lucide React
- **Hosting**: Vercel (configured with `vercel.json` SPA routing rewrites and cache headers)

---

## 🏃 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v26.9.0)
- npm 9+

### Installation & Run
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
```
The output will be placed in the `dist/` directory.

---

## ☁️ Vercel Deployment

This project is pre-configured for zero-config deployment on **Vercel**:
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, click **"Add New Project"** and select the repository.
3. Framework Preset: **Vite** (auto-detected).
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

The included `vercel.json` ensures all deep routes and client-side navigation work seamlessly with single-page application (SPA) rewrites.

---

## 🧠 Backend Recommendations & Roadmap

While the React frontend is fully functional in client-side state mode (ideal for demos, prototypes, and low-complexity internal use), transitioning to a multi-user production system requires a dedicated backend architecture.

### 1. When is a dedicated backend necessary?
- **Real File Storage & Parsing**: Parsing uploaded PDFs/DOCXs using OCR/LLM APIs (e.g. Gemini 1.5 Flash / Claude) to extract skills, experience, and contact data automatically.
- **Authentication & RBAC**: Differentiating between public applicants, internal recruiters, agency admins, and external hiring clients with secure session cookies or JWTs.
- **Live Google Workspace Integration**: Genuine server-to-server OAuth / Service Account connections to Google Drive (folder creation and file upload), Google Forms webhooks, and Google Sheets bidirectional logging.
- **Automated Notifications**: Sending real transactional emails (Resend / SendGrid) and Nigerian SMS/WhatsApp messages (Termii / Twilio) for application confirmation, OTP verification, and status updates.
- **Payment & Invoicing**: Integrating Paystack or Flutterwave for recruitment fee invoicing and automated receipting.

### 2. Recommended Production Backend Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Frontend                      │
│             (React 19 + Vite / Next.js)                │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST / tRPC
┌───────────────────────────▼────────────────────────────┐
│                    API Gateway / Server                │
│    (Next.js Server Actions / Node.js Hono / Fastify)   │
└──────┬──────────────┬──────────────┬─────────────┬─────┘
       │              │              │             │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│  Database   │ │ File Store │ │  Google   │ │Messaging  │
│ PostgreSQL  │ │Cloudflare  │ │ Workspace │ │  Termii / │
│ (Supabase / │ │  R2 / S3   │ │ Drive API │ │  Resend   │
│    Neon)    │ │            │ │ Sheets API│ │ (WhatsApp)│
└─────────────┘ └────────────┘ └───────────┘ └───────────┘
```

1. **Database**: **PostgreSQL** hosted on **Supabase** or **Neon**.
   - Tables: `clients`, `job_orders`, `candidates`, `applications`, `evaluations`, `placements`, `audit_logs`.
   - Row-Level Security (RLS) ensures hiring clients only see candidates submitted to their specific company, and masks contact info until interview requests.
2. **File Storage**: **Cloudflare R2** or **AWS S3**.
   - Zero egress fees with R2, signed URLs for secure CV downloads, and automatic replication to Google Drive via background worker jobs.
3. **AI Resume Scoring Engine**:
   - Webhook trigger on new CV upload runs Gemini 1.5 Flash / 2.0 to compare candidate CV markdown against the approved scorecard criteria and generate the match score and evidence breakdown.
4. **SMS & WhatsApp Engine**:
   - **Termii** (leading Nigerian SMS/WhatsApp API provider) for OTP verification and WhatsApp status notifications directly to Nigerian mobile numbers (`0803...`).
5. **Billing**:
   - **Paystack** for generating Naira payment links for recruitment placement fees.
