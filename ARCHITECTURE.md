# Architecture & Design Decisions

This document explains the key technical decisions, the AWS services chosen, and the
tradeoffs behind each. For step-by-step deployment, see DEPLOYMENT.md.

## System Overview

The app is a classic three-tier system: a Next.js frontend (Amplify), a stateless
Express API (EC2 behind API Gateway), and a managed PostgreSQL database (RDS). Amazon
Cognito issues JWTs; the API verifies them against Cognito''s JWKS. Product images live in
S3. CloudWatch collects logs and billing alarms.

## Application Design Decisions

### RTK Query as the single HTTP layer
- Reason: one place for caching, tag-based invalidation, and JWT header injection.
- Alternative considered: React Query + a hand-written axios client.
- Tradeoff: RTK Query couples data-fetching to Redux, but removes a class of cache-sync
  bugs and is enforced by an ESLint rule that forbids fetch/axios elsewhere.

### Prisma ORM
- Reason: type-safe queries generated from a single schema; painless migrations.
- Alternative considered: Knex or raw SQL.
- Tradeoff: Prisma''s generated client needs an engine binary at build time (a friction
  point in restricted networks), but the type safety and migration ergonomics win.

### Zod for validation
- Reason: schemas double as the source of TypeScript types (infer once, validate at the
  edge).
- Alternative considered: Joi.
- Tradeoff: Zod has a slightly larger client footprint, but first-class inference keeps
  request types and validators in sync.

### Property-based testing (fast-check)
- Reason: the correctness rules (aggregation, RBAC, pagination, sanitization) are
  universal invariants best expressed as properties over generated inputs.
- Alternative considered: example-based unit tests only.
- Tradeoff: property tests are slower and occasionally surface generator edge cases, but
  they caught real issues (e.g. a whitespace-token case and Headers value normalization).

## AWS Service Decisions

### Amplify Hosting (frontend)
- Reason chosen: Git-connected CI/CD, managed HTTPS, and a generous free tier for a
  Next.js app; build-time injection of NEXT_PUBLIC_API_BASE_URL.
- Alternative considered: S3 + CloudFront static hosting.
- Tradeoff: Amplify is less configurable than a hand-rolled CloudFront distribution, but
  removes cert/CDN wiring and gives push-to-deploy for free.

### EC2 t2.micro + pm2 (API compute)
- Reason chosen: full control of a long-lived Node process; stays within 750 free hours;
  pm2 gives restarts and log shipping to CloudWatch.
- Alternative considered: AWS Lambda (serverless) or App Runner.
- Tradeoff: EC2 means you patch and manage the box, and cold Prisma connections must be
  pooled; in exchange there are no cold starts and no 15-minute execution limits.

### RDS PostgreSQL t3.micro (database)
- Reason chosen: managed backups, patching, and metrics; t3.micro is free-tier eligible.
- Alternative considered: self-hosted PostgreSQL on the same EC2 instance.
- Tradeoff: RDS costs more than co-locating on EC2 once past free tier, but the
  operational safety (automated backups, failover options) is worth it.

### API Gateway (edge)
- Reason chosen: HTTPS termination, throttling, and a stable public endpoint in front of
  EC2.
- Alternative considered: exposing EC2 directly with an nginx TLS proxy.
- Tradeoff: an extra hop and per-request cost past free tier, but built-in throttling and
  TLS without managing certificates on the box.

### S3 (product images)
- Reason chosen: durable, cheap object storage with direct HTTPS URLs.
- Alternative considered: storing images as bytes in PostgreSQL.
- Tradeoff: an extra service and IAM policy to manage, but keeps large binaries out of the
  database and off the app server.

### Cognito (auth)
- Reason chosen: managed user pool, hosted sign-up/sign-in, and JWKS-based JWT
  verification; free tier covers typical MAU.
- Alternative considered: self-managed auth (bcrypt + JWT signing).
- Tradeoff: less control over the exact auth UX, but no password storage, rotation, or
  reset flows to build and secure.

### CloudWatch (observability + cost guardrail)
- Reason chosen: centralized logs from pm2 and a billing alarm at > $1.00 estimated
  charges to prevent surprise costs.
- Alternative considered: third-party log aggregation.
- Tradeoff: CloudWatch querying is basic compared to dedicated tooling, but it is native,
  cheap, and enough for this scope.

## Lessons Learned / Trade-offs

1. Generated clients need a build step in the pipeline. Prisma''s client is not committed;
   it is generated from the schema. Forgetting `prisma generate` breaks typecheck because
   model types (Decimal, WhereInput, enums) are missing. The CI workflow runs
   `prisma generate` before typecheck to make this deterministic.

2. Property-based tests find the edge cases you would never write by hand. A test for
   auth-header injection failed on a token like "! " because the WHATWG Headers API
   trims trailing whitespace from header values. The fix was to generate JWT/base64url
   shaped tokens, which also better reflects real Cognito tokens. Constrain generators to
   the property''s actual precondition.

3. Enforce architecture with tooling, not conventions. An ESLint rule forbids fetch/axios
   outside the RTK Query definition. This makes "all HTTP goes through one layer" a
   guarantee the CI enforces, rather than a rule reviewers must remember.

4. Fail fast on configuration. The API validates every required env var at startup and
   aborts with the missing variable named, and checks the database connection within a
   10-second budget. This turns a class of runtime 500s into a clear boot-time error.

## Resume Bullet Drafts

- Built a full-stack inventory dashboard (Next.js 15 / React 19 / Express / Prisma /
  PostgreSQL) deployed on AWS Free Tier (Amplify, EC2, RDS, S3, API Gateway, Cognito),
  with role-based access control enforced on both the API and the UI.
- Authored 26+ property-based tests (fast-check) covering aggregation, RBAC, pagination,
  input sanitization, and auth invariants; the suite surfaced real defects such as HTTP
  header whitespace normalization before they reached production.
- Enforced a single RTK Query data layer via a custom ESLint rule and a fail-fast config
  validator, and set up a GitHub Actions gate (lint + strict typecheck + tests for both
  projects) that blocks merges on any failure.
