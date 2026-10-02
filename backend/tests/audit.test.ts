import { redactSensitiveData } from '../src/modules/audit/audit.service';

describe('Audit Service & Sensitive Data Redaction', () => {
  it('should redact sensitive keys such as password, token, jwt, secret, cvv, and panNumber', () => {
    const rawData = {
      email: 'user@sryn.local',
      password: 'MySecretPassword123',
      token: 'bearer.jwt.secret.token',
      jwt: 'header.payload.signature',
      secret: 'api_secret_key',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '1234-5678-9012',
      metadata: {
        cvv: '123',
        creditCardNumber: '4111222233334444',
        safeField: 'AllowedValue',
      },
    };

    const sanitized = redactSensitiveData(rawData);

    expect(sanitized.email).toBe('user@sryn.local');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.jwt).toBe('[REDACTED]');
    expect(sanitized.secret).toBe('[REDACTED]');
    expect(sanitized.panNumber).toBe('[REDACTED]');
    expect(sanitized.aadhaarNumber).toBe('[REDACTED]');
    expect(sanitized.metadata.cvv).toBe('[REDACTED]');
    expect(sanitized.metadata.creditCardNumber).toBe('[REDACTED]');
    expect(sanitized.metadata.safeField).toBe('AllowedValue');
  });
});
