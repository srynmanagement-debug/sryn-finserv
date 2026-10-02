# Dynamic Product Engine Architecture

## 1. Product Lifecycle & Versioning
Products are created as `DRAFT`, configured with eligibility rules and document requirements, published to `ACTIVE` status, and versioned when underlying business parameters change.

```
[DRAFT] ─── (Configure Fields & Rules) ───► [ACTIVE] ─── (Versioning / Revision) ───► [ACTIVE (v+1)]
                                               │
                                               └─── (Deactivate) ───► [PAUSED / ARCHIVED]
```

## 2. Product Schema Structure
Each product definition comprises:
- **Base Attributes**: Product Name, Category Code, Subcategory Code, Partner Bank ID, Description, Status, Effective Dates.
- **Eligibility Rules Engine**: Evaluates applicant attributes against configured operators (`GREATER_THAN`, `IN`, `BETWEEN`).
- **Required Documents Manifest**: List of required document types, mandatory status, size limits, and allowed file extensions.
- **Form Schema Reference**: Associated `form_schema_id` defining screen steps and input fields.
- **Pricing & Commission References**: Active pricing rule ID and commission tree ID.
