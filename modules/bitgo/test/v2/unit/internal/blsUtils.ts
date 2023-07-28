import * as _ from 'lodash';
import * as nock from 'nock';
import * as should from 'should';
import * as openpgp from 'openpgp';

import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import { BlsUtils, common, IBlsKeyPair, Keychain } from '@bitgo/sdk-core';
import assert = require('assert');
import { Eth2 } from '@bitgo/sdk-coin-eth2';

describe('BLS Utils:', async function () {
  const bitgo: TestableBG & BitGo = TestBitGo.decorate(BitGo, { env: 'mock' });
  bitgo.initializeTestVars();
  const eth2: Eth2 = bitgo.coin('eth2') as Eth2;
  let bgUrl: string;
  let blsUtils: BlsUtils;
  let bitgoKeyShare;

  const coinName = 'eth2';

  before(async function () {
    bitgoKeyShare = eth2.generateKeyPair();

    const bitGoGPGKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
    });
    const constants = {
      mpc: {
        bitgoPublicKey: bitGoGPGKey.publicKey,
      },
    };

    // TODO(WP-346): sdk-test mocks conflict so we can't use persist
    nock(bitgo.microservicesUrl('')).get('/api/v1/client/constants').times(3).reply(200, { ttl: 3600, constants });

    bgUrl = common.Environments[bitgo.getEnv()].uri;
    blsUtils = new BlsUtils(bitgo, eth2);
  });

  it('should generate BLS-DKG key chains', async function () {
    const userKeyShare: IBlsKeyPair = {
      ...eth2.generateKeyPair(),
      chaincode: '0',
    };
    const backupKeyShare: IBlsKeyPair = {
      ...eth2.generateKeyPair(),
      chaincode: '0',
    };
    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'test',
          email: 'test@test.com',
        },
      ],
    });
    const backupGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'testbackup',
          email: 'testbackup@test.com',
        },
      ],
    });

    const nockedBitGoKeychain = await nockBitgoKeychain({
      coin: coinName,
      userKeyShare,
      backupKeyShare,
      userGpgKey,
      backupGpgKey,
    });
    const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
    await nockBackupKeychain({ coin: coinName });

    const bitgoKeychain = await blsUtils.createBitgoKeychain(userGpgKey, backupGpgKey, userKeyShare, backupKeyShare);
    const userKeychain = await blsUtils.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase'
    );
    const backupKeychain = await blsUtils.createBackupKeychain(
      backupGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase'
    );

    bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
    userKeychain.should.deepEqual(nockedUserKeychain);

    // unencrypted `prv` property should exist on backup keychain
    const backupSigningMaterial = {
      userShare: {
        pub: userKeyShare.pub,
        priv: userKeyShare.secretShares![1],
        chaincode: userKeyShare.chaincode,
      },
      backupShare: {
        pub: backupKeyShare.pub,
        priv: backupKeyShare.secretShares![1],
        chaincode: backupKeyShare.chaincode,
        seed: backupKeyShare.seed,
      },
      bitgoShare: {
        pub: bitgoKeyShare.pub,
        priv: bitgoKeyShare.secretShares[1],
        chaincode: bitgoKeyShare.chaincode,
      },
    };
    const backupPrv = JSON.stringify(backupSigningMaterial);
    backupPrv.should.equal(backupKeychain.prv);
    should.exist(backupKeychain.encryptedPrv);
  });

  it('should generate BLS-DKG key chains with optional params', async function () {
    const enterprise = 'enterprise';
    const originalPasscodeEncryptionCode = 'originalPasscodeEncryptionCode';

    const userKeyShare: IBlsKeyPair = { ...eth2.generateKeyPair(), chaincode: '0' };
    const backupKeyShare: IBlsKeyPair = { ...eth2.generateKeyPair(), chaincode: '0' };
    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'test',
          email: 'test@test.com',
        },
      ],
    });
    const backupGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'testbackup',
          email: 'testbackup@test.com',
        },
      ],
    });

    const nockedBitGoKeychain = await nockBitgoKeychain({
      coin: coinName,
      userKeyShare,
      backupKeyShare,
      userGpgKey,
      backupGpgKey,
    });
    const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
    await nockBackupKeychain({ coin: coinName });

    const bitgoKeychain = await blsUtils.createBitgoKeychain(
      userGpgKey,
      backupGpgKey,
      userKeyShare,
      backupKeyShare,
      enterprise
    );
    const userKeychain = await blsUtils.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase',
      originalPasscodeEncryptionCode
    );
    const backupKeychain = await blsUtils.createBackupKeychain(
      backupGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase'
    );

    bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
    userKeychain.should.deepEqual(nockedUserKeychain);

    // unencrypted `prv` property should exist on backup keychain
    const backupSigningMaterial = {
      userShare: {
        pub: userKeyShare.pub,
        priv: userKeyShare.secretShares![1],
        chaincode: userKeyShare.chaincode,
      },
      backupShare: {
        pub: backupKeyShare.pub,
        priv: backupKeyShare.secretShares![1],
        chaincode: backupKeyShare.chaincode,
        seed: backupKeyShare.seed,
      },
      bitgoShare: {
        pub: bitgoKeyShare.pub,
        priv: bitgoKeyShare.secretShares[1],
        chaincode: bitgoKeyShare.chaincode,
      },
    };
    const backupPrv = JSON.stringify(backupSigningMaterial);
    backupPrv.should.equal(backupKeychain.prv);
    should.exist(backupKeychain.encryptedPrv);
  });

  it('should fail to generate BLS-DKG key chains', async function () {
    const userKeyShare: IBlsKeyPair = { ...eth2.generateKeyPair(), chaincode: '0' };
    const backupKeyShare: IBlsKeyPair = { ...eth2.generateKeyPair(), chaincode: '0' };
    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'test',
          email: 'test@test.com',
        },
      ],
    });
    const backupGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'testbackup',
          email: 'testbackup@test.com',
        },
      ],
    });

    const nockedBitGoKeychain = await nockBitgoKeychain({
      coin: coinName,
      userKeyShare,
      backupKeyShare,
      userGpgKey,
      backupGpgKey,
    });
    const bitgoKeychain = await blsUtils.createBitgoKeychain(userGpgKey, backupGpgKey, userKeyShare, backupKeyShare);
    bitgoKeychain.should.deepEqual(nockedBitGoKeychain);

    await blsUtils
      .createUserKeychain(
        userGpgKey,
        userKeyShare,
        { ...eth2.generateKeyPair(), chaincode: '0' },
        bitgoKeychain,
        'passphrase'
      )
      .should.be.rejectedWith('Failed to create user keychain - commonKeychains do not match.');
    await blsUtils
      .createUserKeychain(
        userGpgKey,
        { ...eth2.generateKeyPair(), chaincode: '0' },
        backupKeyShare,
        bitgoKeychain,
        'passphrase'
      )
      .should.be.rejectedWith('Failed to create user keychain - commonKeychains do not match.');

    await blsUtils
      .createBackupKeychain(
        backupGpgKey,
        { ...eth2.generateKeyPair(), chaincode: '0' },
        backupKeyShare,
        bitgoKeychain,
        'passphrase'
      )
      .should.be.rejectedWith('Failed to create backup keychain - commonKeychains do not match.');
    await blsUtils
      .createBackupKeychain(
        backupGpgKey,
        userKeyShare,
        { ...eth2.generateKeyPair(), chaincode: '0' },
        bitgoKeychain,
        'passphrase'
      )
      .should.be.rejectedWith('Failed to create backup keychain - commonKeychains do not match.');
  });

  // Nock helpers

  async function nockBitgoKeychain(params: {
    coin: string;
    userKeyShare: IBlsKeyPair;
    backupKeyShare: IBlsKeyPair;
    userGpgKey: openpgp.SerializedKeyPair<string>;
    backupGpgKey: openpgp.SerializedKeyPair<string>;
  }): Promise<Keychain> {
    assert(params.userKeyShare.secretShares);
    assert(params.backupKeyShare.secretShares);

    const bitgoCombined = eth2.aggregateShares({
      pubShares: [bitgoKeyShare.pub, params.userKeyShare.pub, params.backupKeyShare.pub],
      prvShares: [
        params.userKeyShare.secretShares[2],
        params.backupKeyShare.secretShares[2],
        bitgoKeyShare.secretShares[2],
      ],
      chaincodes: [bitgoKeyShare.chaincode, params.userKeyShare.chaincode, params.backupKeyShare.chaincode],
    });
    const userGpgKeyActual = await openpgp.readKey({ armoredKey: params.userGpgKey.publicKey });
    const backupGpgKeyActual = await openpgp.readKey({ armoredKey: params.backupGpgKey.publicKey });

    const bitgoToUserMessage = await openpgp.createMessage({
      text: bitgoKeyShare.secretShares[0] + bitgoKeyShare.chaincode,
    });
    const encryptedBitgoToUserMessage = await openpgp.encrypt({
      message: bitgoToUserMessage,
      encryptionKeys: [userGpgKeyActual.toPublic()],
      format: 'armored',
    });

    const bitgoToBackupMessage = await openpgp.createMessage({
      text: bitgoKeyShare.secretShares[1] + bitgoKeyShare.chaincode,
    });
    const encryptedBitgoToBackupMessage = await openpgp.encrypt({
      message: bitgoToBackupMessage,
      encryptionKeys: [backupGpgKeyActual.toPublic()],
      format: 'armored',
    });

    const bitgoKeychain: Keychain = {
      id: '3',
      pub: bitgoCombined.pub,
      commonKeychain: bitgoCombined.pub + bitgoCombined.chaincode,
      keyShares: [
        {
          from: 'bitgo',
          to: 'user',
          publicShare: bitgoKeyShare.pub + bitgoKeyShare.chaincode,
          privateShare: encryptedBitgoToUserMessage.toString(),
        },
        {
          from: 'bitgo',
          to: 'backup',
          publicShare: bitgoKeyShare.pub + bitgoKeyShare.chaincode,
          privateShare: encryptedBitgoToBackupMessage.toString(),
        },
      ],
      type: 'blsdkg',
    };

    nock(bgUrl)
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'blsdkg', source: 'bitgo' }))
      .reply(200, bitgoKeychain);

    return bitgoKeychain;
  }

  async function nockUserKeychain(params: { coin: string }): Promise<Keychain> {
    const userKeychain: Keychain = {
      id: '1',
      pub: '',
      type: 'blsdkg',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'blsdkg', source: 'user' }))
      .reply(200, userKeychain);

    return userKeychain;
  }

  async function nockBackupKeychain(params: { coin: string }): Promise<Keychain> {
    const backupKeychain: Keychain = {
      id: '2',
      pub: '',
      type: 'blsdkg',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'blsdkg', source: 'backup' }))
      .reply(200, backupKeychain);

    return backupKeychain;
  }
});
