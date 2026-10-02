# Dynamic Configuration Engine Specification

## 1. Core Mandate
No business parameter, financial product, field layout, eligibility rule, pricing tier, commission split, or workflow step may be hard-coded into application logic.

## 2. Configurable Business Dimensions
1. **Financial Categories & Taxonomy**: Dynamically add Credit Cards, FD Credit Cards, Personal Loans, Business Loans, Home Loans, Insurance, etc.
2. **Form Layouts & Conditional Logic**: Render dynamic multi-step application forms based on JSON schema configurations fetched at runtime.
3. **Validation Rules**: Minimum salary, age limits, pin code serviceability, credit score thresholds configured per product.
4. **Partner Mappings**: Route application payloads to specific banking partners (HDFC, ICICI, Axis, SBI) based on dynamic channel rules.
5. **System Notifications**: Dynamic SMS, Email, and WhatsApp templates with variable interpolation.
