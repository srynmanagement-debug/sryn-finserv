# Application Submission & Form Engine Flow

## 1. Dynamic Form Rendering Lifecycle
1. Frontend requests form schema for selected `productId`: `GET /api/v1/forms/schemas/:productId`.
2. Backend returns multi-step JSON layout specifying field components, validation regex, and dependencies.
3. Mobile / Web UI dynamically renders step wizard (Personal Details, Employment Details, KYC, Bank Info).
4. Local form state autosaves to `DRAFT` status via `POST /api/v1/applications`.

## 2. Document Upload Sub-Flow
1. User triggers file/camera document upload for required document type (PAN / Aadhaar).
2. Frontend requests presigned S3 upload URL: `POST /api/v1/documents/presigned-url`.
3. File is uploaded directly from client device to S3 private bucket.
4. S3 key is registered in `application_documents` table with `PENDING_VERIFICATION` status.
