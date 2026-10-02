# SRYN FinServ — Staging Environment Requirements

**Target AWS Region:** `ap-south-1` (Mumbai)  
**System Architecture:** Modular Monolith Node.js + Express + PostgreSQL + AWS Cloud Infrastructure  

---

## 1. Network & Compute Architecture

### 1.1 VPC & Subnet Layout
- **CIDR Block:** `10.1.0.0/16`
- **Availability Zones:** 2 AZs in `ap-south-1` (`ap-south-1a`, `ap-south-1b`)
- **Public Subnets:** 2 Subnets (`10.1.0.0/24`, `10.1.1.0/24`) for ALB / API Gateway & NAT Gateway.
- **Private Subnets:** 2 Subnets (`10.1.2.0/24`, `10.1.3.0/24`) for backend container execution.
- **Isolated Subnets:** 2 Subnets (`10.1.4.0/24`, `10.1.5.0/24`) for RDS PostgreSQL database instance.
- **NAT Gateways:** 1 NAT Gateway (optimizing staging costs while providing outbound internet connectivity for private container subnets).

### 1.2 Compute Tier (Backend API)
- **Service:** AWS App Runner or AWS ECS Fargate
- **VCPU / Memory:** 1 vCPU / 2 GB RAM (Auto-scaling range: 1 to 3 instances)
- **Node.js Runtime:** Node.js v20.x / LTS

---

## 2. Database Tier (PostgreSQL RDS)

- **Engine:** PostgreSQL 15.x
- **Instance Type:** `db.t4g.small` (2 vCPU, 2 GB RAM)
- **Allocated Storage:** 50 GB gp3 SSD (Auto-scaling up to 200 GB)
- **Multi-AZ:** Single-AZ for staging cost efficiency (Multi-AZ enabled for production)
- **Backup Retention:** 7 Days automated snapshots with point-in-time recovery (PITR)
- **Encryption:** Storage encrypted at rest via AWS KMS (`aws/rds` key)

---

## 3. Storage Tier (Amazon S3)

- **Document Storage Bucket:** `sryn-staging-documents-ap-south-1`
  - Lifecycle Rules: Transition to Standard-IA after 30 days.
  - Server-Side Encryption: AES-256 enabled by default.
  - Public Access: Blocked all public access (presigned URLs used for upload/download).
  - CORS Configuration: Allowed origins scoped to staging domain origins.
- **Static Assets Bucket:** `sryn-staging-assets-ap-south-1`
  - CloudFront CDN distribution attached.

---

## 4. Authentication Tier (Amazon Cognito)

- **User Pool Name:** `sryn-staging-user-pool`
- **App Clients:**
  - `sryn-staging-customer-app-client` (Public client for Flutter Customer App)
  - `sryn-staging-agent-app-client` (Public client for Flutter Agent App)
  - `sryn-staging-retailer-app-client` (Public client for Flutter Retailer App)
  - `sryn-staging-web-portal-client` (Confidential client for Next.js portals)
- **Custom Attributes:** `custom:role`, `custom:organization_id`, `custom:hierarchy_level`

---

## 5. Security & Secret Management

- **AWS Secrets Manager:**
  - `/sryn/staging/db-credentials`: Staging database host, port, username, password.
  - `/sryn/staging/jwt-secret`: Secret key for JWT verification.
  - `/sryn/staging/cognito`: Cognito User Pool ID & Client Secrets.
- **AWS WAF (Web Application Firewall):**
  - Rate limiting rule: Max 2000 requests per 5-minute window per IP.
  - AWS Managed Rules: Common Rule Set, SQL Injection Protection, Known Bad Inputs.

---

## 6. Environment Variables Matrix (Staging Runtime)

| Variable | Staging Target Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `staging` | Strictly disables dev fallback & seed accounts |
| `PORT` | `3000` | HTTP listening port |
| `DB_HOST` | `<RDS_ENDPOINT>` | RDS PostgreSQL endpoint |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `sryn_finserv_staging` | Staging database name |
| `DB_USER` | `sryn_staging_user` | Secrets Manager reference |
| `DB_PASSWORD` | `<SECRET_REF>` | Secrets Manager reference |
| `AWS_REGION` | `ap-south-1` | AWS Mumbai Region |
| `S3_DOCUMENT_BUCKET` | `sryn-staging-documents-ap-south-1` | S3 document bucket |
| `COGNITO_USER_POOL_ID` | `ap-south-1_xxxxxxxxx` | Cognito Pool ID |
| `CORS_ALLOWED_ORIGINS` | `https://staging-admin.sryn.co.in,https://staging-tl.sryn.co.in` | Allowed web domains |
