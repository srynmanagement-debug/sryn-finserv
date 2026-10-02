export interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  region: string;
  account?: string;
  vpcCidr: string;
  enableNatGateway: boolean;
  natGatewaysCount: number;
  rdsAllocatedStorageGb: number;
  rdsInstanceType: string;
  multiAzDb: boolean;
}

export const DEFAULT_AWS_REGION = 'ap-south-1'; // Mumbai

export const environments: Record<string, EnvironmentConfig> = {
  development: {
    environment: 'development',
    region: DEFAULT_AWS_REGION,
    vpcCidr: '10.0.0.0/16',
    enableNatGateway: false, // ZERO NAT Gateways for dev cost control
    natGatewaysCount: 0,
    rdsAllocatedStorageGb: 20,
    rdsInstanceType: 'db.t4g.micro',
    multiAzDb: false,
  },
  staging: {
    environment: 'staging',
    region: DEFAULT_AWS_REGION,
    vpcCidr: '10.1.0.0/16',
    enableNatGateway: true,
    natGatewaysCount: 1,
    rdsAllocatedStorageGb: 50,
    rdsInstanceType: 'db.t4g.small',
    multiAzDb: false,
  },
  production: {
    environment: 'production',
    region: DEFAULT_AWS_REGION,
    vpcCidr: '10.2.0.0/16',
    enableNatGateway: true,
    natGatewaysCount: 2,
    rdsAllocatedStorageGb: 100,
    rdsInstanceType: 'db.m6g.large',
    multiAzDb: true,
  },
};
