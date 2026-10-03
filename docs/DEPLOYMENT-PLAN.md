# SRYN FinServ — AWS Staging Deployment Plan & Infrastructure Runbook

**Monorepo:** `E:\Websites\Clients\sryn-finserv`
**Target AWS Region:** `ap-south-1` (Mumbai)
**Environment:** `staging`
**Infrastructure Framework:** AWS CDK v2 (TypeScript)
**Backend Compute:** Containerized Node.js + Express Monolith
**Database:** Amazon RDS PostgreSQL 15.x (`db.t4g.small`, 50 GB gp3)

---

## 1. CDK Infrastructure Stack Inventory

| Stack Name | Primary Cloud Resources | CD Resource File | Status |
| :--- | :--- | :--- | :--- |
| **`Sryn-staging-SecurityStack`** | AWS KMS Encryption Key, AWS Secrets Manager (`/sryn/staging/db-credentials`) | `security-stack.ts` | **Synthesized Cleanly** |
| **`Sryn-staging-NetworkStack`** | AWS VPC (`10.1.0.0/16`), 2 AZs, 2 Public, 2 Private & 2 Isolated Subnets, 1 NAT Gateway | `network-stack.ts` | **Synthesized Cleanly** |
| **`Sryn-staging-AuthStack`** | Amazon Cognito User Pool & App Client (Email/Phone Sign-in) | `auth-stack.ts` | **Synthesized Cleanly** |
| **`Sryn-staging-StorageStack`** | Amazon S3 Document Bucket (`sryn-finserv-documents-staging-ap-south-1`) with SSL enforcement & AES-256 SSE | `storage-stack.ts` | **Synthesized Cleanly** |
| **`Sryn-staging-DatabaseStack`** | Amazon RDS PostgreSQL (`db.t4g.small`, 50 GB storage, isolated subnets, encrypted) | `database-stack.ts` | **Synthesized Cleanly** |
| **`Sryn-staging-ApiStack`** | AWS API Gateway HTTP API (`sryn-finserv-api-staging`) with CORS preflight | `api-stack.ts` | **Synthesized Cleanly** |

---

## 2. Resource-by-Resource Staging Cost Estimate (INR & USD)

*Assumptions:* AWS Region `ap-south-1` (Mumbai), 1 USD = ₹84.00 INR, 730 hours/month usage.

| AWS Resource | Size / Config | Base Idle Cost (USD) | Estimated Usage (USD) | Total Monthly USD | Total Monthly INR (₹) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **VPC NAT Gateway** | 1 Gateway in Public Subnet | \$32.85 | \$0.45 | \$33.30 | **₹2,797** |
| **RDS PostgreSQL** | Single-AZ `db.t4g.small`, 50 GB gp3 | \$31.72 | \$0.00 | \$31.72 | **₹2,664** |
| **App Runner / Container Compute** | 1 vCPU, 2 GB RAM (Auto-scaling 1-3) | \$7.50 | \$20.00 | \$27.50 | **₹2,310** |
| **AWS WAF Web ACL** | WAF ACL + 3 Managed Rule Sets | \$8.00 | \$0.30 | \$8.30 | **₹697** |
| **CloudWatch Logs & Metrics** | 5 GB Log ingestion + 5 Alarms | \$0.50 | \$3.00 | \$3.50 | **₹294** |
| **Secrets Manager & KMS Key** | 1 Secret (`/sryn/staging/db-credentials`) + 1 KMS Key | \$1.40 | \$0.03 | \$1.43 | **₹120** |
| **Amazon S3 Storage** | 20 GB Storage + 50k Requests | \$0.00 | \$0.75 | \$0.75 | **₹63** |
| **Amazon Cognito** | Up to 50,000 MAUs | \$0.00 | \$0.00 | \$0.00 | **₹0 (Free Tier)** |
| **TOTAL ESTIMATED COST** | | **\$81.97** | **\$24.53** | **\$106.50** | **₹8,946 / month** |

> [!WARNING]
> **Base Idle Cost Notice:** The staging environment incurs a minimum fixed charge of **~ \$82 / month ($\approx$ ₹6,880/month)** even when zero HTTP traffic is received, due to NAT Gateway, RDS Instance, KMS Key, and WAF ACL fixed hourly rates.

---

## 3. Ordered Manual Deployment Runbook

### Step 0: Check Active AWS Identity and Region (Pre-Flight Safety Check)
Run these commands in Windows CMD to verify active identity without exposing secret keys:
```cmd
aws sts get-caller-identity
aws configure get region
```

### Step 1: Synthesize Infrastructure Templates
Navigate to the CDK directory and synthesize the CloudFormation templates:
```cmd
cd infrastructure/cdk
npm run build
npx cdk synth -c env=staging
```

### Step 2: Bootstrap CDK Environment (First-time deployment only)
Bootstrap the CDK staging environment in region `ap-south-1`:
```cmd
npx cdk bootstrap aws://<AWS_ACCOUNT_ID>/ap-south-1 -c env=staging
```

### Step 3: Deploy Security & Network Stacks
Deploy foundational security, KMS keys, and VPC networking:
```cmd
npx cdk deploy Sryn-staging-SecurityStack Sryn-staging-NetworkStack -c env=staging --require-approval broadening
```

### Step 4: Deploy Auth, Storage & Database Stacks
Deploy Cognito User Pool, S3 Document Bucket, and RDS PostgreSQL instance:
```cmd
npx cdk deploy Sryn-staging-AuthStack Sryn-staging-StorageStack Sryn-staging-DatabaseStack -c env=staging --require-approval broadening
```

### Step 5: Execute Database Migrations against RDS
Run forward-only migrations (001–007) targeting the newly provisioned RDS PostgreSQL database:
```cmd
set DB_HOST=<RDS_ENDPOINT_FROM_CDK_OUTPUT>
set DB_PORT=5432
set DB_NAME=sryn_finserv_staging
set DB_USER=sryn_db_user
set DB_PASSWORD=<GENERATED_SECRETS_MANAGER_PASSWORD>
node backend/dist/database/runner.js
```

### Step 6: Deploy API Compute Stack
Deploy the API Gateway and backend application container stack:
```cmd
npx cdk deploy Sryn-staging-ApiStack -c env=staging --require-approval broadening
```

---

## 4. Smoke Testing & Validation Suite

Run these post-deployment validation steps against the live staging HTTP API endpoint:

1. **Health Check Endpoint:**
   ```cmd
   curl -i https://<STAGING_API_ENDPOINT>/health
   ```
   *Expected Result:* HTTP 200 OK `{"status":"UP","environment":"staging"}`.

2. **Database Connectivity Test:**
   ```cmd
   curl -i https://<STAGING_API_ENDPOINT>/api/v1/products
   ```
   *Expected Result:* HTTP 200 OK returning active products array from RDS PostgreSQL.

3. **Cognito Token Verification:**
   Verify JWT token validation using a Cognito test user pool token.

4. **Presigned S3 Document Upload:**
   Issue a POST request to `/api/v1/documents/presigned-url` and verify successful upload to S3 staging bucket.

---

## 5. Rollback & Emergency Teardown Considerations

If a critical failure occurs during deployment or validation:

1. **Stack Rollback:** AWS CloudFormation automatically rolls back individual stack deployments upon failure.
2. **Teardown Command:** To completely delete all staging AWS resources and halt monthly charges:
   ```cmd
   npx cdk destroy --all -c env=staging
   ```
3. **Database Safeguard:** RDS PostgreSQL snapshot will be created automatically before stack destruction if deletion protection is enabled.
