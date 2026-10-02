# Database Architecture & PostgreSQL Schema Strategy

## 1. Schema Design Principles
1. **Relational Core**: High-integrity relational tables for entities with strict foreign keys (`users`, `roles`, `products`, `applications`, `commission_ledger`).
2. **JSONB Dynamic Extension Points**: Used selectively for flexible, dynamic metadata:
   - `products.eligibility_rules`: Configurable eligibility JSON rules.
   - `form_schemas.steps`: Dynamic form field layouts and validation definitions.
   - `applications.form_data`: User-submitted field key-value pairs matching product form schemas.
   - `applications.pricing_snapshot`: Frozen JSON copy of pricing rules active at submission time.
   - `applications.commission_snapshot`: Frozen JSON copy of commission tree rules active at submission time.
3. **Primary Keys**: UUID v4 for all entity IDs to allow distributed generation and safe public references.
4. **Audit Columns**: Every table includes `created_at`, `updated_at`, `created_by`, `updated_by`, and `is_deleted` (soft-delete).

---

## 2. Core Tables Overview
- `users`: User profiles, role references, manager references.
- `roles` & `permissions`: RBAC matrices.
- `product_categories` & `product_subcategories`: Category taxonomy.
- `products`: Dynamic product configurations.
- `form_schemas`: Product application form definitions.
- `pricing_rules`: Dynamic pricing, processing fee, and tax rules.
- `commission_rules`: Multi-tier commission percentage/fixed rules per role.
- `applications`: Customer credit card & loan application instances.
- `application_documents`: Application KYC & uploaded documents metadata.
- `commission_ledger`: Append-only payout ledger entries.
- `audit_logs`: System-wide immutable activity logs.
