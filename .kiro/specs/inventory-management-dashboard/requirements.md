# Requirements Document

## Introduction

A full-stack Inventory Management Dashboard application built with Next.js (App Router, TypeScript) on the frontend and Node.js/Express on the backend, backed by PostgreSQL via Prisma ORM. The application provides inventory tracking, expense management, user/role management, and dashboard analytics. It is deployed exclusively on AWS Free Tier services (Amplify, EC2, RDS, S3, API Gateway, Cognito) and serves as a portfolio/interview-ready project with comprehensive documentation, testing, and CI/CD.

## Glossary

- **Dashboard**: The home page of the application displaying summary cards and charts for inventory and expense analytics.
- **Product**: An inventory item tracked by the system with attributes including name, SKU, price, stock quantity, and category.
- **Category**: A classification group for organizing products.
- **Expense**: A business expenditure record with category, amount, date, and notes.
- **StockMovement**: A record of inventory changes (restock, sale, or adjustment) associated with a product and user.
- **User**: A person registered in the system with a role (admin or staff) linked to an AWS Cognito identity.
- **Frontend**: The Next.js App Router application hosted on AWS Amplify.
- **API**: The Node.js/Express REST backend hosted on AWS EC2.
- **Data_Grid**: The MUI Data Grid component used for tabular data display with sorting, filtering, and pagination.
- **RTK_Query**: Redux Toolkit Query, the data fetching and caching layer used by the Frontend.
- **Prisma**: The ORM used by the API for database access and migrations.
- **S3_Bucket**: The AWS S3 storage bucket used for product image uploads.
- **Cognito**: AWS Cognito service providing authentication (sign up, sign in, JWT sessions).
- **Free_Tier**: AWS Free Tier eligible resource configurations (t2.micro/t3.micro EC2, db.t3.micro/db.t4g.micro RDS single-AZ, etc.).
- **Low_Stock**: A product whose stockQuantity is at or below its reorderThreshold.
- **Admin**: A user role with full create, edit, and delete permissions.
- **Staff**: A user role with view-only permissions.

## Requirements

### Requirement 1: Dashboard Summary Cards

**User Story:** As a user, I want to see summary cards on the dashboard, so that I can quickly understand the current state of inventory and expenses at a glance.

#### Acceptance Criteria

1. WHEN the Dashboard page loads and summary data is successfully retrieved, THE Frontend SHALL display a summary card showing the total number of products as a non-negative integer.
2. WHEN the Dashboard page loads and summary data is successfully retrieved, THE Frontend SHALL display a summary card showing the total stock value computed as the sum of (price × stockQuantity) across all products, displayed with two decimal places.
3. WHEN the Dashboard page loads and summary data is successfully retrieved, THE Frontend SHALL display a summary card showing the count of products whose status is Low_Stock as a non-negative integer.
4. WHEN the Dashboard page loads and summary data is successfully retrieved, THE Frontend SHALL display a summary card showing the sum of expenses dated within the current calendar month, displayed with two decimal places.
5. WHEN the Dashboard page loads and no products exist, THE Frontend SHALL display 0 for the total number of products card and 0.00 for the total stock value card and 0 for the Low_Stock count card.
6. WHEN a client requests aggregated summary data for a dataset of up to 10,000 products, THE API SHALL return the aggregated summary data within 2 seconds.
7. IF retrieval of aggregated summary data fails or does not complete within 2 seconds, THEN THE Frontend SHALL display an error indication on the affected summary cards and SHALL retain the last successfully displayed values without displaying partial or incorrect data.

### Requirement 2: Dashboard Charts

**User Story:** As a user, I want to see charts on the dashboard, so that I can visualize stock trends, expense breakdowns, and popular products over time.

#### Acceptance Criteria

1. WHEN the Dashboard page loads, THE Frontend SHALL display a chart showing sales and stock trends over time using monthly data points for the most recent 12 months.
2. WHEN the Dashboard page loads, THE Frontend SHALL display a chart showing expense category breakdown as a proportional visualization where each segment represents one expense category's share of total expenses.
3. WHEN the Dashboard page loads, THE Frontend SHALL display a chart showing the top 5 products ranked in descending order by sales volume.
4. THE API SHALL provide dedicated endpoints for each chart data aggregation (stock trends, expense breakdown, popular products).
5. IF a chart data endpoint returns no records for the requested period, THEN THE Frontend SHALL display an empty-state indication for that chart in place of the visualization while retaining the other charts.
6. IF a chart data request fails, THEN THE Frontend SHALL display an error indication for the affected chart identifying which chart failed to load, without preventing the remaining charts from rendering.

### Requirement 3: Product List with Data Grid

**User Story:** As a user, I want to view all products in a sortable, filterable, paginated table, so that I can efficiently browse and find inventory items.

#### Acceptance Criteria

1. THE Frontend SHALL display products using the Data_Grid component with columns for name, SKU, price, stock quantity, rating, and category.
2. WHEN a user selects a column header for sorting, THE Data_Grid SHALL reorder all rows by that column's values in ascending order, and WHEN the user selects the same column header again, THE Data_Grid SHALL reorder rows in descending order.
3. WHEN a user applies a filter on the name, SKU, or category column, THE Data_Grid SHALL display only products whose values match the entered filter criteria.
4. IF an applied filter matches zero products, THEN THE Data_Grid SHALL display no rows and show an empty-state message indicating no products match the filter.
5. THE Data_Grid SHALL paginate product results with a selectable page size of 10, 25, 50, or 100 items per page and a default page size of 25 items.
6. WHEN a product has Low_Stock status, THE Data_Grid SHALL display a visual indicator (badge or highlight) on that product's row.

### Requirement 4: Product CRUD Operations

**User Story:** As an admin, I want to create, edit, and delete products, so that I can manage the inventory catalog.

#### Acceptance Criteria

1. WHEN an Admin submits the create product form with valid data (name 1-255 characters, SKU 1-50 characters, price 0.01-999999.99, stockQuantity 0-999999, reorderThreshold 0-999999, rating 0-5, a valid categoryId, and an optional image), THE API SHALL create a new product record and return the created product with a generated id, createdAt, and updatedAt.
2. WHEN an Admin submits the edit product form with valid data for an existing product, THE API SHALL update the existing product record and return the updated product with an updated updatedAt timestamp.
3. WHEN an Admin confirms product deletion for an existing product, THE API SHALL delete the product record and return a success response.
4. IF a Staff user attempts to create, edit, or delete a product, THEN THE API SHALL return a 403 Forbidden response and SHALL NOT modify any product record.
5. WHILE a user has the Staff role, THE Frontend SHALL hide create, edit, and delete controls for products.
6. IF a create or update request contains a SKU that is already assigned to a different product, THEN THE API SHALL reject the request with a 409 Conflict response indicating the SKU is already in use, and SHALL NOT create or modify any product record.
7. IF a create or update request contains invalid field values (outside the ranges specified in criterion 1), THEN THE API SHALL reject the request with a 400 Bad Request response indicating which fields are invalid.
8. IF an edit or delete request references a product ID that does not exist, THEN THE API SHALL return a 404 Not Found response.
9. WHEN a product is created, updated, or deleted, THE RTK_Query cache SHALL be invalidated so the product list reflects the change without a full page reload.

### Requirement 5: Product Image Upload

**User Story:** As an admin, I want to upload product images, so that products have visual representations stored reliably in the cloud.

#### Acceptance Criteria

1. WHEN an Admin uploads an image during product creation or editing, THE API SHALL store the image file in the S3_Bucket and save the resulting URL as the product imageUrl.
2. THE API SHALL accept image files that are greater than 0 bytes and up to 5 MB in size with formats JPEG, PNG, or WebP.
3. IF an uploaded file is 0 bytes, exceeds 5 MB, or has a format other than JPEG, PNG, or WebP, THEN THE API SHALL reject the upload, return a 400 Bad Request response with an error message indicating the specific reason for rejection, and SHALL NOT modify the product imageUrl.
4. IF storing the image file in the S3_Bucket fails, THEN THE API SHALL return a 500 Internal Server Error response with an error message indicating the storage failure, and SHALL NOT modify the product imageUrl.
5. WHEN a product image is requested and the S3_Bucket URL is reachable, THE Frontend SHALL serve the image from the S3_Bucket URL.
6. IF the S3_Bucket URL for a requested product image is unreachable or returns no image, THEN THE Frontend SHALL display a placeholder image indicating the product image is unavailable.

### Requirement 6: User and Role Management

**User Story:** As an admin, I want to view users and their roles, so that I can understand who has access to the system and at what permission level.

#### Acceptance Criteria

1. WHEN an Admin navigates to the Users page, THE Frontend SHALL display a list of all users with their name, email, and role (admin or staff) within 3 seconds of navigation.
2. IF loading the user list fails or does not complete within 3 seconds, THEN THE Frontend SHALL display an error message indicating the user list could not be loaded.
3. IF no users exist in the system, THEN THE Frontend SHALL display an empty-state message indicating no users are available.
4. THE API SHALL return user records linked to Cognito identities via the cognitoSub field.
5. WHILE a user has the Staff role, THE Frontend SHALL hide the Users management page from the sidebar navigation.
6. IF a Staff user navigates directly to the Users page URL, THEN THE Frontend SHALL redirect the user to the Dashboard page and SHALL NOT display the Users page content.

### Requirement 7: Expense Tracking

**User Story:** As a user, I want to track and categorize business expenses, so that I can monitor spending and identify cost patterns.

#### Acceptance Criteria

1. WHEN a user navigates to the Expenses page, THE Frontend SHALL display a list of expenses where each entry shows its category, amount, date, and notes.
2. IF no expense records exist when a user navigates to the Expenses page, THEN THE Frontend SHALL display an empty-state message indicating that no expenses are available.
3. WHEN a user filters expenses by category, THE Frontend SHALL display only expenses whose category matches the selected category.
4. IF no expenses match the selected category or date range filter, THEN THE Frontend SHALL display an empty-state message indicating that no expenses match the applied filter.
5. WHEN a user filters expenses by date range, THE Frontend SHALL display only expenses whose date falls on or between the specified start and end dates, inclusive.
6. WHEN a user views the Expenses page, THE Frontend SHALL display a chart visualizing total expense amount grouped by category.
7. WHEN an Admin submits a new expense where category is a non-empty value from the defined category set, amount is a numeric value between 0.01 and 999,999,999.99, date is a valid calendar date not later than the current date, and notes is a text value of 0 to 500 characters, THE API SHALL create the expense record and return the created record.
8. IF an Admin submits a new expense in which any of category, amount, date, or notes fails its validation rule, THEN THE API SHALL reject the request, return an error response indicating which field is invalid, and SHALL NOT create any expense record.
9. IF a Staff user attempts to create or delete an expense, THEN THE API SHALL return a 403 Forbidden response and SHALL NOT modify any expense record.

### Requirement 8: Global Search

**User Story:** As a user, I want a global search bar, so that I can quickly find products across the entire catalog by name or SKU.

#### Acceptance Criteria

1. THE Frontend SHALL display a global search bar in the top navigation area.
2. WHEN a user has entered a search query of at least 2 characters, THE Frontend SHALL display up to 10 matching product results filtered by name or SKU within 1 second of the user stopping input.
3. WHEN the search query contains fewer than 2 characters or is empty, THE Frontend SHALL hide the search results dropdown.
4. WHEN a search query of at least 2 characters returns no matching products, THE Frontend SHALL display a no-results indication in the results dropdown.
5. THE API SHALL support a search endpoint that performs case-insensitive partial matching on product name and SKU fields.
6. IF the search request fails or does not return results within 5 seconds, THEN THE Frontend SHALL display an error indication in the results dropdown and SHALL preserve the user's entered query.

### Requirement 9: Settings and Theme Toggle

**User Story:** As a user, I want to toggle between dark and light mode and manage basic settings, so that I can customize the application appearance to my preference.

#### Acceptance Criteria

1. THE Frontend SHALL provide a settings page containing a theme toggle control that offers exactly two selectable options: dark mode and light mode.
2. WHEN a user selects a theme option, THE Frontend SHALL apply the selected theme across all pages within 500 milliseconds without triggering a page reload.
3. WHEN a user selects a theme option, THE Frontend SHALL persist the selected theme preference in browser local storage such that it is retained across browser sessions.
4. WHEN the application loads and a persisted theme preference exists in local storage, THE Frontend SHALL apply that persisted theme before rendering visible content.
5. WHEN the application loads and no persisted theme preference exists in local storage, THE Frontend SHALL apply dark mode as the default theme.
6. IF persisting the theme preference to local storage fails, THEN THE Frontend SHALL keep the selected theme applied for the current session and display a message indicating the preference could not be saved.

### Requirement 10: Responsive Layout with Navigation

**User Story:** As a user, I want a responsive layout with persistent sidebar navigation and top navbar, so that I can navigate the application on any device size.

#### Acceptance Criteria

1. THE Frontend SHALL display a persistent sidebar navigation containing exactly five links labeled Dashboard, Products, Users, Expenses, and Settings, ordered top to bottom.
2. WHEN a user selects a sidebar navigation link, THE Frontend SHALL visually indicate that link as the active link and display the corresponding page content.
3. THE Frontend SHALL display a top navbar containing the global search bar and the authenticated user's profile information.
4. WHILE the viewport width is less than 768px, THE Frontend SHALL collapse the sidebar into a toggleable drawer that is hidden by default.
5. WHEN a user activates the drawer toggle control while the viewport width is less than 768px, THE Frontend SHALL open or close the drawer within 500 milliseconds.
6. THE Frontend SHALL render all pages without horizontal scrolling and without clipped or overlapping content for viewport widths from 320px to 1920px inclusive.
7. IF the authenticated user's profile information is unavailable, THEN THE Frontend SHALL display the navbar with a placeholder profile indicator and preserve access to the global search bar.

### Requirement 11: Authentication with AWS Cognito

**User Story:** As a user, I want to sign up, sign in, and maintain a secure session, so that my data is protected and actions are attributed to my identity.

#### Acceptance Criteria

1. THE Frontend SHALL provide a sign-up page that accepts email, password, and name, and registers a new user with Cognito.
2. WHEN a user submits the sign-up form with an email in valid email format, a name between 1 and 256 characters, and a password meeting the configured Cognito password policy, THE Frontend SHALL submit the registration request to Cognito.
3. IF a user submits the sign-up form with a missing or malformed field, or with a password that does not meet the configured Cognito password policy, THEN THE Frontend SHALL reject the submission, retain the entered values except the password, and display an error indicating which field is invalid.
4. IF Cognito rejects a registration because the email is already registered, THEN THE Frontend SHALL display an error indicating the account already exists and SHALL NOT create a duplicate account.
5. THE Frontend SHALL provide a sign-in page that accepts email and password and authenticates the user with Cognito.
6. WHEN a user signs in successfully, THE Frontend SHALL receive a JWT token from Cognito, store the JWT token, and include it in all subsequent API requests as an Authorization header.
7. IF sign-in fails because the credentials are invalid, THEN THE Frontend SHALL display an error indicating authentication failed and SHALL NOT store any JWT token.
8. WHEN a request arrives without a valid JWT token, THE API SHALL return a 401 Unauthorized response.
9. WHEN a request arrives with an expired JWT token, THE API SHALL return a 401 Unauthorized response with a message indicating token expiration.
10. THE API SHALL validate JWT tokens against the Cognito User Pool for every protected route.

### Requirement 12: Role-Based Access Control

**User Story:** As a system owner, I want role-based access enforced on both frontend and backend, so that admin and staff users have appropriate permissions.

#### Acceptance Criteria

1. WHEN the API receives a protected request, THE API SHALL extract the user role by first reading the authenticated JWT role claim, and IF the JWT role claim is absent, THEN THE API SHALL read the role from the User database record.
2. IF a protected request has no valid authentication token, THEN THE API SHALL reject the request with a 401 Unauthorized response and perform no state change.
3. IF the resolved user role is missing, empty, or not one of the recognized roles (Admin, Staff), THEN THE API SHALL reject the request with a 403 Forbidden response, provide an error indication that the role is not authorized, and perform no state change.
4. WHEN an Admin makes a request to a write endpoint (create, update, delete), THE API SHALL allow the operation.
5. WHEN either an Admin or a Staff user makes a request to a read endpoint, THE API SHALL allow the operation.
6. IF a Staff user makes a request to a write endpoint (create, update, delete), THEN THE API SHALL reject the request with a 403 Forbidden response, provide an error indication that the action is forbidden for the role, and perform no state change.
7. WHILE the authenticated user role is Admin, THE Frontend SHALL render the admin-only UI elements (create, edit, delete buttons).
8. WHILE the authenticated user role is Staff, or the role is missing or unrecognized, THE Frontend SHALL hide the admin-only UI elements (create, edit, delete buttons) so they are not visible or interactive.

### Requirement 13: Database Schema and Migrations

**User Story:** As a developer, I want a well-structured database schema with migrations, so that the data model supports all application features and can evolve over time.

#### Acceptance Criteria

1. THE Prisma schema SHALL define a Product model with fields: id (auto-generated UUID or integer primary key), name (string, not null), sku (string, unique, not null), price (decimal, not null), stockQuantity (integer, not null), reorderThreshold (integer, not null), rating (decimal, not null), categoryId (foreign key, not null), imageUrl (string, nullable), createdAt (timestamp, auto-set on creation), updatedAt (timestamp, auto-updated on modification).
2. THE Prisma schema SHALL define a Category model with fields: id (auto-generated primary key), name (string, not null, unique), description (string, nullable).
3. THE Prisma schema SHALL define a User model with fields: id (auto-generated primary key), cognitoSub (string, unique, not null), name (string, not null), email (string, not null), role (enum with values admin and staff, not null).
4. THE Prisma schema SHALL define an Expense model with fields: id (auto-generated primary key), category (string, not null), amount (decimal, not null), date (date, not null), notes (string, nullable).
5. THE Prisma schema SHALL define a StockMovement model with fields: id (auto-generated primary key), productId (foreign key, not null), type (enum with values restock, sale, adjustment, not null), quantity (integer, not null), createdAt (timestamp, auto-set on creation), createdByUserId (foreign key, not null).
6. THE Prisma schema SHALL define foreign key relationships: Product.categoryId → Category.id, StockMovement.productId → Product.id, StockMovement.createdByUserId → User.id.
7. THE API project SHALL include a seed script that populates the database with at least 10 products across at least 3 categories, at least 3 users (at least 1 admin and 1 staff), at least 10 expenses, and at least 5 stock movements.
8. WHEN the seed script is executed against a database that already contains seed data, THE seed script SHALL either skip creation of duplicate records or clear and re-seed, without producing duplicate key errors.
9. IF the seed script encounters a database connection error, THEN THE seed script SHALL terminate with a non-zero exit code and emit an error message identifying the connection failure.

### Requirement 14: Backend Architecture

**User Story:** As a developer, I want a clean, well-structured Express API, so that the codebase is maintainable and follows separation of concerns.

#### Acceptance Criteria

1. THE API SHALL organize source code such that HTTP route definitions, request-handling controller functions, and service/data-access logic each reside in separate modules, with no data-access or external-service calls made directly inside route definition files.
2. THE API SHALL read all configuration values, including database URL, AWS credentials, allowed CORS origins, and listening port, from environment variables loaded via a .env file.
3. THE API SHALL contain no literal secret or credential values in source code, such that all secrets and credentials are supplied exclusively through environment variables.
4. WHEN the API starts and any required environment variable (database URL, AWS credentials, allowed CORS origins, or port) is absent or empty, THE API SHALL abort startup, refrain from listening for requests, and emit a startup error message identifying the missing variable by name.
5. WHEN the API receives a request whose Origin header matches the configured deployed Frontend origin or a localhost origin, THE API SHALL include the CORS headers that permit the request.
6. IF the API receives a cross-origin request whose Origin header matches neither the configured deployed Frontend origin nor a localhost origin, THEN THE API SHALL omit the CORS headers that would permit the request so that the browser blocks the response.
7. WHEN the API receives a GET request to the /health endpoint, THE API SHALL respond within 1000 milliseconds with a 200 OK response whose body indicates that the service is running and reports the current service uptime.

### Requirement 15: Frontend Architecture with RTK Query

**User Story:** As a developer, I want all data fetching done through RTK Query with proper cache management, so that the frontend has consistent, performant data access without manual fetch calls.

#### Acceptance Criteria

1. THE Frontend SHALL use RTK_Query createApi to define all API endpoints, where each endpoint specifies the HTTP method (GET, POST, PUT, DELETE) and URL path corresponding to its backend route.
2. THE Frontend SHALL configure the RTK_Query base URL from the NEXT_PUBLIC_API_BASE_URL environment variable such that changing the variable value at build time changes all API request targets without code modification.
3. WHEN a mutation endpoint (create, update, delete) succeeds, THE Frontend SHALL invalidate the RTK_Query cache tags associated with the affected resource so that subsequent queries refetch the updated data.
4. THE Frontend source code SHALL not contain any direct usage of the fetch API, axios library, or equivalent HTTP client in components or hooks outside of RTK_Query endpoint definitions.
5. THE Frontend SHALL use Redux Toolkit createSlice for global state management of theme preference, sidebar open/close state, and authenticated user session data.
6. IF an RTK_Query request fails, THEN THE Frontend SHALL expose the error state through the query hook return value so that consuming components can display an appropriate error indication.

### Requirement 16: Input Validation

**User Story:** As a developer, I want all API inputs validated, so that the system rejects malformed data before processing.

#### Acceptance Criteria

1. WHEN THE API receives a request, THE API SHALL validate the request body, query parameters, and path parameters against a defined schema using a schema validation library (Zod or Joi) before executing any route handler logic.
2. IF a request contains input that does not conform to the defined schema, THEN THE API SHALL reject the request with a 400 Bad Request response, return an error message identifying each failed field and the reason for failure, and SHALL NOT execute the route handler or persist any data from the request.
3. WHEN THE API receives a string input, THE API SHALL reject the request with a 400 Bad Request response IF any string field exceeds 10,000 characters, and SHALL neutralize control characters and markup so that stored or reflected values contain no executable script or query syntax.
4. IF a request body exceeds 1 MB, THEN THE API SHALL reject the request with a 413 Payload Too Large response and SHALL NOT process the request body.

### Requirement 17: Rate Limiting

**User Story:** As a system owner, I want API rate limiting, so that the system is protected against abuse and excessive request volumes.

#### Acceptance Criteria

1. THE API SHALL enforce a per-IP-address request limit using express-rate-limit middleware, applied globally to all routes except the /health endpoint, with a configurable time window (default 15 minutes) and a configurable maximum request count per window (default 100 requests per IP).
2. WHILE a client's request count for the current window is at or below the configured maximum, THE API SHALL process the request normally.
3. IF a client's request count within the current window exceeds the configured maximum, THEN THE API SHALL reject the request with a 429 Too Many Requests response, without processing the requested operation, and SHALL include an indication of the time remaining until the client may retry.
4. WHEN the configured time window and maximum request count are supplied via environment variables at startup, THE API SHALL apply those values in place of the defaults.

### Requirement 18: Backend Testing

**User Story:** As a developer, I want comprehensive backend tests, so that I can verify API correctness and catch regressions.

#### Acceptance Criteria

1. THE API project SHALL include unit tests using Jest for controller logic and service functions, achieving at least 80% line coverage across controller and service modules.
2. THE API project SHALL include integration tests using Supertest that test API routes against a dedicated test database that is isolated from the development and production databases.
3. THE API tests SHALL cover all CRUD operations (create, read, update, delete) for Products, Expenses, and Users, with at least one test per operation per resource.
4. THE API tests SHALL verify authentication behavior by testing requests with a valid token (expect success), an expired token (expect 401), a malformed token (expect 401), and no token (expect 401).
5. THE API tests SHALL verify authorization behavior by testing each write endpoint with an Admin role (expect success) and a Staff role (expect 403).
6. THE API tests SHALL verify that input validation rejects invalid data by submitting at least one request with invalid fields per validated endpoint and asserting a 400 response with an error indication identifying the invalid field.
7. WHEN the test suite completes, THE test database state SHALL be cleaned up such that running the suite again produces the same results (tests are idempotent).

### Requirement 19: Frontend Testing

**User Story:** As a developer, I want frontend component and integration tests, so that I can verify UI behavior and data layer correctness.

#### Acceptance Criteria

1. THE Frontend project SHALL include component tests using Jest and React Testing Library for the following components: Dashboard summary cards, Product create/edit form, sidebar Navigation, and global search bar.
2. THE Frontend project SHALL include RTK_Query endpoint tests with mocked API responses that verify successful data fetching returns expected data, failed requests expose error state, and mutation success triggers cache invalidation for affected tags.
3. THE Frontend tests SHALL verify role-based UI rendering by asserting that when the user role is Admin the create, edit, and delete buttons are present in the DOM, and when the user role is Staff those buttons are absent from the DOM.
4. THE Frontend tests SHALL verify that toggling the theme writes the selected value to local storage and that on subsequent render the persisted value is read and applied before visible content renders.
5. THE Frontend tests SHALL verify that RTK_Query hooks expose loading state during in-flight requests and error state when the mocked API returns a failure response.

### Requirement 20: CI/CD Pipeline

**User Story:** As a developer, I want automated CI/CD, so that code quality is enforced on every change and deployments are automated.

#### Acceptance Criteria

1. WHEN a pull request is opened, updated, or reopened against any branch, THE repository's GitHub Actions workflow SHALL run linting, type checking, and the test suite, completing within 30 minutes or terminating with a timeout failure.
2. WHEN a commit is pushed to the main branch, THE Frontend SHALL be deployed via AWS Amplify CI/CD.
3. WHEN a deployment is triggered via the GitHub Actions job or deploy script, THE API SHALL connect to EC2 via SSH and restart the application using pm2.
4. IF the SSH connection fails or the pm2 restart does not complete successfully, THEN THE GitHub Actions job SHALL terminate with a failed status, report an error indicating the deployment failure, and leave the previously running application instance unchanged.
5. IF any lint error, type error, or test failure is detected during the workflow run, THEN THE GitHub Actions workflow SHALL complete with a failed status and report the failing check so that the pull request is blocked from merging.

### Requirement 21: AWS Deployment — Free Tier Compliance

**User Story:** As a developer, I want all AWS resources within Free Tier limits, so that the project incurs no cost during development and demonstration.

#### Acceptance Criteria

1. THE RDS instance SHALL use a Free_Tier eligible instance type (db.t3.micro or db.t4g.micro), single-AZ deployment, with allocated storage of 20 GB or less, and general purpose (gp2/gp3) storage type.
2. THE EC2 instance SHALL use a Free_Tier eligible instance type (t2.micro or t3.micro) with a maximum of 750 running hours per month.
3. THE S3_Bucket SHALL use standard storage class with no lifecycle policies, no transfer acceleration, and no requester-pays configuration that would incur additional cost.
4. THE Amplify hosting SHALL remain within the free tier limits of 1000 build minutes per month and 15 GB served per month.
5. THE API Gateway SHALL use the HTTP API type to remain within the Free Tier request allowance of 1 million requests per month for the first 12 months.
6. THE Cognito User Pool SHALL remain within the Free Tier limit of 50,000 monthly active users.
7. THE DEPLOYMENT.md SHALL include a cost monitoring step instructing the user to configure an AWS Billing alarm that triggers when estimated monthly charges exceed $1.00.
8. IF any resource provisioning step in the DEPLOYMENT.md would result in a configuration outside Free Tier eligibility, THEN THE DEPLOYMENT.md SHALL explicitly flag that step with a warning indicating the Free Tier breach.

### Requirement 22: Observability

**User Story:** As a developer, I want logging and health monitoring, so that I can diagnose issues in the deployed application.

#### Acceptance Criteria

1. THE EC2 instance SHALL send API application logs to AWS CloudWatch Logs within 60 seconds of the log event being produced.
2. WHEN THE API receives an incoming request, THE API SHALL log the HTTP method, request path, response status code, and response time in milliseconds before the response is sent to the client.
3. WHEN the API receives a GET request to the /health endpoint, THE API SHALL return a JSON response containing the application version (string), uptime in seconds (number), and database connection status (connected or disconnected).
4. IF the database connection check within the /health endpoint fails, THEN THE API SHALL return the /health response with database status set to disconnected and SHALL NOT return a 5xx error code for the /health endpoint itself.
5. IF the CloudWatch Logs agent fails to deliver logs, THEN THE API SHALL continue operating and logging locally without interrupting request processing.

### Requirement 23: Security and Production Hardening

**User Story:** As a system owner, I want the application hardened for production, so that common attack vectors are mitigated.

#### Acceptance Criteria

1. THE Frontend hosted on Amplify SHALL be served over HTTPS, and any HTTP request to the Amplify domain SHALL be redirected to HTTPS.
2. THE API SHALL be accessible via API Gateway which provides HTTPS termination, such that all client-to-API traffic is encrypted in transit.
3. THE API SHALL store all secrets (database URL, AWS keys, Cognito configuration) in environment variables, not in source code or committed configuration files.
4. WHERE AWS Secrets Manager is used, THE documentation SHALL note the per-secret per-month cost and explicitly state that it is not covered by Free Tier.
5. THE API SHALL set the following HTTP headers on all responses: X-Content-Type-Options with value nosniff, and appropriate CORS headers restricted to the configured allowed origins.
6. IF the API receives a request from an origin not in the configured allowed origins list, THEN THE API SHALL omit CORS headers that would allow the cross-origin request.
7. THE API SHALL NOT include secrets, stack traces, or internal system paths in error response bodies sent to clients.

### Requirement 24: Local Development Environment

**User Story:** As a developer, I want a local development path, so that I can build and test the application without requiring AWS services.

#### Acceptance Criteria

1. THE repository SHALL include a Docker Compose configuration that starts a local PostgreSQL instance and reaches a ready-to-accept-connections state within 60 seconds of the start command being issued.
2. WHEN the DATABASE_URL environment variable resolves to a localhost address, THE API SHALL connect to the local PostgreSQL instance and expose no dependency on any AWS-hosted database.
3. IF the API cannot establish a connection to the local PostgreSQL instance within 10 seconds, THEN THE API SHALL fail to start and emit a startup error indicating the database connection could not be established, without partially initializing request handling.
4. WHEN the NEXT_PUBLIC_API_BASE_URL environment variable resolves to a localhost address, THE Frontend SHALL route all API requests to the local API instance and expose no dependency on any AWS-hosted API endpoint.
5. IF a Frontend request to the local API fails due to the API being unreachable, THEN THE Frontend SHALL display an error message indicating the local API is unavailable and SHALL retain any unsaved user input.
6. THE repository README SHALL document the local development setup steps including prerequisite tooling, starting the local PostgreSQL instance, required environment variables (at minimum DATABASE_URL and NEXT_PUBLIC_API_BASE_URL) with example localhost values, and the commands to start the API and Frontend.

### Requirement 25: Documentation Deliverables

**User Story:** As a developer and job seeker, I want polished documentation, so that the project is understandable, deployable, and presentable in a portfolio.

#### Acceptance Criteria

1. THE repository SHALL include a README.md containing all of the following sections: a project summary, a Mermaid architecture diagram, tech stack badges, local setup instructions, and at least 3 visual demos (screenshots or GIFs).
2. THE repository SHALL include an ARCHITECTURE.md that, for each AWS service used in the project, states the reason it was chosen, at least one alternative considered, and at least one tradeoff of the choice.
3. THE repository SHALL include a DEPLOYMENT.md containing numbered sequential AWS Console deployment steps, an explicitly stated free-tier limit for each step that consumes a free-tier-eligible resource, and a teardown section listing the steps to remove all created resources.
4. THE DEPLOYMENT.md SHALL include, for each service configuration step, the explicit AWS Console navigation path (the ordered sequence of console menus or screens) required to reach that configuration.
5. THE repository documentation SHALL include a "Lessons Learned / Trade-offs" section containing at least 3 distinct entries.
6. THE repository documentation SHALL include between 2 and 3 resume bullet point drafts, where each bullet references a specific, verifiable project outcome (a delivered feature, integrated service, or measured result).
7. IF any section required by criteria 1 through 6 is absent, empty, or contains an unresolved placeholder, THEN THE documentation SHALL be considered incomplete and the deliverable check SHALL fail with an indication of which required section is missing.

### Requirement 26: Stock Movement Tracking

**User Story:** As a user, I want stock movements recorded, so that I can audit inventory changes and understand how stock levels change over time.

#### Acceptance Criteria

1. WHEN a product stockQuantity changes via a restock, sale, or adjustment operation, THE API SHALL create a StockMovement record containing the product ID, movement type (one of restock, sale, or adjustment), quantity (positive integer for restock, negative integer for sale, positive or negative integer for adjustment), the UTC timestamp of the change, and the authenticated user's ID who initiated the change.
2. THE API SHALL provide an endpoint to retrieve stock movement history for a given product, returning records ordered by creation date descending with support for pagination (default page size 25, maximum page size 100).
3. THE StockMovement record SHALL reference a valid Product (existing product ID) and a valid User (existing user ID) via foreign keys enforced at the database level.
4. IF the specified product ID does not exist when creating a StockMovement, THEN THE API SHALL reject the request with a 404 Not Found response indicating the product was not found.
5. IF the quantity field is zero or not an integer, THEN THE API SHALL reject the request with a 400 Bad Request response indicating the quantity is invalid.
6. WHEN the stock movement history is requested for a product that has no stock movements, THE API SHALL return an empty array with a 200 OK response.

### Requirement 27: TypeScript and Code Quality

**User Story:** As a developer, I want consistent TypeScript usage and code quality, so that the codebase is maintainable and demonstrates professional standards.

#### Acceptance Criteria

1. WHEN the Frontend source code is compiled with the TypeScript compiler in strict mode, THE compilation SHALL produce zero type errors.
2. WHEN the API source code is compiled with the TypeScript compiler in strict mode, THE compilation SHALL produce zero type errors.
3. THE repository SHALL include an ESLint configuration file for the Frontend project and a separate ESLint configuration file for the API project, each covering all source files in its respective project.
4. WHEN ESLint is executed against all Frontend source files, THE lint run SHALL produce zero errors.
5. WHEN ESLint is executed against all API source files, THE lint run SHALL produce zero errors.
6. THE codebase SHALL include comments on modules, functions, or blocks where the logic is non-trivial, documenting architectural decisions, learning notes, or the reasoning behind the chosen approach.
7. IF the TypeScript compilation or ESLint execution produces any error, THEN THE CI/CD build SHALL fail and report the errors, blocking merge.
