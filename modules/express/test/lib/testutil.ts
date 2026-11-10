/**
 * Utility functions for testing
 */
import * as request from 'supertest';
import { app as expressApp } from '../../src/expressApp';
import { Config, DefaultConfig } from '../../src/config';

/**
 * Shared secret used by signer-mode test instances. When a test configures
 * `signerMode` or `externalSignerUrl`, setupAgent wires this secret in and
 * requests must present it via the X-Auth-Signer header.
 */
export const SIGNER_AUTH_SECRET = 'test-signer-auth-secret-0123456789';

// helper function to unlock a token for a specified time
export function unlockToken(agent, accessToken, seconds) {
  return agent
    .post('/api/v1/user/unlock')
    .set('Authorization', 'Bearer ' + accessToken)
    .send({ otp: '0000000', duration: seconds })
    .then(function (res) {
      res.statusCode.should.equal(200);
    });
}

export function setupAgent(config?: Partial<Config>): request.SuperAgentTest {
  const args: Config = { ...DefaultConfig, ...config };

  // Signer-mode instances refuse to start without a shared secret.
  if ((args.signerMode !== undefined || args.externalSignerUrl !== undefined) && args.signerAuthSecret === undefined) {
    args.signerAuthSecret = SIGNER_AUTH_SECRET;
  }

  const app = expressApp(args);
  return request.agent(app);
}
