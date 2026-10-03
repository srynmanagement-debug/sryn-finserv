import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config/environment';

export interface ApiStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  vpc: ec2.Vpc;
  dbSecret: secretsmanager.Secret;
  kmsKey: kms.Key;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  documentBucket: s3.Bucket;
  dbInstance: rds.DatabaseInstance;
  dbSecurityGroup: ec2.SecurityGroup;
  webAclArn: string;
}

export class ApiStack extends cdk.Stack {
  public readonly httpApi: apigatewayv2.HttpApi;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly ecsCluster: ecs.Cluster;
  public readonly fargateService: ecs.FargateService;
  public readonly ecsTaskSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly migrationTaskDef: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const {
      config,
      vpc,
      dbSecret,
      kmsKey,
      userPool,
      userPoolClient,
      documentBucket,
      dbInstance,
      dbSecurityGroup,
      webAclArn,
    } = props;

    // 1. Security Groups
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for internal Application Load Balancer',
      allowAllOutbound: true,
    });

    this.ecsTaskSecurityGroup = new ec2.SecurityGroup(this, 'EcsTaskSecurityGroup', {
      vpc,
      description: 'Security group for backend ECS Fargate tasks',
      allowAllOutbound: true,
    });

    // Ingress Rules
    // Allow ALB ingress on HTTP port 80
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP ingress to ALB'
    );

    // Allow ECS Task ingress on container port 3000 ONLY from ALB
    this.ecsTaskSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow ingress to container port 3000 from ALB'
    );

    // Add RDS ingress on TCP 5432 ONLY from ECS task security group (using CfnSecurityGroupIngress to prevent CDK dependency cycle)
    new ec2.CfnSecurityGroupIngress(this, 'DbIngressFromEcs', {
      groupId: dbSecurityGroup.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      sourceSecurityGroupId: this.ecsTaskSecurityGroup.securityGroupId,
      description: 'Allow PostgreSQL ingress on port 5432 from ECS task security group',
    });

    // 2. IAM Roles (Least-Privilege & Role Separation)
    // Execution Role (ECR Image Pull & CloudWatch Logging)
    const ecsExecutionRole = new iam.Role(this, 'EcsExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Explicitly grant execution role access to retrieve DB secret at container boot
    ecsExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [dbSecret.secretArn],
      })
    );
    ecsExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: [kmsKey.keyArn],
      })
    );

    // Task Role (Application runtime permissions: Secrets Manager, KMS, S3)
    const ecsTaskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant S3, Secrets Manager, and KMS permissions to Task Role
    documentBucket.grantReadWrite(ecsTaskRole);
    ecsTaskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        resources: [dbSecret.secretArn],
      })
    );
    ecsTaskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: [kmsKey.keyArn],
      })
    );

    // Import secret construct reference without mutating target stack policy
    const importedDbSecret = secretsmanager.Secret.fromSecretPartialArn(
      this,
      'ImportedDbSecret',
      dbSecret.secretArn
    );

    // 3. CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApiBackendLogGroup', {
      logGroupName: `/aws/ecs/sryn-${config.environment}-backend`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: config.environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // 4. ECS Cluster
    this.ecsCluster = new ecs.Cluster(this, 'SrynEcsCluster', {
      vpc,
      clusterName: `sryn-finserv-cluster-${config.environment}`,
    });

    // 5. Container Image Source (ECR Reference)
    const backendRepo = ecr.Repository.fromRepositoryName(
      this,
      'BackendEcrRepo',
      'sryn-finserv-backend'
    );

    // 6. Application Task Definition & Container Config
    const fargateTaskDef = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole: ecsExecutionRole,
      taskRole: ecsTaskRole,
    });

    fargateTaskDef.addContainer('BackendContainer', {
      image: ecs.ContainerImage.fromEcrRepository(backendRepo, `${config.environment}-latest`),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'backend',
        logGroup,
      }),
      portMappings: [{ containerPort: 3000 }],
      environment: {
        NODE_ENV: config.environment,
        PORT: '3000',
        AWS_REGION: config.region,
        DB_HOST: dbInstance.dbInstanceEndpointAddress,
        DB_PORT: dbInstance.dbInstanceEndpointPort.toString(),
        DB_NAME: `sryn_finserv_${config.environment}`,
        DB_USER: 'sryn_db_user',
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        S3_DOCUMENT_BUCKET: documentBucket.bucketName,
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(importedDbSecret, 'password'),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(15),
      },
    });

    // 7. Fargate Service
    this.fargateService = new ecs.FargateService(this, 'BackendFargateService', {
      cluster: this.ecsCluster,
      taskDefinition: fargateTaskDef,
      desiredCount: 1,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.ecsTaskSecurityGroup],
      circuitBreaker: { rollback: true },
    });

    // 8. Application Load Balancer & Target Group
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'SrynAlb', {
      vpc,
      internetFacing: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroup: this.albSecurityGroup,
    });

    const httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      open: false,
    });

    httpListener.addTargets('EcsTargets', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.fargateService],
      healthCheck: {
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // WAF Web ACL Association with ALB
    new wafv2.CfnWebACLAssociation(this, 'AlbWafAssociation', {
      resourceArn: this.alb.loadBalancerArn,
      webAclArn,
    });

    // 9. API Gateway HTTP API & VPC Link Integration
    const vpcLink = new apigatewayv2.VpcLink(this, 'HttpApiVpcLink', {
      vpc,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.albSecurityGroup],
    });

    const albIntegration = new apigatewayv2_integrations.HttpAlbIntegration(
      'AlbIntegration',
      httpListener,
      {
        vpcLink,
      }
    );

    this.httpApi = new apigatewayv2.HttpApi(this, 'SrynHttpApi', {
      apiName: `sryn-finserv-api-${config.environment}`,
      description: `API Gateway HTTP API for SRYN FinServ ${config.environment}`,
      defaultIntegration: albIntegration,
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: config.corsAllowedOrigins,
        maxAge: cdk.Duration.days(1),
      },
    });

    // 10. Dedicated One-Off Database Migration Task Definition
    this.migrationTaskDef = new ecs.FargateTaskDefinition(this, 'MigrationTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole: ecsExecutionRole,
      taskRole: ecsTaskRole,
    });

    this.migrationTaskDef.addContainer('MigrationContainer', {
      image: ecs.ContainerImage.fromEcrRepository(backendRepo, `${config.environment}-latest`),
      command: ['node', 'dist/database/runner.js'],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'migration',
        logGroup,
      }),
      environment: {
        NODE_ENV: config.environment,
        AWS_REGION: config.region,
        DB_HOST: dbInstance.dbInstanceEndpointAddress,
        DB_PORT: dbInstance.dbInstanceEndpointPort.toString(),
        DB_NAME: `sryn_finserv_${config.environment}`,
        DB_USER: 'sryn_db_user',
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(importedDbSecret, 'password'),
      },
    });

    cdk.Tags.of(this).add('Project', 'SRYN-FinServ');
    cdk.Tags.of(this).add('Environment', config.environment);
  }
}
