# System Architecture & Modular Monolith Design

## 1. Modular Monolith Architecture
SRYN FinServ adopts a **Modular Monolith** pattern in `backend/` to prevent premature microservice complexity while retaining strict domain encapsulation.

```
backend/src/modules/
├── auth/          # Authentication & session token management
├── users/         # Internal & external user identity management
├── roles/         # Granular permissions & RBAC management
├── products/      # Dynamic product catalog & subcategories
├── forms/         # Dynamic form schema renderer & validator
├── pricing/       # Pricing, fee, tax, and slab calculation engine
├── commissions/   # Multi-tier commission rules & tree routing
├── ledger/        # Double-entry style append-only payout ledger
├── applications/  # Application state machine & submission engine
├── workflows/     # Dynamic SLA, status transitions, & approvals
├── documents/     # Private S3 document storage & presigned URLs
├── audit/         # Immutable compliance audit log recording
└── notifications/ # SMS/WhatsApp/Email notification dispatches
```

## 2. Shared Packages Architecture
- `@sryn/types`: TypeScript interfaces consumed by Node.js backend, Next.js web applications, and backend services.
- `@sryn/validation`: Shared Zod validation schemas for input sanitization.
- `@sryn/config`: Centralized system enums, constants, default role mappings.
- `@sryn/ui`: Core web design tokens and shared UI tokens.

## 3. Communication Contracts
- **Web/Mobile to Backend**: REST API (`/api/v1/...`) over HTTPS with JSON envelopes.
- **Authentication**: JWT Bearer tokens issued via Amazon Cognito / Local Auth.
- **Asynchronous Processing**: AWS EventBridge + SQS queues for background jobs (commission calculation, notification triggers, partner webhook dispatches).
