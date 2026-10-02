# Dynamic Workflow Engine Blueprint

## 1. Application State Machine
Applications transition through strictly enforced status states:
- `DRAFT`: Form saved in progress by customer or agent.
- `SUBMITTED`: Form submitted, initial validation completed.
- `DOCUMENTS_PENDING`: Missing or rejected document upload required.
- `UNDER_VERIFICATION`: Internal verification & tele-calling check.
- `PARTNER_PROCESSING`: Application handed off to banking partner API.
- `APPROVED`: Partner bank approval received.
- `REJECTED`: Application rejected by system or partner.
- `DISBURSED`: Loan disbursed or Credit Card delivered.
- `CANCELLED`: Withdrawn by applicant.

## 2. SLA Timers & Auto-Escalation
- Configurable SLA thresholds per workflow state (e.g., maximum 2 hours in `UNDER_VERIFICATION`).
- Automatic escalation triggers sending notifications to Team Leaders and Managers when SLAs expire.
