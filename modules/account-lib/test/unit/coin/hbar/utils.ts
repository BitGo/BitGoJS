import should from 'should';
import { isValidAccount, isValidPublicKey } from '../../../../src/coin/hbar/utils';

describe('Validate', () => {
  it('an account', () => {
    should.equal(isValidAccount('0.0.2356'), true);
    should.equal(isValidAccount('0.2356'), false);
    should.equal(isValidAccount('452893'), true);
    should.equal(isValidAccount('0.0.23.56'), false);
  });

  it('a public key', () => {
    should.equal(isValidPublicKey('1c5b8332673e2bdd7d677970e549e05157ea6a94f41a5da5020903c1c391f8ef'), true);
  });
});