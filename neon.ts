import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: false,
  functions: {
    paystack: {
      name: "Paystack Listing Webhook",
      source: "./functions/paystack.ts",
      env: {
        PAYSTACK_SECRET_KEY: {
          value: process.env.PAYSTACK_SECRET_KEY,
          required: false,
        },
      },
    },
    ats: {
      name: "Recruiter ATS Data API",
      source: "./functions/ats.ts",
    },
    guarantee: {
      name: "Placement Guarantee Cron",
      source: "./functions/guarantee.ts",
    },
  },
  triggers: {
    nightlyGuarantee: {
      type: "schedule",
      function: "guarantee",
      cron: "0 0 * * *",
    },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      return {};
    }
    if (!branch.exists) {
      return { ttl: "7d" };
    }
    return {};
  },
});
