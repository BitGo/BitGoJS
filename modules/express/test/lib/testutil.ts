/**
 * Utility functions for testing
 */

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
