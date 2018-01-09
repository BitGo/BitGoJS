//
// Tests for Wallets
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

require('should');

const Promise = require('bluebird');
const co = Promise.coroutine;
const BigNumber = require('bignumber.js');

const TestV2BitGo = require('./lib/test_bitgo');

describe('Enterprise', function() {

  let bitgo;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    yield bitgo.authenticateTestUser(bitgo.testUserOTP());

  }));

  describe('Fetch Enterprise', function() {

    it('should fetch an enterprise', co(function *() {
      const enterprises = bitgo.coin('tltc').enterprises();
      const entList = yield enterprises.list();
      entList.length.should.be.greaterThan(6);
      const enterprise1 = entList[0];
      enterprise1.id.should.equal('5578ebc76eb47487743b903166e6543a');
      enterprise1.name.should.equal('SDKTest');
    }));

    it('should fetch the users of an enterprise', co(function *() {
      const enterprises = bitgo.coin('tltc').enterprises();
      const enterprise = (yield enterprises.list())[0];
      const users = yield enterprise.users();
      users.should.have.property('adminUsers');
      users.should.have.property('walletUsers');
      const { adminUsers, walletUsers } = users;
      adminUsers.length.should.equal(3);
      walletUsers.length.should.equal(2);
      const walletUser = walletUsers[0];
      walletUser.should.have.property('id');
      walletUser.should.have.property('username');
      walletUser.id.should.equal('543c11ed356d00cb7600000b98794503');
      walletUser.username.should.equal('tester@bitgo.com');
      const adminUser = adminUsers[0];
      adminUser.should.have.property('id');
      adminUser.should.have.property('username');
      adminUser.should.have.property('verified');
      adminUser.id.should.equal('543c11ed356d00cb7600000b98794503');
      adminUser.username.should.equal('tester@bitgo.com');
      adminUser.verified.should.equal(true);
    }));

    it('should fetch an enterprise eth fee balance', co(function *() {
      const enterprises = bitgo.coin('teth').enterprises();
      const enterprise = (yield enterprises.list())[0];
      const feeBalance = yield enterprise.getFeeAddressBalance();
      feeBalance.should.have.property('balance');
      const balance = new BigNumber(feeBalance.balance);
      balance.greaterThan(1000).should.equal(true);
    }));
  });

  describe('Modify Enterprise', function() {

    // TODO: figure out how to approve the removal request from another user
    it('should add and remove user from enterprise', co(function *() {
      const enterprise = yield bitgo.coin('tltc').enterprises().create({ name: 'Test Enterprise' });
      const refetchedEnterprise = yield bitgo.coin('tltc').enterprises().get({ id: enterprise.id });
      const users0 = yield refetchedEnterprise.users();
      yield enterprise.addUser({ username: 'arik+test008@bitgo.com' });
      const users1 = yield refetchedEnterprise.users();
      const removalPendingApproval = yield enterprise.removeUser({ username: 'arik+test008@bitgo.com' });
      enterprise.id.should.equal(refetchedEnterprise.id);
      refetchedEnterprise.name.should.equal('Test Enterprise');
      users0.adminUsers.length.should.equal(1);
      users1.adminUsers.length.should.equal(2);
      users0.walletUsers.length.should.equal(0);
      users1.walletUsers.length.should.equal(0);
      removalPendingApproval.state.should.equal('pending');
    }));

  });

});
