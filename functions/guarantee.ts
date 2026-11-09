import { neon } from "@neondatabase/serverless";
import { parseTriggerDelivery } from "@neon/functions/triggers";

/**
 * Nightly Placement Guarantee & Invoicing Watcher (Neon Function)
 *
 * Triggered on a nightly cron schedule ('0 0 * * *') or called on-demand.
 * 1. Authenticates trigger deliveries using parseTriggerDelivery from @neon/functions/triggers.
 * 2. Continuously audits active placements against their 60-day or 90-day replacement guarantee terms.
 * 3. Flags placements that have safely completed probation without resignation/termination.
 * 4. Identifies candidates approaching the critical 7-day guarantee window for proactive check-in.
 * 5. Identifies overdue corporate placement invoices in Naira (₦) for automated follow-up.
 * 6. Logs structured audit records into Neon Postgres (activity_logs).
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let triggerSource = "manual_http";
  let triggerDetails: any = null;

  // 1. Authenticate Neon Schedule Trigger Delivery if header is present
  if (req.headers.has("x-neon-trigger-invocation-id")) {
    try {
      const delivery = await parseTriggerDelivery(req);
      if (delivery.ok) {
        triggerSource = "neon_schedule_trigger";
        triggerDetails = delivery.invocation;
      }
    } catch (triggerErr) {
      console.warn("[Guarantee Watcher] Trigger delivery parse notice:", triggerErr);
    }
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return Response.json(
      { error: "DATABASE_URL not configured on function runtime" },
      { status: 500 }
    );
  }
  const sql = neon(dbUrl);

  try {
    const today = new Date();

    // 2. Fetch all active placements with client terms
    const activePlacements = await sql`
      SELECT 
        p.id,
        p.candidate_name,
        p.role_title,
        p.start_date,
        p.monthly_salary,
        p.fee_amount,
        p.guarantee_days,
        p.invoice_status,
        p.status,
        p.guarantee_fulfilled,
        c.name as client_name,
        c.fee_percentage
      FROM placements p
      JOIN clients c ON p.client_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.start_date ASC
    `;

    const newlyFulfilled: any[] = [];
    const approachingMilestone: any[] = [];
    const invoiceFollowupsDue: any[] = [];

    // 3. Evaluate each placement against guarantee milestones
    for (const placement of activePlacements) {
      const startDate = new Date(placement.start_date);
      const diffMs = today.getTime() - startDate.getTime();
      const daysActive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const guaranteeDays = placement.guarantee_days || 90;
      const daysRemaining = guaranteeDays - daysActive;

      // Check if guarantee just matured
      if (daysActive >= guaranteeDays && !placement.guarantee_fulfilled) {
        await sql`
          UPDATE placements
          SET guarantee_fulfilled = TRUE, last_audited_at = NOW(), updated_at = NOW()
          WHERE id = ${placement.id}
        `;
        newlyFulfilled.push({
          id: placement.id,
          candidateName: placement.candidate_name,
          client: placement.client_name,
          role: placement.role_title,
          daysActive,
          guaranteePeriod: `${guaranteeDays} days`,
          feeAmountNgn: placement.fee_amount,
          status: "Guarantee fulfilled and secured",
        });
      } else if (daysRemaining > 0 && daysRemaining <= 7) {
        // Approaching within 7 days
        approachingMilestone.push({
          id: placement.id,
          candidateName: placement.candidate_name,
          client: placement.client_name,
          role: placement.role_title,
          daysActive,
          daysRemaining,
          guaranteeDays,
          action: "Schedule 60/90-day retention review check-in with client",
        });
      }

      // Check if fee invoice is outstanding past 30 days
      if (placement.invoice_status !== "Paid" && daysActive >= 30) {
        invoiceFollowupsDue.push({
          id: placement.id,
          client: placement.client_name,
          role: placement.role_title,
          candidateName: placement.candidate_name,
          feeAmountNgn: placement.fee_amount,
          invoiceStatus: placement.invoice_status,
          daysSinceStart: daysActive,
          action: "Send Paystack invoice reminder payment link in Naira",
        });
      }
    }

    // 4. Record audit run in activity_logs
    const auditSummary = {
      triggerSource,
      triggerDetails,
      totalActivePlacements: activePlacements.length,
      newlyFulfilledCount: newlyFulfilled.length,
      approachingMilestoneCount: approachingMilestone.length,
      invoiceFollowupsCount: invoiceFollowupsDue.length,
    };

    await sql`
      INSERT INTO activity_logs (event, message, metadata)
      VALUES (
        'nightly_guarantee_audit',
        ${`Nightly guarantee audit processed ${activePlacements.length} active placements: ${newlyFulfilled.length} fulfilled, ${approachingMilestone.length} approaching, ${invoiceFollowupsDue.length} invoice reminders.`},
        ${JSON.stringify(auditSummary)}
      )
    `;

    return Response.json({
      status: "success",
      job: "Nightly Placement Guarantee & Invoicing Watcher",
      triggerSource,
      auditTimestamp: today.toISOString(),
      summary: auditSummary,
      details: {
        newlyFulfilled,
        approachingMilestone,
        invoiceFollowupsDue,
      },
    });
  } catch (err: any) {
    console.error("[Guarantee Watcher Error]", err);
    return Response.json(
      { error: "Audit job failed", details: err.message },
      { status: 500 }
    );
  }
}
