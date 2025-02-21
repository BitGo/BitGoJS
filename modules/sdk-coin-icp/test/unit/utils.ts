import should from 'should';
import utils from '../../src/lib/utils';
import { accounts } from '../resources/icp';

describe('utils', () => {
  it('should validate addresses correctly', () => {
    should.equal(utils.isValidAddress(accounts.account1.address), true);
    should.equal(utils.isValidAddress(accounts.account2.address), true);
    should.equal(utils.isValidAddress(accounts.account3.address), true);
    should.equal(utils.isValidAddress(accounts.account4.address), true);
    should.equal(utils.isValidAddress(accounts.account5.address), true);
    should.equal(utils.isValidAddress(accounts.account6.address), true);
  });

  it('should invalidate wrong addresses correctly', () => {
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address1), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address2), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address3), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address4), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address5), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address6), false);
  });
});
