# Implementation Plan: Inventory Management Dashboard

## Overview

This plan builds the full-stack Inventory Management Dashboard incrementally. It is organized so the entire application is **fully runnable and testable locally** (Docker Compose Postgres, local Express API, local Next.js frontend) before any AWS work begins. AWS provisioning is documented and performed **after** local development completes, following the exact DEPLOYMENT.md order (billing alarms → IAM → VPC → RDS → EC2 → API Gateway → S3 → Amplify → free-tier checklist + teardown).

Every feature carries its own tests co-located with implementation: backend unit/integration tests (Jest + Supertest), frontend component/RTK Query tests (Jest + React Testing Library), and property-based tests (fast-check, 100+ iterations, one test per property, tagged `// Feature: inventory-management-dashboard, Property {n}: {text}`). The 33 correctness properties from the design are each their own optional sub-task placed next to the code they validate.

Tasks marked with `*` are optional (tests) and may be skipped for a faster MVP, but are strongly recommended for this portfolio deliverable.

## Tasks

- [x] 1. Scaffold repository and shared tooling
  - [x] 1.1 Create the two-project repository structure (`/api`, `/frontend`) with a root README stub and shared `.gitignore`, `.editorconfig`, and `.nvmrc`
    - Initialize `/api` as a Node.js + TypeScript project and `/frontend` as a Next.js 15 (App Router) + TypeScript project
    - Configure `tsconfig.json` with `strict: true` in both projects
    - Add ESLint config to both projects, including a rule forbidding direct `fetch`/`axios` usage outside RTK Query endpoint definitions in the frontend
    - Add npm scripts: `lint`, `typecheck`, `test`, `build` in each project
    - _Requirements: 14.1, 15.4, 27.1, 27.2, 27.3, 27.4, 27.5_

- [ ] 2. Local database, Prisma schema, migrations, and seed
  - [x] 2.1 Add Docker Compose configuration for local PostgreSQL
    - Define a `docker-compose.yml` with a Postgres service, healthcheck, and named volume
    - Ensure the container reaches ready-to-accept-connections within 60 seconds
    - _Requirements: 24.1_

  - [x] 2.2 Define the Prisma schema and generate the initial migration
    - Model `Category`, `Product`, `User`, `Expense`, `StockMovement` with all fields, types, uniqueness, enums, and foreign keys per design
    - Add indexes on `Product.name`, `Product.sku`, `Product.categoryId`, `Expense.category`, `Expense.date`, `StockMovement(productId, createdAt)`
    - Generate and commit the initial migration
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 26.3_

  - [x] 2.3 Implement the idempotent seed script (`prisma/seed.ts`)
    - Produce ≥10 products across ≥3 categories, ≥3 users (≥1 admin, ≥1 staff), ≥10 expenses, ≥5 stock movements
    - Use clear-and-reseed or upsert so re-running produces no duplicate-key errors and unchanged counts
    - Exit non-zero with a clear message on DB connection error
    - _Requirements: 13.7, 13.8, 13.9_

  - [ ] 2.4 Write property test for seed idempotence
    - **Property 33: Seed idempotence**
    - **Validates: Requirements 13.8**

  - [ ] 2.5 Write integration test verifying migrations apply cleanly and seed produces minimum data
    - Apply migrations to the isolated test DB and assert schema matches the model; assert seed minimum counts and non-zero exit on bad connection
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.9, 26.3_

- [ ] 3. Backend core: app bootstrap, config, and middleware
  - [x] 3.1 Implement environment validation and fail-fast bootstrap
    - Create `config/env.ts` that loads and validates required vars (database URL, AWS credentials, allowed CORS origins, port); abort startup with a named-variable error when any is absent/empty
    - Create `index.ts` (bootstrap) and `app.ts` (express assembly) with Prisma client singleton (`lib/prisma.ts`)
    - Fail to start within 10s with a connection error if the local DB is unreachable, without partial initialization
    - _Requirements: 14.2, 14.3, 14.4, 24.2, 24.3_

  - [ ] 3.2 Write property test for environment fail-fast
    - **Property 26: Environment fail-fast**
    - **Validates: Requirements 14.4**

  - [ ] 3.3 Implement security, CORS, body-size, and rate-limiting middleware
    - Add `middleware/security.ts` (helmet with `X-Content-Type-Options: nosniff`, CORS restricted to configured deployed origin + localhost, 1 MB body limit → 413)
    - Add `middleware/rateLimit.ts` (express-rate-limit, per-IP, configurable window/max via env, excludes `/health`, 429 with retry indication)
    - _Requirements: 14.5, 14.6, 16.4, 17.1, 17.2, 17.3, 17.4, 23.5, 23.6_

  - [ ] 3.4 Write property test for CORS by origin
    - **Property 27: CORS by origin**
    - **Validates: Requirements 14.5, 14.6, 23.6**

  - [ ] 3.5 Write property test for rate limiting per window
    - **Property 28: Rate limiting per window**
    - **Validates: Requirements 17.1, 17.2, 17.3**

  - [ ] 3.6 Implement Cognito JWT authentication and role resolution middleware
    - Add `middleware/auth.ts` verifying Cognito JWTs via cached JWKS (`aws-jwt-verify`): 401 on missing/malformed/expired token (with expiration message)
    - Resolve role from JWT claim first, falling back to the User DB record; attach `req.user`
    - _Requirements: 11.8, 11.9, 11.10, 12.1, 12.2_

  - [ ] 3.7 Write property test for missing-token rejection
    - **Property 22: Missing-token rejection**
    - **Validates: Requirements 11.8, 12.2**

  - [ ] 3.8 Write property test for expired-token rejection
    - **Property 23: Expired-token rejection**
    - **Validates: Requirements 11.9**

  - [ ] 3.9 Write property test for role resolution precedence
    - **Property 16: Role resolution precedence**
    - **Validates: Requirements 12.1**

  - [ ] 3.10 Implement RBAC authorization guard and Zod validation middleware
    - Add `middleware/authorize.ts` (`requireRole(...)`): Admin allowed on read+write, Staff read-only (403 on write), missing/empty/unrecognized role → 403, no state change
    - Add `middleware/validate.ts` wrapping Zod schemas for body/query/params: 400 with per-field errors before any handler runs; reject strings > 10,000 chars; neutralize control characters/markup
    - _Requirements: 4.4, 12.3, 12.4, 12.5, 12.6, 16.1, 16.2, 16.3_

  - [ ] 3.11 Write property test for unified backend RBAC decision
    - **Property 15: Unified backend RBAC decision**
    - **Validates: Requirements 4.4, 7.9, 12.3, 12.4, 12.5, 12.6**

  - [ ] 3.12 Write property test for unified validation rejection
    - **Property 24: Unified validation rejection**
    - **Validates: Requirements 4.7, 7.8, 16.1, 16.2, 26.5**

  - [ ] 3.13 Write property test for string length limit and sanitization
    - **Property 25: String length limit and sanitization**
    - **Validates: Requirements 16.3**

  - [ ] 3.14 Implement centralized error handler, structured logging, and `/health`
    - Add `middleware/error.ts` mapping error types to sanitized responses (no stack traces, paths, or secrets); set `X-Content-Type-Options: nosniff`
    - Add `config/logger.ts` (pino) and request-logging middleware emitting method, path, status, and response time in ms before the response is sent
    - Add `routes/health.routes.ts`: `GET /health` returns 200 with `{ status, version, uptimeSeconds, database }` within 1000ms; DB-check failure yields `database: "disconnected"` and never 5xx
    - _Requirements: 14.7, 22.2, 22.3, 22.4, 23.5, 23.7_

  - [ ] 3.15 Write property test for request logging completeness
    - **Property 29: Request logging completeness**
    - **Validates: Requirements 22.2**

  - [ ] 3.16 Write property test for security response invariants and error sanitization
    - **Property 30: Security response invariants and error sanitization**
    - **Validates: Requirements 23.5, 23.7**

  - [ ] 3.17 Write unit/example tests for `/health` payload and timing and DB-disconnected behavior
    - Assert `/health` shape, <1000ms, and `disconnected` status on DB-check failure without 5xx
    - _Requirements: 14.7, 22.3, 22.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all backend core and database tests pass, ask the user if questions arise.

- [ ] 5. Backend feature: Products CRUD, search, and image upload
  - [ ] 5.1 Implement product Zod schemas, service, controller, and routes for CRUD
    - Define create/update schemas (name 1-255, sku 1-50, price 0.01-999999.99, stock 0-999999, threshold 0-999999, rating 0-5, valid categoryId)
    - Implement `services/product.service.ts` and `controllers/product.controller.ts`: create (409 on duplicate SKU), update (409 on SKU conflict, updatedAt refreshed), delete, get-by-id (404), and paginated/sorted/filtered list (page/pageSize 10/25/50/100 default 25; sortBy/sortDir; name/sku/categoryId filters) with computed `isLowStock`
    - Wire `routes/product.routes.ts` (write endpoints require Admin)
    - _Requirements: 3.2, 3.3, 3.5, 4.1, 4.2, 4.3, 4.6, 4.7, 4.8_

  - [ ] 5.2 Write property test for create round-trip
    - **Property 11: Create round-trip**
    - **Validates: Requirements 4.1, 7.7**

  - [ ] 5.3 Write property test for update round-trip
    - **Property 12: Update round-trip**
    - **Validates: Requirements 4.2**

  - [ ] 5.4 Write property test for delete removes record
    - **Property 13: Delete removes record**
    - **Validates: Requirements 4.3**

  - [ ] 5.5 Write property test for SKU uniqueness
    - **Property 14: SKU uniqueness**
    - **Validates: Requirements 4.6**

  - [ ] 5.6 Write property test for sort ordering invariant
    - **Property 8: Sort ordering invariant**
    - **Validates: Requirements 3.2**

  - [ ] 5.7 Write property test for pagination invariant
    - **Property 10: Pagination invariant**
    - **Validates: Requirements 3.5, 26.2**

  - [ ] 5.8 Write property test for filter soundness and completeness
    - **Property 9: Filter soundness and completeness**
    - **Validates: Requirements 3.3, 3.4, 7.3, 7.4, 7.5**

  - [ ] 5.9 Implement product search endpoint
    - `GET /products/search` with `q` (min 2 chars): up to 10 case-insensitive partial matches on name/SKU
    - _Requirements: 8.5_

  - [ ] 5.10 Write property test for search matching
    - **Property 19: Search matching**
    - **Validates: Requirements 8.2, 8.5**

  - [ ] 5.11 Implement S3 image upload for product create/update and standalone endpoint
    - Add `lib/s3.ts` (AWS SDK v3 put helper) and multer memory storage; validate size (>0, ≤5 MB) and format (JPEG/PNG/WebP) via magic bytes → 400 with reason; store URL on product
    - `POST /products/:id/image`; on S3 failure return 500 and leave `imageUrl` unchanged
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 5.12 Write property test for image validation decision
    - **Property 18: Image validation decision**
    - **Validates: Requirements 5.2, 5.3**

  - [ ] 5.13 Write integration tests for product CRUD, auth, authorization, validation, and S3 failure (Supertest)
    - Cover create/read/update/delete; valid/expired/malformed/no token → success/401; Admin→success, Staff→403 on writes; invalid-field → 400; S3 failure → 500 with unchanged imageUrl (mocked S3)
    - _Requirements: 18.2, 18.3, 18.4, 18.5, 18.6, 5.4_

- [ ] 6. Backend feature: Stock movements
  - [ ] 6.1 Implement stock movement service, controller, and routes
    - `POST /products/:id/stock-movements`: create record (product id, type, signed quantity, UTC timestamp, initiating user id) and adjust product `stockQuantity` by the signed quantity; 404 if product missing; 400 if quantity zero/non-integer
    - `GET /products/:id/stock-movements`: history newest-first, paginated (default 25, max 100), empty array + 200 when none
    - _Requirements: 26.1, 26.2, 26.4, 26.5, 26.6_

  - [ ] 6.2 Write property test for stock movement creation and stock delta
    - **Property 31: Stock movement creation and stock delta**
    - **Validates: Requirements 26.1**

  - [ ] 6.3 Write property test for stock movement history ordering
    - **Property 32: Stock movement history ordering**
    - **Validates: Requirements 26.2, 26.6**

  - [ ] 6.4 Write integration tests for stock movement endpoints
    - Cover 404 unknown product, 400 invalid quantity, and empty-history 200
    - _Requirements: 26.4, 26.5, 26.6_

- [ ] 7. Backend feature: Expenses
  - [ ] 7.1 Implement expense schemas, service, controller, and routes
    - `GET /expenses` with optional category/startDate/endDate filters (inclusive range); `GET /expenses/by-category` totals; `POST /expenses` (category from set, amount 0.01-999,999,999.99, date ≤ today, notes 0-500) → 400 identifying invalid field; `DELETE /expenses/:id`
    - Writes require Admin (403 for Staff)
    - _Requirements: 7.3, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ] 7.2 Write property test for expense category breakdown
    - **Property 6: Expense category breakdown**
    - **Validates: Requirements 2.2, 7.6**

  - [ ] 7.3 Write integration tests for expense CRUD, filters, authorization, and validation
    - Cover create/read/delete, category and date-range filters, Admin→success/Staff→403, invalid-field → 400
    - _Requirements: 18.3, 18.5, 18.6, 7.3, 7.5, 7.9_

- [ ] 8. Backend feature: Users
  - [ ] 8.1 Implement user service, controller, and routes
    - `GET /users` returns id, name, email, role (linked to Cognito via cognitoSub); `GET /users/me` returns current profile
    - _Requirements: 6.1, 6.4_

  - [ ] 8.2 Write integration tests for user read endpoints and auth behavior
    - Cover list/me, and valid/expired/malformed/no token behavior
    - _Requirements: 18.3, 18.4, 6.1, 6.4_

- [ ] 9. Backend feature: Dashboard aggregations
  - [ ] 9.1 Implement dashboard service, controller, and routes
    - `GET /dashboard/summary` (totalProducts, totalStockValue 2dp, lowStockCount, currentMonthExpenses 2dp); `GET /dashboard/trends` (12 monthly buckets, chronological); `GET /dashboard/expense-breakdown`; `GET /dashboard/popular-products` (top 5 desc by sales volume)
    - Return summary aggregation within 2s for up to 10,000 products
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4_

  - [ ] 9.2 Write property test for product count aggregation
    - **Property 1: Product count aggregation**
    - **Validates: Requirements 1.1, 1.5**

  - [ ] 9.3 Write property test for total stock value aggregation
    - **Property 2: Total stock value aggregation**
    - **Validates: Requirements 1.2, 1.5**

  - [ ] 9.4 Write property test for low-stock predicate and count
    - **Property 3: Low-stock predicate and count**
    - **Validates: Requirements 1.3, 1.5, 3.6**

  - [ ] 9.5 Write property test for current-month expense aggregation
    - **Property 4: Current-month expense aggregation**
    - **Validates: Requirements 1.4**

  - [ ] 9.6 Write property test for twelve-month trend bucketing
    - **Property 5: Twelve-month trend bucketing**
    - **Validates: Requirements 2.1**

  - [ ] 9.7 Write property test for top-products ranking
    - **Property 7: Top-products ranking**
    - **Validates: Requirements 2.3**

- [ ] 10. Checkpoint - Ensure all backend tests pass
  - Ensure all backend feature and property tests pass and coverage targets are met, ask the user if questions arise.

- [ ] 11. Frontend scaffolding: store, API slice, slices, and Cognito
  - [ ] 11.1 Implement Redux store and RTK Query API slice
    - Create `state/store.ts` (configureStore) and `state/api.ts` (createApi) defining ALL endpoints with tag types `['Product','Expense','User','Dashboard','StockMovement']`; base URL from `NEXT_PUBLIC_API_BASE_URL`; `prepareHeaders` injects `Authorization: Bearer <token>`; mutations invalidate affected tags
    - _Requirements: 15.1, 15.2, 15.3, 15.6, 11.6, 24.4_

  - [ ] 11.2 Write property test for authorization header attachment
    - **Property 21: Authorization header attachment**
    - **Validates: Requirements 11.6**

  - [ ] 11.3 Implement theme, layout, and auth slices with Cognito integration
    - `themeSlice` (dark default, persisted to localStorage), `layoutSlice` (sidebar open/close), `authSlice` (user/token/status)
    - `lib/cognito.ts` sign-up/sign-in (amazon-cognito-identity-js) and `lib/auth.ts` token storage; on persistence failure keep theme for session + show message
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 11.1, 11.2, 11.3, 11.4, 11.5, 11.7, 15.5_

  - [ ] 11.4 Write property test for theme persistence round-trip
    - **Property 20: Theme persistence round-trip**
    - **Validates: Requirements 9.3, 9.4**

  - [ ] 11.5 Write RTK Query endpoint tests (mocked) for fetch/error/invalidation and loading/error hook states
    - Successful fetch returns expected data; failed request exposes error state; mutation success invalidates affected tags; hooks expose loading and error states
    - _Requirements: 19.2, 19.5, 15.3, 15.6_

- [ ] 12. Frontend: layout, navigation, and auth pages
  - [ ] 12.1 Implement root layout, Sidebar, Navbar, and drawer with RoleGate
    - Root `layout.tsx` (Redux Provider, theme provider, layout shell); Sidebar with five ordered links (Dashboard, Products, Users, Expenses, Settings), hides Users for Staff, active-link indication; collapses to toggleable drawer <768px; Navbar with global search + profile placeholder fallback; responsive 320-1920px without horizontal scroll
    - `RoleGate` renders admin-only controls only when role is Admin; redirect Staff away from Users URL
    - _Requirements: 4.5, 6.5, 6.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 12.7, 12.8_

  - [ ] 12.2 Write property test for frontend admin-control gating
    - **Property 17: Frontend admin-control gating**
    - **Validates: Requirements 4.5, 6.5, 12.7, 12.8**

  - [ ] 12.3 Write component tests for sidebar navigation and role-based UI rendering
    - Assert five ordered links, active state, Users hidden for Staff; Admin→create/edit/delete present, Staff→absent
    - _Requirements: 19.1, 19.3_

  - [ ] 12.4 Implement sign-in and sign-up pages
    - Sign-up accepts email/password/name with client validation (retain values except password, per-field errors, account-exists handling); sign-in stores JWT on success, shows error and stores nothing on failure
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.7_

  - [ ] 12.5 Write component tests for global search bar
    - Debounced, min 2 chars, ≤10 results, no-results indication, error indication preserving query
    - _Requirements: 19.1, 8.2, 8.3, 8.4, 8.6_

- [ ] 13. Frontend: dashboard, products, expenses, users, search, settings
  - [ ] 13.1 Implement dashboard summary cards and charts
    - `SummaryCard` (loading/error/empty; retains last good values on failure); `TrendChart`, `BreakdownChart`, `TopProductsChart` with independent error/empty states (Recharts)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 2.1, 2.2, 2.3, 2.5, 2.6_

  - [ ] 13.2 Write component tests for dashboard summary cards
    - Assert values render, empty-state zeros, and error indication retaining last values
    - _Requirements: 19.1, 1.5, 1.7_

  - [ ] 13.3 Implement product grid and product form with image upload
    - `ProductGrid` (MUI DataGrid, server-side pagination/sort/filter, `LowStockBadge` on low-stock rows, empty-state on zero matches); `ProductForm` create/edit with `ImageUpload` and client validation mirroring API; `ImageUpload` placeholder on unreachable S3 URL; cache invalidation on mutations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.5, 4.9, 5.5, 5.6_

  - [ ] 13.4 Write component tests for product create/edit form
    - Assert client validation, submit behavior, and admin-only gating
    - _Requirements: 19.1, 19.3_

  - [ ] 13.5 Implement expenses page and users page
    - Expenses: list (category/amount/date/notes), empty-state, category + date-range filters with empty-state, expense chart by category, create/delete for Admin
    - Users: list (name/email/role) within 3s, error and empty states
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 13.6 Implement global search and settings/theme pages
    - `GlobalSearchBar` + `SearchResultsDropdown` (debounced, min 2 chars, ≤10 results within 1s, hide <2 chars, no-results and error indications preserving query); Settings page with dark/light toggle applying within 500ms without reload
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 9.1, 9.2_

- [ ] 14. Checkpoint - Ensure all frontend and backend tests pass locally
  - Ensure the app runs end-to-end locally (Docker Compose Postgres + local API + local frontend) and all tests pass, ask the user if questions arise.

- [ ] 15. CI: GitHub Actions quality gate
  - [ ] 15.1 Add GitHub Actions workflow for lint, typecheck, and tests
    - On PR open/update/reopen against any branch, run ESLint, `tsc --strict`, and Jest suites for both projects; complete within 30 minutes or fail on timeout; any lint/type/test failure fails the workflow and blocks merge
    - _Requirements: 20.1, 20.5, 27.7_

- [ ] 16. AWS deployment guide (DEPLOYMENT.md) authored in deployment order
  - [ ] 16.1 Document AWS account setup and billing alarm (Step 1)
    - Numbered console steps with navigation paths to configure a Billing alarm triggering at estimated charges > $1.00; free-tier note
    - _Requirements: 21.7, 25.3, 25.4_

  - [ ] 16.2 Document IAM setup (Step 2)
    - Console navigation to create least-privilege IAM user/role and access keys used by the API; note secrets go in environment variables only
    - _Requirements: 23.3, 25.3, 25.4_

  - [ ] 16.3 Document VPC/networking setup (Step 3)
    - Console navigation for VPC, subnets, and security groups connecting EC2 and RDS
    - _Requirements: 25.3, 25.4_

  - [ ] 16.4 Document RDS PostgreSQL provisioning (Step 4)
    - Console navigation to create db.t3/t4g.micro, single-AZ, ≤20 GB gp2/gp3; free-tier limit stated; flag any config that would breach free tier
    - _Requirements: 21.1, 21.8, 25.3, 25.4_

  - [ ] 16.5 Document EC2 + pm2 API deployment (Step 5)
    - Console navigation to launch t2/t3.micro (≤750 hrs/month), install runtime, configure env vars, run pm2, and ship logs to CloudWatch within 60s; free-tier limit stated
    - _Requirements: 21.2, 22.1, 25.3, 25.4_

  - [ ] 16.6 Document API Gateway (HTTP API) setup (Step 6)
    - Console navigation to create HTTP API with proxy route to EC2 and HTTPS termination; free-tier request allowance stated
    - _Requirements: 21.5, 23.2, 25.3, 25.4_

  - [ ] 16.7 Document S3 bucket setup (Step 7)
    - Console navigation to create a standard-class bucket (no lifecycle/acceleration/requester-pays) for product images; free-tier note
    - _Requirements: 21.3, 25.3, 25.4_

  - [ ] 16.8 Document Amplify frontend hosting (Step 8)
    - Console navigation to connect the repo, set `NEXT_PUBLIC_API_BASE_URL` at build time, enable HTTPS with HTTP→HTTPS redirect; free-tier build-minutes/served-GB limits stated
    - _Requirements: 20.2, 21.4, 23.1, 15.2, 25.3, 25.4_

  - [ ] 16.9 Document Cognito, deploy CI/CD, free-tier checklist, and teardown
    - Cognito User Pool + App Client within free-tier MAU; note Secrets Manager cost is not free-tier; deploy job connecting via SSH + pm2 restart (fail leaves previous instance running); final free-tier compliance checklist; teardown steps removing all resources
    - _Requirements: 20.3, 20.4, 21.6, 23.4, 25.3, 25.4_

- [ ] 17. Documentation deliverables
  - [ ] 17.1 Author README.md
    - Project summary, Mermaid architecture diagram, tech stack badges, local setup instructions (prereqs, start local Postgres, required env vars DATABASE_URL and NEXT_PUBLIC_API_BASE_URL with localhost examples, commands to start API and frontend), and ≥3 visual demos
    - _Requirements: 24.6, 25.1, 25.7_

  - [ ] 17.2 Author ARCHITECTURE.md
    - For each AWS service: reason chosen, ≥1 alternative considered, ≥1 tradeoff
    - _Requirements: 25.2, 25.7_

  - [ ] 17.3 Add Lessons Learned and resume bullet drafts to documentation
    - "Lessons Learned / Trade-offs" section with ≥3 distinct entries; 2-3 resume bullet drafts each referencing a specific verifiable outcome
    - _Requirements: 25.5, 25.6, 25.7_

- [ ] 18. Final checkpoint - Ensure all tests pass and documentation is complete
  - Ensure all tests pass, CI is green, and all required documentation sections are present and free of placeholders, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (tests) and can be skipped for a faster MVP; for this portfolio deliverable they are strongly recommended.
- The application is fully runnable and testable locally (Tasks 1-15) before any AWS work begins (Tasks 16-17).
- AWS tasks (16.1-16.9) follow the exact DEPLOYMENT.md order: billing alarm → IAM → VPC → RDS → EC2 → API Gateway → S3 → Amplify → Cognito/CI-CD/free-tier checklist/teardown.
- Each of the 33 correctness properties is a single fast-check property test (100+ iterations, tagged `// Feature: inventory-management-dashboard, Property {n}: {text}`) placed next to the code it validates.
- Every feature includes co-located backend and/or frontend tests rather than deferring testing to the end.
- Each task references specific requirements for traceability; checkpoints ensure incremental validation.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1"] },
    { "id": 3, "tasks": ["2.4", "2.5", "3.2", "3.3", "3.6"] },
    { "id": 4, "tasks": ["3.4", "3.5", "3.7", "3.8", "3.9", "3.10", "3.14"] },
    { "id": 5, "tasks": ["3.11", "3.12", "3.13", "3.15", "3.16", "3.17", "5.1", "7.1", "8.1", "9.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "6.1", "7.2", "7.3", "8.2", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7"] },
    { "id": 7, "tasks": ["5.10", "5.11", "6.2", "6.3", "6.4"] },
    { "id": 8, "tasks": ["5.12", "5.13"] },
    { "id": 9, "tasks": ["11.1", "11.3"] },
    { "id": 10, "tasks": ["11.2", "11.4", "11.5", "12.1", "12.4"] },
    { "id": 11, "tasks": ["12.2", "12.3", "12.5", "13.1", "13.3", "13.5", "13.6"] },
    { "id": 12, "tasks": ["13.2", "13.4"] },
    { "id": 13, "tasks": ["15.1"] },
    { "id": 14, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8", "16.9"] },
    { "id": 15, "tasks": ["17.1", "17.2", "17.3"] }
  ]
}
```
