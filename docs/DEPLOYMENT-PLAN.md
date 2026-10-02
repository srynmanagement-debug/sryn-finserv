# Infrastructure Deployment & CI/CD Strategy

## 1. Environment Separation Strategy
- **`development`**: Local execution & CDK synth mode with 0 NAT Gateways.
- **`staging`**: AWS Cloud deployment in `ap-south-1` for integration testing.
- **`production`**: Highly available Multi-AZ AWS deployment with WAF, CloudFront, and RDS Multi-AZ.

## 2. CI/CD Pipeline Workflow
- **Lint & Compile Check**: Validates TypeScript compilation across packages, backend, and web portals.
- **Infrastructure Validation**: Runs `cdk synth` to verify template generation prior to deployment.
- **Automated Deployment**: GitHub Actions / AWS CodePipeline deploying CDK stacks sequentially (`Security` -> `Network` -> `Auth` -> `Storage` -> `Database` -> `API`).
