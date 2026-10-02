# AWS Target Infrastructure Architecture

## 1. AWS Region & Multi-AZ Topology
All cloud resources default to **`ap-south-1` (Mumbai)** for low latency across India and compliance with local data residency mandates.

```
                              ┌────────────────────────────────────────┐
                              │          AWS Cloud (ap-south-1)        │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                                       ┌─────────────────────┐
                                       │   AWS WAF + Route 53│
                                       └──────────┬──────────┘
                                                  │
                                                  ▼
                                       ┌─────────────────────┐
                                       │   CloudFront CDN    │
                                       └──────────┬──────────┘
                                                  │
                       ┌──────────────────────────┴──────────────────────────┐
                       ▼                                                     ▼
           ┌──────────────────────┐                              ┌──────────────────────┐
           │ S3 Static Web Assets │                              │     API Gateway      │
           └──────────────────────┘                              └──────────┬───────────┘
                                                                            │
                                                                            ▼
                                                               ┌────────────────────────┐
                                                               │  Network VPC           │
                                                               │  (ECS / Lambda Compute)│
                                                               └────────────┬───────────┘
                                                                            │
                                                       ┌────────────────────┴────────────────────┐
                                                       ▼                                         ▼
                                           ┌──────────────────────┐                  ┌──────────────────────┐
                                           │ RDS PostgreSQL (Subnet)                 │ S3 Private Documents │
                                           └──────────────────────┘                  └──────────────────────┘
```

## 2. Low-Cost Development Strategy vs Production Topology

| Resource | Development Environment | Production Environment |
| :--- | :--- | :--- |
| **VPC NAT Gateway** | **0 (Zero NAT Gateways)** — Public subnets for dev compute | **2 Multi-AZ NAT Gateways** |
| **Amazon RDS** | Single AZ `db.t4g.micro`, 20GB Storage | Multi-AZ `db.m6g.large`, Auto-scaling 100GB+ |
| **Cognito** | Shared User Pool (Developer tier) | Isolated Production User Pool |
| **S3 Buckets** | Single Bucket with folder prefixes | Isolated Production Buckets with Object Lock |

## 3. Infrastructure as Code (AWS CDK v2)
The CDK application is located in `infrastructure/cdk` with modular stack definitions:
- `NetworkStack`: VPC, Subnets, Routing.
- `DatabaseStack`: RDS PostgreSQL Instance.
- `AuthStack`: Cognito User Pools.
- `StorageStack`: Private S3 Buckets for KYC & Documents.
- `ApiStack`: API Gateway HTTP API.
- `SecurityStack`: WAF rules & KMS keys.
