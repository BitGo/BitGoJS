import {
  BitgoMpcGpgPubKeys,
  common,
  ECDSAUtils,
  EddsaUtils,
  EnvironmentName,
  IRequestTracer,
  Wallet,
} from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';

import { BitGo } from '../../../../../src';
import * as openpgp from 'openpgp';
import nock = require('nock');
import assert = require('assert');

class TestEcdsaMpcv2Utils extends ECDSAUtils.EcdsaMPCv2Utils {
  public async testPickBitgoPubGpgKeyForSigning(
    isMpcv2: boolean,
    reqId?: IRequestTracer,
    enterpriseId?: string
  ): Promise<openpgp.Key> {
    return this.pickBitgoPubGpgKeyForSigning(isMpcv2, reqId, enterpriseId);
  }
}

class TestEddsaMpcv1Utils extends EddsaUtils {
  public async testPickBitgoPubGpgKeyForSigning(
    isMpcv2: boolean,
    reqId?: IRequestTracer,
    enterpriseId?: string
  ): Promise<openpgp.Key> {
    return this.pickBitgoPubGpgKeyForSigning(isMpcv2, reqId, enterpriseId);
  }
}

describe('TSS MPC Pick BitGo GPG Pub Key Utils:', function () {
  const walletId = '5b34252f1bf349930e34020a00000000';
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';
  const ecdsaCoinName = 'hteth';
  const eddsaCoinName = 'tsol';
  const ecdsaWalletData = {
    id: walletId,
    enterprise: enterpriseId,
    coin: ecdsaCoinName,
    coinSpecific: {},
    multisigType: 'tss',
    keys: ['key1', 'key2', 'key3'],
  };
  const eddsaWalletData = {
    id: walletId,
    enterprise: enterpriseId,
    coin: eddsaCoinName,
    coinSpecific: {},
    multisigType: 'tss',
    keys: ['key1', 'key2', 'key3'],
  };
  const envs: EnvironmentName[] = ['test', 'staging', 'prod'];
  const ecdsaMpcv2Utils: TestEcdsaMpcv2Utils[] = [];
  const eddsaMpcv1Utils: TestEddsaMpcv1Utils[] = [];

  before(async function () {
    nock.cleanAll();
    for (const env of envs) {
      const bitgoInstance = TestBitGo.decorate(BitGo, { env });
      bitgoInstance.initializeTestVars();
      let coinInstance = bitgoInstance.coin(ecdsaCoinName);
      ecdsaMpcv2Utils.push(
        new TestEcdsaMpcv2Utils(bitgoInstance, coinInstance, new Wallet(bitgoInstance, coinInstance, ecdsaWalletData))
      );
      coinInstance = bitgoInstance.coin(eddsaCoinName);
      eddsaMpcv1Utils.push(
        new TestEddsaMpcv1Utils(bitgoInstance, coinInstance, new Wallet(bitgoInstance, coinInstance, eddsaWalletData))
      );
    }
  });

  beforeEach(async function () {
    for (const env of envs) {
      const bgUrl = common.Environments[env].uri;
      nock(bgUrl).get(`/api/v2/${ecdsaCoinName}/key/key3`).times(envs.length).reply(200, { hsmType: 'onprem' });
      nock(bgUrl).get(`/api/v2/${eddsaCoinName}/key/key3`).times(envs.length).reply(200, { hsmType: 'nitro' });
    }
  });

  envs.forEach(async function (env, index) {
    it(`should pick correct Mpcv2 BitGo GPG Pub Key for ${env} env`, async function () {
      const bitgoGpgPubKey = await ecdsaMpcv2Utils[index].testPickBitgoPubGpgKeyForSigning(true);
      bitgoGpgPubKey
        .armor()
        .should.equal(BitgoMpcGpgPubKeys.bitgoMpcGpgPubKeys['mpcv2']['onprem'][env === 'staging' ? 'test' : env]);
    });
  });

  envs.forEach(async function (env, index) {
    it(`should pick correct Mpcv1 BitGo GPG Pub Key for ${env} env`, async function () {
      const bitgoGpgPubKey = await eddsaMpcv1Utils[index].testPickBitgoPubGpgKeyForSigning(false);
      bitgoGpgPubKey
        .armor()
        .should.equal(BitgoMpcGpgPubKeys.bitgoMpcGpgPubKeys['mpcv1']['nitro'][env === 'staging' ? 'test' : env]);
    });
  });

  it(`should pick BitGo GPG Pub Key based on enterprise flag for mock env`, async function () {
    const bgUrl = common.Environments['mock'].uri;
    const testBitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const testCoin = testBitgo.coin(ecdsaCoinName);
    const bitgoGPGKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
    });
    nock(bgUrl)
      .get(`/api/v2/${ecdsaCoinName}/tss/pubkey`)
      .query({ enterpriseId })
      .reply(200, { mpcv2PublicKey: bitgoGPGKey.publicKey });
    const ecdsaMpcv2Util = new TestEcdsaMpcv2Utils(
      testBitgo,
      testCoin,
      new Wallet(testBitgo, testCoin, ecdsaWalletData)
    );
    const bitgoGpgPubKey = await ecdsaMpcv2Util.testPickBitgoPubGpgKeyForSigning(true, undefined, enterpriseId);
    bitgoGpgPubKey.armor().should.equal(bitgoGPGKey.publicKey);
  });

  it(`should pick BitGo GPG Pub Key based on constants api for mock env if enterprise flag based fetch fails`, async function () {
    nock.cleanAll();
    const bgUrl = common.Environments['mock'].uri;
    const testBitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const testCoin = testBitgo.coin(ecdsaCoinName);
    const bitgoGPGKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
    });
    const constants = {
      mpc: {
        bitgoMPCv2PublicKey: bitgoGPGKey.publicKey,
        bitgoPublicKey: bitgoGPGKey.publicKey,
      },
    };
    nock(bgUrl).get('/api/v1/client/constants').times(2).reply(200, { ttl: 3600, constants });
    const ecdsaMpcv2Util = new TestEcdsaMpcv2Utils(
      testBitgo,
      testCoin,
      new Wallet(testBitgo, testCoin, ecdsaWalletData)
    );
    const bitgoGpgPubKey = await ecdsaMpcv2Util.testPickBitgoPubGpgKeyForSigning(true, undefined, enterpriseId);
    bitgoGpgPubKey.armor().should.equal(bitgoGPGKey.publicKey);
  });

  it(`should throw an error if config is not available in one of test, staging, or prod`, async function () {
    nock.cleanAll();
    const testBitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    const testCoin = testBitgo.coin(ecdsaCoinName);
    const ecdsaMpcv2Util = new TestEcdsaMpcv2Utils(
      testBitgo,
      testCoin,
      new Wallet(testBitgo, testCoin, ecdsaWalletData)
    );
    await assert.rejects(async () => await ecdsaMpcv2Util.testPickBitgoPubGpgKeyForSigning(true));
  });
});
