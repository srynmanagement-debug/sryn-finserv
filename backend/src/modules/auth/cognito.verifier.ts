import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { envConfig } from '../../config/env.config';
import { logger } from '../../common/utils/logger';

export interface DecodedCognitoPayload {
  sub: string;
  email?: string;
  token_use: string;
  auth_time: number;
  iss: string;
  exp: number;
  username?: string;
}

export class CognitoAuthVerifier {
  private verifier: any = null;

  constructor() {
    if (envConfig.aws.userPoolId && envConfig.aws.clientId) {
      this.verifier = CognitoJwtVerifier.create({
        userPoolId: envConfig.aws.userPoolId,
        tokenUse: 'access',
        clientId: envConfig.aws.clientId,
      });
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.verifier);
  }

  public async verifyToken(token: string): Promise<DecodedCognitoPayload | null> {
    if (!this.verifier) {
      return null;
    }

    try {
      const payload = await this.verifier.verify(token);
      return payload as DecodedCognitoPayload;
    } catch (err) {
      logger.warn('Cognito JWT verification failed:', (err as Error).message);
      return null;
    }
  }
}
