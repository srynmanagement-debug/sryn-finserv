# SRYN FinServ — Master Architecture Blueprint

## 1. Executive Summary & Vision
SRYN FinServ is a production-grade multi-channel financial services distribution platform designed for scale, flexibility, and compliance. The core design paradigm is a **dynamic, configuration-driven architecture** where financial product offerings, eligibility criteria, document requirements, workflows, pricing, and multi-tier commission structures can be managed via the Super Admin Web Portal without requiring source code modifications or backend redeployments.

---

## 2. Multi-Channel Touchpoints & Interfaces
- **Super Admin Web (`apps/admin-web`)**: System governance, product engine, dynamic schema definition, commission tree management, security audits.
- **Manager Web (`apps/manager-web`)**: Operations management, high-ticket loan approvals, SLA monitoring, regional performance.
- **Team Leader Web (`apps/team-leader-web`)**: Field agent monitoring, lead distribution, target tracking.
- **Customer Mobile App (`apps/customer-app`)**: Frictionless mobile-first onboarding, loan/card application, status tracking, document upload.
- **Agent Mobile App (`apps/agent-app`)**: On-field customer application submission, KYC verification, lead status updates.
- **Retailer Mobile App (`apps/retailer-app`)**: Point-of-sale customer sourcing, QR-code application triggers, real-time commission ledger visibility.

---

## 3. Technology Stack Overview
- **Backend Architecture**: Modular Monolith using Node.js, Express, and TypeScript.
- **Database Layer**: PostgreSQL (AWS RDS) with relational schemas and JSONB extensions for dynamic forms & rules.
- **Infrastructure as Code**: AWS CDK v2 (TypeScript) targeting AWS Region `ap-south-1` (Mumbai).
- **Web Frontend**: Next.js 14+ (React & TypeScript).
- **Mobile Frontend**: Flutter (Cross-platform targeting Android & iOS).

---

## 4. Key Architectural Principles
1. **Zero Hardcoded Business Rules**: Products, pricing, commissions, workflows, fields, and fees are stored in database-backed JSON definitions.
2. **Immutable Commission Ledger**: Financial commission calculations create append-only ledger entries; historical snapshotting ensures past transactions remain audit-ready.
3. **Low-Cost Development Footprint**: Initial CDK templates feature zero NAT Gateways and cost-effective single-instance DB parameters for development.
