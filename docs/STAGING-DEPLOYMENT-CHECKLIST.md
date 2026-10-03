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
  - [x] Backend `backend/Dockerfile` created for multi-stage container build.

- [x] **Database & Migration Readiness:**
  - [x] All 7 database migration files (`001` to `007`) verified in sequential version order.
  - [x] Local PostgreSQL database `sryn_finserv_db` has applied migrations 001–007 cleanly.
  - [x] Verified 24 tables, 65 indexes, and 45 foreign key constraints.
  - [x] Migration runner `backend/dist/database/runner.js` supports idempotent execution (`schema_migrations` tracking).
  - [x] Ephemeral ECS Fargate migration task definition (`MigrationTaskDef`) created in `ApiStack` for in-VPC execution.

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
  - [x] AWS WAF Web ACL (`SrynWebAcl`) with Rate Limiting (2000 req / 5 min), Common Rule Set, and SQLi Rule Set associated with ALB.
  - [x] Sensitivity check: No passwords or unhashed secrets committed to repository.

- [x] **AWS CDK Infrastructure Synthesis:**
  - [x] Synthesized CDK stacks for staging environment (`npx cdk synth -c env=staging`).
  - [x] Stack `Sryn-staging-SecurityStack` validated (KMS Key, Secrets Manager, WAF Web ACL).
  - [x] Stack `Sryn-staging-NetworkStack` validated (VPC `10.1.0.0/16`, 2 AZs, 1 NAT Gateway).
  - [x] Stack `Sryn-staging-AuthStack` validated (Cognito User Pool & App Clients).
  - [x] Stack `Sryn-staging-StorageStack` validated (S3 buckets with AES-256 SSE & CORS).
  - [x] Stack `Sryn-staging-DatabaseStack` validated (RDS PostgreSQL `db.t4g.small`, Storage Encrypted).
  - [x] Stack `Sryn-staging-ApiStack` validated (ECS Fargate, ALB, Target Group, VPC Link, HTTP API, Ingress SG rule).

---

## 2. Deployment Execution Steps (AWS Staging Launch)

> [!IMPORTANT]
> The following steps describe the execution sequence for the devops pipeline when launching live staging infrastructure in AWS `ap-south-1`.

### Step 1: AWS Credentials & Container Image Build
1. Configure AWS CLI credentials for `ap-south-1`:
   ```bash
   aws configure set region ap-south-1
   ```
2. Build Docker container image for backend monolith:
   ```bash
   docker build -t sryn-finserv-backend:staging-latest -f backend/Dockerfile .
   ```
3. Authenticate to Amazon ECR and push container image:
   ```bash
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
   docker tag sryn-finserv-backend:staging-latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/sryn-finserv-backend:staging-latest
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/sryn-finserv-backend:staging-latest
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

### Step 3: In-VPC Database Migration Execution
Run the ephemeral ECS Fargate migration task inside the private/isolated VPC network:
```bash
aws ecs run-task \
  --cluster sryn-finserv-cluster-staging \
  --task-definition <MIGRATION_TASK_DEF_ARN_FROM_CDK_OUTPUT> \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<PRIVATE_ISOLATED_SUBNET_ID>],securityGroups=[<ECS_TASK_SG_ID>]}"
```

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
5. **RBAC & WAF Verification:**
   - Confirm unauthenticated or unauthorized requests to `/api/v1/hierarchy/manager/dashboard` return HTTP 401/403.
