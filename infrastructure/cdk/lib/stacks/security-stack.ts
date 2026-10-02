import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config/environment';

export interface SecurityStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class SecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // AWS WAF, KMS, & Secrets Manager security stack construct outline
    cdk.Tags.of(this).add('Project', 'SRYN-FinServ');
    cdk.Tags.of(this).add('Environment', props.config.environment);
  }
}
