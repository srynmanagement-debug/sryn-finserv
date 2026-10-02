# Role-Based Access Control (RBAC) Specification

## 1. Persona Roles Matrix

| Role Code | User Persona | Portal Access | Scope of Authority |
| :--- | :--- | :--- | :--- |
| `SUPER_ADMIN` | System Owner / Tech Admin | `admin-web` | Full unrestricted platform configuration & database access |
| `ADMIN` | Ops Head / Risk Head | `admin-web` | Product approval, commission rule management, compliance audit |
| `MANAGER` | Operations Manager | `manager-web` | Team performance oversight, high-ticket loan approval, SLA escalations |
| `TEAM_LEADER` | Team Leader | `team-leader-web` | Agent monitoring, lead distribution, regional target tracking |
| `AGENT` | Field Agent / Employee | `agent-app` | Direct customer onboarding, application creation, field verification |
| `DISTRIBUTOR` | Channel Master Distributor | `retailer-app` | Sub-retailer management, channel commission performance |
| `RETAILER` | Store Retailer / POS Agent | `retailer-app` | In-store customer sourcing, quick application referral |
| `CUSTOMER` | End Consumer | `customer-app` | Self-service application submission, status tracking, document upload |

## 2. Granular Permissions Catalog
- `product:create`, `product:update`, `product:publish`
- `pricing:manage`, `commission:manage`
- `application:create`, `application:read`, `application:verify`, `application:approve`
- `ledger:view`, `ledger:payout_approve`
- `audit:read`
