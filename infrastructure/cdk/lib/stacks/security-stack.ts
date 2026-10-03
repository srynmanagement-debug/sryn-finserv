import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config/environment';

export interface SecurityStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class SecurityStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const { config } = props;

    // KMS Encryption Key
    this.kmsKey = new kms.Key(this, 'SrynEncryptionKey', {
      alias: `alias/sryn-${config.environment}-key`,
      description: `KMS key for SRYN FinServ ${config.environment} data encryption`,
      enableKeyRotation: true,
      removalPolicy: config.environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Database Secret in AWS Secrets Manager
    this.dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `/sryn/${config.environment}/db-credentials`,
      description: `PostgreSQL database credentials for ${config.environment}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'sryn_db_user' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 24,
      },
      encryptionKey: this.kmsKey,
    });

    // AWS WAF Web ACL (Regional Scope for ALB / API Gateway in ap-south-1)
    this.webAcl = new wafv2.CfnWebACL(this, 'SrynWebAcl', {
      name: `sryn-finserv-waf-${config.environment}`,
      description: `Web ACL for SRYN FinServ ${config.environment}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `SrynWebAclMetrics-${config.environment}`,
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 0,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `RateLimitMetric-${config.environment}`,
          },
        },
        {
          name: 'AWSCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `AWSCommonRuleSetMetric-${config.environment}`,
          },
        },
        {
          name: 'AWSSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `AWSSQLiRuleSetMetric-${config.environment}`,
          },
        },
      ],
    });

    cdk.Tags.of(this).add('Project', 'SRYN-FinServ');
    cdk.Tags.of(this).add('Environment', config.environment);
  }

  /**
   * Helper method to associate WAF Web ACL with an Application Load Balancer ARN.
   */
  public associateWithAlb(constructScope: Construct, associationId: string, albArn: string) {
    return new wafv2.CfnWebACLAssociation(constructScope, associationId, {
      resourceArn: albArn,
      webAclArn: this.webAcl.attrArn,
    });
  }
}
