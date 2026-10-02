# SRYN FinServ — Staging Deployment Checklist

**Target AWS Region:** `ap-south-1` (Mumbai)  
**Infrastructure Framework:** AWS CDK (TypeScript)  
**Monorepo Location:** `E:\Websites\Clients\sryn-finserv`  

---

## 1. Pre-Deployment Verification Checklist

- [x] **Monorepo Build & Compilation:**
  - [x] Core package `@sryn/types` built without errors.
  - [x] Shared package `@sryn/config` built without errors.
  - [x] Shared package `@sryn/validation` built without errors.
  - [x] Backend API `backend` built cleanly via `tsc`.
  - [x] Web app `apps/admin-web` built cleanly via Next.js.
  - [x] Web app `apps/team-leader-web` built cleanly via Next.js.
  - [x] Web app `apps/manager-web` built cleanly via Next.js.

- [x] **Database & Migration Readiness:**
  - [x] All 7 database migration files (`001` to `007`) verified in sequential version order.
  - [x] Local PostgreSQL database `sryn_finserv_db` has applied migrations 001–007 cleanly.
  - [x] Verified 24 tables, 65 indexes, and 45 foreign key constraints.
  - [x] Migration runner `backend/dist/database/runner.js` supports idempotent execution (`schema_migrations` tracking).

- [x] **Automated Testing Suite Verification:**
  - [x] Backend Jest test suite: **16/16 test suites passed, 74/74 tests passed**.
  - [x] Flutter Customer App: **`flutter analyze` 0 issues, `flutter test` 9/9 passed**.
  - [x] Flutter Agent App: **`flutter analyze` 0 issues, `flutter test` 5/5 passed**.
  - [x] Flutter Retailer App: **`flutter analyze` 0 issues, `flutter test` 5/5 passed**.

- [x] **Security & Environment Hardening:**
  - [x] Local auth fallback (`verifyLocalAuthAllowed()`) strictly disabled when `NODE_ENV === 'production'`.
  - [x] Development seed script (`seed.ts`) strictly disabled when `NODE_ENV === 'production'`.
  - [x] Express error middleware hides database tracebacks and internal stack traces in production.
  - [x] RBAC middleware enforces role and permission checks on protected endpoints.
  - [x] Sensitivity check: No passwords or unhashed secrets committed to repository.

- [x] **AWS CDK Infrastructure Synthesis:**
  - [x] Synthesized CDK stacks for staging environment (`npx cdk synth -c env=staging`).
  - [x] Stack `Sryn-staging-SecurityStack` validated.
  - [x] Stack `Sryn-staging-NetworkStack` validated (VPC `10.1.0.0/16`, 2 AZs, 1 NAT Gateway).
  - [x] Stack `Sryn-staging-AuthStack` validated (Cognito User Pool & App Clients).
  - [x] Stack `Sryn-staging-StorageStack` validated (S3 buckets with AES-256 SSE & CORS).
  - [x] Stack `Sryn-staging-DatabaseStack` validated (RDS PostgreSQL `db.t4g.small`).
  - [x] Stack `Sryn-staging-ApiStack` validated (API Gateway / App Runner compute).

---

## 2. Deployment Execution Steps (AWS Staging Launch)

> [!IMPORTANT]
> The following steps describe the execution sequence for the devops pipeline when launching live staging infrastructure in AWS `ap-south-1`.

### Step 1: AWS Credentials & Secrets Configuration
1. Configure AWS CLI credentials for `ap-south-1`:
   ```bash
   aws configure set region ap-south-1
   ```
2. Populate staging database credentials in AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name /sryn/staging/db-credentials \
     --secret-string '{"username":"sryn_staging_user","password":"<SECURE_STAGING_PASSWORD>"}'
   ```

### Step 2: Infrastructure Deployment via CDK
1. Navigate to infrastructure CDK directory:
   ```bash
   cd infrastructure/cdk
   ```
2. Bootstrap CDK environment (if not previously bootstrapped in region):
   ```bash
   npx cdk bootstrap aws://<AWS_ACCOUNT_ID>/ap-south-1 -c env=staging
   ```
3. Deploy all staging infrastructure stacks:
   ```bash
   npx cdk deploy --all -c env=staging --require-approval broadening
   ```

### Step 3: Staging Database Migration Execution
1. Retrieve RDS PostgreSQL endpoint from CDK output (`Sryn-staging-DatabaseStack.RDSInstanceEndpoint`).
2. Run database migration script targeting staging RDS instance:
   ```bash
   DB_HOST=<STAGING_RDS_ENDPOINT> DB_NAME=sryn_finserv_staging DB_USER=sryn_staging_user DB_PASSWORD=<SECURE_STAGING_PASSWORD> node backend/dist/database/runner.js
   ```

### Step 4: Container Build & Backend API Deployment
1. Build Docker container image for backend monolith:
   ```bash
   docker build -t sryn-backend-staging -f backend/Dockerfile .
   ```
2. Tag and push container image to AWS ECR staging repository.
3. Trigger service update in AWS App Runner / ECS task definition.

---

## 3. Post-Deployment Verification & Smoke Tests

1. **Health Check Endpoint:**
   ```bash
   curl -i https://staging-api.sryn.co.in/health
   # Expected: HTTP 200 OK {"status":"UP","environment":"staging"}
   ```
2. **Cognito Authentication Flow:**
   - Test Cognito user registration & JWT token issuance for test staging account.
3. **Database Connectivity & Persistence:**
   - Execute test API call to create test application draft and verify record persistence in RDS.
4. **S3 Document Upload:**
   - Request presigned S3 URL from `/api/v1/documents/presigned-url` and verify upload to staging S3 bucket.
5. **RBAC & Security Verification:**
   - Confirm unauthenticated or unauthorized requests to `/api/v1/hierarchy/manager/dashboard` return HTTP 401/403.
