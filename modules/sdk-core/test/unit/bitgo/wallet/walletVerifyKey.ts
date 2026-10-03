import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';
import { Ed25519Bip32HdTree } from '@bitgo/sdk-lib-mpc';
import Eddsa from '../../../../src/account-lib/mpc/tss';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';
import { IBaseCoin } from '../../../../src/bitgo/baseCoin';
import { getBitgoMpcGpgPubKey } from '../../../../src/bitgo/tss/bitgoPubKeys';
import { RequestTracer } from '../../../../src/bitgo/utils/util';

const UNSUPPORTED_WALLET_MESSAGE = 'Key verification is not supported for this wallet type';

describe('Wallet.verifyKey', function () {
  let commonKeychain: string;
  let matchingPrv: string;
  let otherPrv: string;

  before(async function () {
    const hdTree = await Ed25519Bip32HdTree.initialize();
    const MPC = await Eddsa.initialize(hdTree);

    const userKeyShare = MPC.keyShare(1, 2, 3);
    const backupKeyShare = MPC.keyShare(2, 2, 3);
    const bitgoKeyShare = MPC.keyShare(3, 2, 3);
    const combined = MPC.keyCombine(userKeyShare.uShare, [backupKeyShare.yShares[1], bitgoKeyShare.yShares[1]]);
    commonKeychain = combined.pShare.y + combined.pShare.chaincode;
    matchingPrv = JSON.stringify({
      uShare: userKeyShare.uShare,
      bitgoYShare: bitgoKeyShare.yShares[1],
      backupYShare: backupKeyShare.yShares[1],
    });

    // an independent key generation for the negative case
    const otherUserKeyShare = MPC.keyShare(1, 2, 3);
    const otherBackupKeyShare = MPC.keyShare(2, 2, 3);
    const otherBitgoKeyShare = MPC.keyShare(3, 2, 3);
    otherPrv = JSON.stringify({
      uShare: otherUserKeyShare.uShare,
      bitgoYShare: otherBitgoKeyShare.yShares[1],
      backupYShare: otherBackupKeyShare.yShares[1],
    });
  });

  let mockBitGo: { post: sinon.SinonStub; setRequestTracer: sinon.SinonStub; fetchConstants: sinon.SinonStub };
  let mockBaseCoin: {
    supportsTss: sinon.SinonStub;
    getFamily: sinon.SinonStub;
    getMPCAlgorithm: sinon.SinonStub;
    keychains: sinon.SinonStub;
    url: sinon.SinonStub;
  };
  let walletData: { id: string; keys: string[]; multisigType: string; multisigTypeVersion?: string };
  let getKeychainStub: sinon.SinonStub;

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      setRequestTracer: sinon.stub(),
      // the MPCv2/ECDSA utils constructors call setBitgoGpgPubKey, which fetches constants;
      // stubbing it avoids a swallowed unhandled rejection in those tests
      fetchConstants: sinon.stub().resolves({
        mpc: { bitgoPublicKey: getBitgoMpcGpgPubKey('test', 'nitro', 'mpcv1') },
      }),
    };

    getKeychainStub = sinon.stub().resolves({ id: 'user-key-id', type: 'tss', commonKeychain });

    mockBaseCoin = {
      supportsTss: sinon.stub().returns(true),
      getFamily: sinon.stub().returns('sol'),
      getMPCAlgorithm: sinon.stub().returns('eddsa'),
      keychains: sinon.stub().returns({ get: getKeychainStub }),
      url: sinon.stub().returns('/api/v2/sol/wallet/test-wallet-id'),
    };

    walletData = {
      id: 'test-wallet-id',
      keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
      multisigType: 'tss',
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  /**
   * Builds the wallet under test from the sinon stand-ins. The casts are safe because the
   * Wallet constructor and verifyKey only touch the members stubbed above.
   */
  function buildWallet(): Wallet {
    return new Wallet(mockBitGo as unknown as BitGoBase, mockBaseCoin as unknown as IBaseCoin, walletData);
  }

  it('returns match true for user signing material that belongs to the wallet', async function () {
    const wallet = buildWallet();

    const result = await wallet.verifyKey({ prv: matchingPrv });

    assert.deepStrictEqual(result, { match: true });
    sinon.assert.calledOnce(getKeychainStub);
    assert.strictEqual(getKeychainStub.firstCall.args[0].id, walletData.keys[0]);
  });

  it('forwards the request tracer to the keychain fetch', async function () {
    const wallet = buildWallet();
    const reqId = new RequestTracer();

    const result = await wallet.verifyKey({ prv: matchingPrv, reqId });

    assert.deepStrictEqual(result, { match: true });
    sinon.assert.calledOnce(getKeychainStub);
    assert.strictEqual(getKeychainStub.firstCall.args[0].reqId, reqId);
  });

  it('returns match false for user signing material from a different key generation', async function () {
    const wallet = buildWallet();

    const result = await wallet.verifyKey({ prv: otherPrv });

    assert.deepStrictEqual(result, { match: false });
    sinon.assert.calledOnce(getKeychainStub);
  });

  it('rejects on-chain multisig wallets without fetching the keychain', async function () {
    walletData.multisigType = 'onchain';
    const wallet = buildWallet();

    await assert.rejects(wallet.verifyKey({ prv: matchingPrv }), { message: UNSUPPORTED_WALLET_MESSAGE });
    sinon.assert.notCalled(getKeychainStub);
  });

  it('rejects TSS EdDSA MPCv2 wallets without fetching the keychain', async function () {
    walletData.multisigTypeVersion = 'MPCv2';
    const wallet = buildWallet();

    await assert.rejects(wallet.verifyKey({ prv: matchingPrv }), { message: UNSUPPORTED_WALLET_MESSAGE });
    sinon.assert.notCalled(getKeychainStub);
  });

  it('rejects TSS ECDSA wallets without fetching the keychain', async function () {
    mockBaseCoin.getMPCAlgorithm.returns('ecdsa');
    const wallet = buildWallet();

    await assert.rejects(wallet.verifyKey({ prv: matchingPrv }), { message: UNSUPPORTED_WALLET_MESSAGE });
    sinon.assert.notCalled(getKeychainStub);
  });

  it('rejects when the user keychain has no commonKeychain', async function () {
    getKeychainStub.resolves({ id: 'user-key-id', type: 'tss' });
    const wallet = buildWallet();

    await assert.rejects(wallet.verifyKey({ prv: matchingPrv }), {
      message: 'wallet keychain is missing commonKeychain',
    });
  });
});
