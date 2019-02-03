//
// Tests for Wallets
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

require('should');

const Promise = require('bluebird');
const co = Promise.coroutine;
const BigNumber = require('bignumber.js');

const TestV2BitGo = require('../lib/test_bitgo');

describe('Enterprise', function() {

  let bitgo;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    yield bitgo.authenticateEnterpriseCreatorTestUser(bitgo.testUserOTP());

  }));

  describe('Fetch Enterprise', function() {

    it('should fetch an enterprise', co(function *() {
      const enterprises = bitgo.coin('tltc').enterprises();
      const entList = yield enterprises.list();
      entList.length.should.be.greaterThan(6);
      const enterprise1 = entList[0];
      enterprise1.id.should.equal('5a84db9be4b3cab007c08ab59fb93ec3');
      enterprise1.name.should.equal('Test Enterprise');
    }));

    it('should fetch the users of an enterprise', co(function *() {
      const enterprises = bitgo.coin('tltc').enterprises();
      const enterprise = (yield enterprises.list())[0];
      const users = yield enterprise.users();
      users.should.have.property('adminUsers');
      users.should.have.property('walletUsers');
      const { adminUsers, walletUsers } = users;
      adminUsers.length.should.equal(2);
      walletUsers.length.should.equal(1);
      const walletUser = walletUsers[0];
      walletUser.should.have.property('id');
      walletUser.should.have.property('username');
      walletUser.id.should.equal('5a84db312cd303af07897eebb5a0fba2');
      walletUser.username.should.equal('enterprisecreator@bitgo.com');
      const adminUser = adminUsers[0];
      adminUser.should.have.property('id');
      adminUser.should.have.property('username');
      adminUser.should.have.property('verified');
      adminUser.id.should.equal('5a849b8cb6f7cb5007b77741e632675a');
      adminUser.username.should.equal('enterprisetester@bitgo.com');
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

  // TODO: remove enterprises after creating them once the functionality is available
  describe('Modify Enterprise', function() {

    // TODO: figure out how to approve the removal request from another user
    it('should add and remove user from enterprise', co(function *() {
      const enterprise = yield bitgo.coin('tltc').enterprises().create({ name: 'Test Enterprise' });
      const refetchedEnterprise = yield bitgo.coin('tltc').enterprises().get({ id: enterprise.id });
      const users0 = yield refetchedEnterprise.users();
      yield enterprise.addUser({ username: 'enterprisetester@bitgo.com' });
      const users1 = yield refetchedEnterprise.users();
      const removalPendingApproval = yield enterprise.removeUser({ username: 'enterprisetester@bitgo.com' });
      enterprise.id.should.equal(refetchedEnterprise.id);
      refetchedEnterprise.name.should.equal('Test Enterprise');
      users0.adminUsers.length.should.equal(1);
      users1.adminUsers.length.should.equal(2);
      users0.walletUsers.length.should.equal(0);
      users1.walletUsers.length.should.equal(0);
      removalPendingApproval.state.should.equal('pending');
    }));

    it('should add wallets and then list them on an enterprise', co(function *coEnterpriseWalletAdditionTest() {
      const enterprise = yield bitgo.coin('tltc').enterprises().create({ name: 'Test Enterprise' });
      const wallet = yield bitgo.coin('tltc').wallets().generateWallet({
        label: 'Enterprise Test Wallet',
        enterprise: enterprise.id,
        passphrase: TestV2BitGo.TEST_WALLET1_PASSCODE
      });
      const enterpriseWallets = yield enterprise.coinWallets();
      enterpriseWallets.should.have.property('wallets');
      enterpriseWallets.wallets.length.should.equal(1);
      enterpriseWallets.wallets[0].id().should.equal(wallet.wallet.id());
      yield wallet.wallet.remove();
      const updatedEnterpriseWallets = yield enterprise.coinWallets();
      updatedEnterpriseWallets.should.have.property('wallets');
      updatedEnterpriseWallets.wallets.length.should.equal(0);
    }));

  });

});
