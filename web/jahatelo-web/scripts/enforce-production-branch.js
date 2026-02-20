#!/usr/bin/env node

const env = process.env.VERCEL_ENV;
const commitRef = process.env.VERCEL_GIT_COMMIT_REF;
const allowedBranch = process.env.ALLOWED_PRODUCTION_BRANCH || "main";
const allowWithoutRef = process.env.ALLOW_PROD_DEPLOY_WITHOUT_REF === "1";

if (env !== "production") {
  process.exit(0);
}

if (!commitRef) {
  if (allowWithoutRef) {
    console.warn("[deploy-guard] Production deploy without commit ref allowed by override.");
    process.exit(0);
  }

  console.error(
    "[deploy-guard] Blocked: production deploy without VERCEL_GIT_COMMIT_REF. " +
      "Set ALLOW_PROD_DEPLOY_WITHOUT_REF=1 only for emergency hotfixes."
  );
  process.exit(1);
}

if (commitRef !== allowedBranch) {
  console.error(
    `[deploy-guard] Blocked: production deploys must come from "${allowedBranch}", got "${commitRef}".`
  );
  process.exit(1);
}

console.log(`[deploy-guard] OK: production deploy from allowed branch "${commitRef}".`);
