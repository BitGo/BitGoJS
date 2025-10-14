/**
 * Utility functions for testing
 */
import * as request from 'supertest';
import { app as expressApp } from '../../src/expressApp';

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

export function setupAgent(): request.SuperAgentTest {
  const args: any = {
    debug: false,
    env: 'test',
    logfile: '/dev/null',
  };

  const app = expressApp(args);
  return request.agent(app);
}
