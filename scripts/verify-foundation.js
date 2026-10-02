const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  '.gitignore',
  '.env.example',
  'README.md',
  'packages/types/package.json',
  'packages/validation/package.json',
  'packages/config/package.json',
  'packages/ui/package.json',
  'backend/package.json',
  'backend/src/index.ts',
  'infrastructure/cdk/package.json',
  'infrastructure/cdk/bin/app.ts',
  'apps/admin-web/package.json',
  'apps/manager-web/package.json',
  'apps/team-leader-web/package.json',
  'apps/customer-app/pubspec.yaml',
  'apps/agent-app/pubspec.yaml',
  'apps/retailer-app/pubspec.yaml',
  'docs/MASTER-BLUEPRINT.md',
  'docs/ARCHITECTURE.md',
  'docs/AWS-ARCHITECTURE.md',
  'docs/DATABASE-ARCHITECTURE.md',
  'docs/SECURITY-ARCHITECTURE.md',
  'docs/RBAC.md',
  'docs/CONFIGURATION-ENGINE.md',
  'docs/PRODUCT-ENGINE.md',
  'docs/PRICING-COMMISSION-ENGINE.md',
  'docs/WORKFLOW-ENGINE.md',
  'docs/APPLICATION-FLOW.md',
  'docs/DEVELOPMENT-PLAN.md',
  'docs/DEPLOYMENT-PLAN.md'
];

console.log('=== SRYN FinServ Foundation Verification ===');
let missingCount = 0;

for (const relPath of requiredFiles) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    console.log(`[OK] ${relPath}`);
  } else {
    console.error(`[MISSING] ${relPath}`);
    missingCount++;
  }
}

if (missingCount === 0) {
  console.log('\nAll 32 core foundation files and blueprints exist!');
} else {
  console.error(`\nFound ${missingCount} missing files.`);
  process.exit(1);
}
