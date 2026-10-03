import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config/environment';

export interface DatabaseStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { config, vpc } = props;

    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for SRYN PostgreSQL RDS instance',
      allowAllOutbound: false,
    });

    this.dbInstance = new rds.DatabaseInstance(this, 'PostgresInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      instanceType: new ec2.InstanceType(config.rdsInstanceType),
      allocatedStorage: config.rdsAllocatedStorageGb,
      maxAllocatedStorage: config.rdsAllocatedStorageGb * 2,
      databaseName: `sryn_finserv_${config.environment}`,
      multiAz: config.multiAzDb,
      storageEncrypted: true,
      securityGroups: [this.dbSecurityGroup],
      removalPolicy: config.environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(this).add('Project', 'SRYN-FinServ');
    cdk.Tags.of(this).add('Environment', config.environment);
  }
}
