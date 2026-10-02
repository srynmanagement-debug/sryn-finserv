# Security Architecture & Data Protection

## 1. Authentication & Token Management
- Integration with Amazon Cognito for identity management, MFA enforcement, and token issuance.
- Fallback JWT validation with RSA256 signature verification.
- Tokens stored securely on mobile devices via Flutter Secure Storage (Keychain/Keystore).

## 2. Dynamic Authorization (RBAC)
- Fine-grained permission checks evaluated at API middleware layer (`rbacMiddleware`).
- Ownership guards (`read_own`, `upload_own`) ensuring customers can only access their own applications.

## 3. Secure Document Handling & Signed URLs
- **No Direct Public Storage**: Document S3 bucket blocks all public access (`BlockPublicAccess.BLOCK_ALL`).
- **Presigned URLs**: Access to application documents (Aadhaar, PAN, Bank Statements) is provided exclusively via temporary AWS S3 Presigned URLs with a 15-minute expiration limit.

## 4. Encryption Standards
- **Data at Rest**: AWS KMS managed keys encrypting RDS PostgreSQL database storage and S3 document buckets.
- **Data in Transit**: Mandatory TLS 1.3 for all web portal and mobile app HTTPS traffic.

## 5. Compliance & Data Privacy
- PAN & Aadhaar data masked in application UI displays (e.g., `XXXX-XXXX-1234`).
- Strict RBI data localization compliance (all infrastructure residing in AWS Mumbai region `ap-south-1`).
