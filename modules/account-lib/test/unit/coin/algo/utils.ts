import should from 'should';
import utils from '../../../../src/coin/algo/utils';

import * as AlgoResources from '../../../resources/algo';

describe('utils', () => {
  const {
    accounts: { account1, account2, account3 },
  } = AlgoResources;

  it('should properly encode an algorand address from an ed25519 public key', () => {
    should.equal(utils.publicKeyToAlgoAddress(account1.pubKey), account1.address);
    should.equal(utils.publicKeyToAlgoAddress(account2.pubKey), account2.address);
    should.equal(utils.publicKeyToAlgoAddress(account3.pubKey), account3.address);
  });
});
