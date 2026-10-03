#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { environments } from '../config/environment';
import { NetworkStack } from '../lib/stacks/network-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { SecurityStack } from '../lib/stacks/security-stack';

const app = new cdk.App();

const targetEnv = app.node.tryGetContext('env') || 'development';
const config = environments[targetEnv] || environments.development;

const env: cdk.Environment = {
  account: config.account || process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region, // Defaults to ap-south-1
};

const prefix = `Sryn-${config.environment}`;

const securityStack = new SecurityStack(app, `${prefix}-SecurityStack`, { env, config });
const networkStack = new NetworkStack(app, `${prefix}-NetworkStack`, { env, config });
const authStack = new AuthStack(app, `${prefix}-AuthStack`, { env, config });
const storageStack = new StorageStack(app, `${prefix}-StorageStack`, { env, config });
const databaseStack = new DatabaseStack(app, `${prefix}-DatabaseStack`, { env, config, vpc: networkStack.vpc });
const apiStack = new ApiStack(app, `${prefix}-ApiStack`, {
  env,
  config,
  vpc: networkStack.vpc,
  dbSecret: securityStack.dbSecret,
  kmsKey: securityStack.kmsKey,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  documentBucket: storageStack.documentBucket,
  dbInstance: databaseStack.dbInstance,
  dbSecurityGroup: databaseStack.dbSecurityGroup,
  webAclArn: securityStack.webAcl.attrArn,
});

databaseStack.addStackDependency(networkStack);
apiStack.addStackDependency(networkStack);
apiStack.addStackDependency(securityStack);
apiStack.addStackDependency(authStack);
apiStack.addStackDependency(storageStack);
apiStack.addStackDependency(databaseStack);
