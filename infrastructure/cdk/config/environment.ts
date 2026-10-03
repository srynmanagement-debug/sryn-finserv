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
  corsAllowedOrigins: string[];
  ecsDesiredCount?: number;
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
    rdsInstanceType: 't4g.micro',
    multiAzDb: false,
    corsAllowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:8080'],
    ecsDesiredCount: 0,
  },
  staging: {
    environment: 'staging',
    region: DEFAULT_AWS_REGION,
    vpcCidr: '10.1.0.0/16',
    enableNatGateway: true,
    natGatewaysCount: 1,
    rdsAllocatedStorageGb: 50,
    rdsInstanceType: 't4g.small',
    multiAzDb: false,
    corsAllowedOrigins: [
      'https://staging-admin.sryn.co.in',
      'https://staging-tl.sryn.co.in',
      'https://staging-manager.sryn.co.in',
    ],
    ecsDesiredCount: 0,
  },
  production: {
    environment: 'production',
    region: DEFAULT_AWS_REGION,
    vpcCidr: '10.2.0.0/16',
    enableNatGateway: true,
    natGatewaysCount: 2,
    rdsAllocatedStorageGb: 100,
    rdsInstanceType: 'm6g.large',
    multiAzDb: true,
    corsAllowedOrigins: [
      'https://admin.sryn.co.in',
      'https://tl.sryn.co.in',
      'https://manager.sryn.co.in',
    ],
  },
};
