import * as _ from 'lodash';
import * as nock from 'nock';
import * as should from 'should';

import { BlsKeyPair, Keychain } from '../../../../src';
import { BlsUtils } from '../../../../src/v2/internal/blsUtils';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as common from '../../../../src/common';
import assert = require('assert');

describe('BLS Utils:', async function () {
  const bitgo = new TestBitGo({ env: 'mock' });
  bitgo.initializeTestVars();
  const eth2 = bitgo.coin('eth2');
  let bgUrl: string;
  let blsUtils: BlsUtils;
  let bitgoKeyShare;

  const coinName = 'eth2';

  before(async function () {
    bitgoKeyShare = eth2.generateKeyPair();

    bgUrl = common.Environments[bitgo.getEnv()].uri;
    blsUtils = new BlsUtils(bitgo, eth2);
  });

  it('should generate BLS-DKG key chains', async function () {
    const userKeyShare = eth2.generateKeyPair();
    const backupKeyShare = eth2.generateKeyPair();

    const nockedBitGoKeychain = await nockBitgoKeychain({
      coin: coinName,
      userKeyShare,
      backupKeyShare,
    });
    const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
    await nockBackupKeychain({ coin: coinName });

    const bitgoKeychain = await blsUtils.createBitgoKeychain(userKeyShare, backupKeyShare);
    const userKeychain = await blsUtils.createUserKeychain(
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase');
    const backupKeychain = await blsUtils.createBackupKeychain(
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase');

    const backupCombined = eth2.aggregateShares({
      pubShares: [backupKeyShare.pub, userKeyShare.pub, bitgoKeyShare.pub],
      prvShares: [userKeyShare.secretShares[1], backupKeyShare.secretShares[1], bitgoKeyShare.secretShares[1]],
    });

    bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
    userKeychain.should.deepEqual(nockedUserKeychain);

    // unencrypted `prv` property should exist on backup keychain
    backupCombined.prv.should.equal(backupKeychain.prv);
    should.exist(backupKeychain.encryptedPrv);

  });

  it('should generate BLS-DKG key chains with optional params', async function () {
    const enterprise = 'enterprise';
    const originalPasscodeEncryptionCode = 'originalPasscodeEncryptionCode';

    const userKeyShare = eth2.generateKeyPair();
    const backupKeyShare = eth2.generateKeyPair();

    const nockedBitGoKeychain = await nockBitgoKeychain({
      coin: coinName,
      userKeyShare,
      backupKeyShare,
    });
    const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
    await nockBackupKeychain({ coin: coinName });

    const bitgoKeychain = await blsUtils.createBitgoKeychain(userKeyShare, backupKeyShare, enterprise);
    const userKeychain = await blsUtils.createUserKeychain(
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase',
      originalPasscodeEncryptionCode);
    const backupKeychain = await blsUtils.createBackupKeychain(
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase');

    const backupCombined = eth2.aggregateShares({
      pubShares: [backupKeyShare.pub, userKeyShare.pub, bitgoKeyShare.pub],
      prvShares: [userKeyShare.secretShares[1], backupKeyShare.secretShares[1], bitgoKeyShare.secretShares[1]],
    });

    bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
    userKeychain.should.deepEqual(nockedUserKeychain);

    // unencrypted `prv` property should exist on backup keychain
    backupCombined.prv.should.equal(backupKeychain.prv);
    should.exist(backupKeychain.encryptedPrv);

  });

  // TODO BG-43029: Enable this UT when HSM response includes the pub share from bitgo to user and backup
  xit('should fail to generate BLS-DKG key chains', async function () {
    const userKeyShare = eth2.generateKeyPair();
    const backupKeyShare = eth2.generateKeyPair();

    const nockedBitGoKeychain = await nockBitgoKeychain({
      coin: coinName,
      userKeyShare,
      backupKeyShare,
    });
    const bitgoKeychain = await blsUtils.createBitgoKeychain(userKeyShare, backupKeyShare);
    bitgoKeychain.should.deepEqual(nockedBitGoKeychain);

    await blsUtils.createUserKeychain(
      userKeyShare,
      eth2.generateKeyPair(),
      bitgoKeychain,
      'passphrase')
      .should.be.rejectedWith('Failed to create user keychain - commonPubs do not match.');
    await blsUtils.createUserKeychain(
      eth2.generateKeyPair(),
      backupKeyShare,
      bitgoKeychain,
      'passphrase')
      .should.be.rejectedWith('Failed to create user keychain - commonPubs do not match.');

    await blsUtils.createBackupKeychain(
      eth2.generateKeyPair(),
      backupKeyShare,
      bitgoKeychain,
      'passphrase')
      .should.be.rejectedWith('Failed to create backup keychain - commonPubs do not match.');
    await blsUtils.createBackupKeychain(
      userKeyShare,
      eth2.generateKeyPair(),
      bitgoKeychain,
      'passphrase')
      .should.be.rejectedWith('Failed to create backup keychain - commonPubs do not match.');
  });

  // Nock helpers

  async function nockBitgoKeychain(params: {
    coin: string,
    userKeyShare: BlsKeyPair,
    backupKeyShare: BlsKeyPair
  }): Promise<Keychain> {

    assert(params.userKeyShare.secretShares);
    assert(params.backupKeyShare.secretShares);

    const bitgoCombined = eth2.aggregateShares({
      pubShares: [bitgoKeyShare.pub, params.userKeyShare.pub, params.backupKeyShare.pub],
      prvShares: [params.userKeyShare.secretShares[2], params.backupKeyShare.secretShares[2], bitgoKeyShare.secretShares[2]],
    });

    const bitgoKeychain: Keychain = {
      id: '3',
      pub: bitgoCombined.pub,
      commonPub: bitgoCombined.pub,
      keyShares: [
        {
          from: 'bitgo',
          to: 'user',
          publicShare: bitgoKeyShare.pub,
          privateShare: bitgoKeyShare.secretShares[0],
        },
        {
          from: 'bitgo',
          to: 'backup',
          publicShare: bitgoKeyShare.pub,
          privateShare: bitgoKeyShare.secretShares[1],
        },
      ],
    };

    nock(bgUrl)
      .post(`/api/v2/${params.coin}/key`, _.matches({ type: 'blsdkg', source: 'bitgo' }))
      .reply(200, bitgoKeychain);

    return bitgoKeychain;
  }

  async function nockUserKeychain(params: {
    coin: string,
  }): Promise<Keychain> {
    const userKeychain: Keychain = {
      id: '1',
      pub: '',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ type: 'blsdkg', source: 'user' }))
      .reply(200, userKeychain);

    return userKeychain;
  }

  async function nockBackupKeychain(params: {
    coin: string,
  }): Promise<Keychain> {
    const backupKeychain: Keychain = {
      id: '2',
      pub: '',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ type: 'blsdkg', source: 'backup' }))
      .reply(200, backupKeychain);

    return backupKeychain;
  }
});
