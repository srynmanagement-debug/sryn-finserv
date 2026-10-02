# SRYN FinServ — Financial Services Platform Monorepo

Welcome to the **SRYN FinServ** project repository. SRYN FinServ is a production-grade multi-channel financial services distribution platform supporting Credit Cards, FD Credit Cards, Personal Loans, Business Loans, Home Loans, Insurance, and dynamic future products.

---

## 1. Monorepo Structure

```
sryn-finserv/
├── apps/
│   ├── admin-web/            # Super Admin Web App (Next.js 14 + TS)
│   ├── manager-web/          # Operations Manager Web App (Next.js 14 + TS)
│   ├── team-leader-web/      # Team Leader Operations Web App (Next.js 14 + TS)
│   ├── customer-app/         # Customer Flutter Mobile App (Android/iOS)
│   ├── agent-app/            # Field Agent & Employee Flutter Mobile App
│   └── retailer-app/         # Distributor & Retailer Flutter Mobile App
│
├── backend/                  # Node.js + TypeScript Modular Monolith REST API
│   ├── src/
│   │   ├── app/              # Express server setup & lifecycle
│   │   ├── common/           # Error classes, response utilities, logger
│   │   ├── config/           # Environment variables configuration
│   │   ├── database/         # PostgreSQL connection abstraction
│   │   ├── middleware/       # JWT auth, RBAC guard, audit logger, error handler
│   │   └── modules/          # 15 Domain modules (auth, products, forms, pricing,
│   │                         # commissions, ledger, workflows, audit, etc.)
│   └── tsconfig.json
│
├── packages/
│   ├── types/                # Core TypeScript interfaces & dynamic schema types
│   ├── validation/           # Shared Zod validation schemas
│   ├── config/               # System enums, roles, status mappings, categories
│   └── ui/                   # Shared design tokens & web UI constants
│
├── infrastructure/
│   └── cdk/                  # AWS CDK v2 TypeScript Infrastructure (ap-south-1)
│       ├── bin/              # CDK App entrypoint
│       ├── config/           # Region & Environment configuration (dev, staging, prod)
│       └── lib/stacks/       # Network, DB, Auth, Storage, API, & Security stacks
│
├── docs/                     # 12 Architecture & Engine Specification Blueprints
└── scripts/                  # Verification & utility scripts
```

---

## 2. Dynamic Configuration Engine Principles
The core architecture is **configuration-driven**:
- **Products & Categories**: Dynamically configured from Super Admin; no hard-coded business rules.
- **Form Schema & Fields**: Rendered on frontend from JSON schemas fetched at runtime.
- **Pricing & Fees**: Configurable fixed, percentage, or slab pricing rules.
- **Commissions & Payout Ledger**: Multi-tier attribution tree with append-only ledger entries and snapshot preservation for historical audit accuracy.
- **RBAC**: Configurable granular permissions across 8 distinct user roles.

---

## 3. Prerequisites & Environment Setup
- **Node.js**: v18.x or v20+ (v24.16.0 verified)
- **npm**: v9+ (v11.13.0 verified)
- **Java JDK**: JDK 17 (Temurin 17.0.20.1 verified)
- **Flutter SDK**: Required for `apps/*-app` mobile apps
- **AWS CLI**: Required for future CDK cloud deployments

---

## 4. Local Development Commands

```bash
# 1. Install root dependencies and link workspace packages
npm install

# 2. Compile shared packages & backend
npm run build:packages
npm run build:backend

# 3. Synthesize AWS CDK infrastructure locally (Zero AWS resources deployed)
npm run build:cdk
npm run cdk:synth

# 4. Verify monorepo foundation integrity
npm run verify
```

---

## 5. AWS Infrastructure Architecture
- **Target Region**: `ap-south-1` (Mumbai)
- **Cost-Effective Dev Strategy**: Development CDK configuration uses **0 NAT Gateways** to prevent unnecessary charges.
- **Target Services**: Amazon RDS PostgreSQL, Amazon S3, Amazon Cognito, API Gateway, CloudFront, Route 53, AWS WAF, AWS Secrets Manager, Amazon SQS, EventBridge, CloudWatch.

---

## 6. Architecture Documentation Index
Refer to the `docs/` directory for full specifications:
1. [`docs/MASTER-BLUEPRINT.md`](file:///e:/Websites/Clients/sryn-finserv/docs/MASTER-BLUEPRINT.md)
2. [`docs/ARCHITECTURE.md`](file:///e:/Websites/Clients/sryn-finserv/docs/ARCHITECTURE.md)
3. [`docs/AWS-ARCHITECTURE.md`](file:///e:/Websites/Clients/sryn-finserv/docs/AWS-ARCHITECTURE.md)
4. [`docs/DATABASE-ARCHITECTURE.md`](file:///e:/Websites/Clients/sryn-finserv/docs/DATABASE-ARCHITECTURE.md)
5. [`docs/SECURITY-ARCHITECTURE.md`](file:///e:/Websites/Clients/sryn-finserv/docs/SECURITY-ARCHITECTURE.md)
6. [`docs/RBAC.md`](file:///e:/Websites/Clients/sryn-finserv/docs/RBAC.md)
7. [`docs/CONFIGURATION-ENGINE.md`](file:///e:/Websites/Clients/sryn-finserv/docs/CONFIGURATION-ENGINE.md)
8. [`docs/PRODUCT-ENGINE.md`](file:///e:/Websites/Clients/sryn-finserv/docs/PRODUCT-ENGINE.md)
9. [`docs/PRICING-COMMISSION-ENGINE.md`](file:///e:/Websites/Clients/sryn-finserv/docs/PRICING-COMMISSION-ENGINE.md)
10. [`docs/WORKFLOW-ENGINE.md`](file:///e:/Websites/Clients/sryn-finserv/docs/WORKFLOW-ENGINE.md)
11. [`docs/APPLICATION-FLOW.md`](file:///e:/Websites/Clients/sryn-finserv/docs/APPLICATION-FLOW.md)
12. [`docs/DEVELOPMENT-PLAN.md`](file:///e:/Websites/Clients/sryn-finserv/docs/DEVELOPMENT-PLAN.md)
13. [`docs/DEPLOYMENT-PLAN.md`](file:///e:/Websites/Clients/sryn-finserv/docs/DEPLOYMENT-PLAN.md)
