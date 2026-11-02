import should from 'should';
import sinon from 'sinon';
import BN from 'bn.js';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AbstractEthLikeNewCoins, KeyPair as EthKeyPair, UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import { Ecdsa, RecoveryKeyMismatchError } from '@bitgo/sdk-core';
import { Tbsc } from '../../src';

/**
 * BSC declares CoinFeature.MPCV2 but never overrode `buildUnsignedSweepTxnTSS`, so it inherited
 * the MPCv1 body, which fed the 130-char common keychain straight into `new KeyPair({ pub })` and
 * threw `Unsupported public key` — an unsigned TSS sweep was impossible on this coin.
 *
 * The base class now dispatches MPCV2 coins to `buildUnsignedSweepTxnMPCv2`. These tests pin that
 * dispatch for one of the four coins (bsc, arbeth, opeth, bera) that gained it, so the fix cannot
 * silently regress.
 */
describe('BSC unsigned TSS sweep (MPCv2 dispatch)', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: AbstractEthLikeNewCoins;
  const sandbox = sinon.createSandbox();

  // a real MPCv2 common keychain (33-byte pubkey + 32-byte chaincode, hex)
  const commonKeyChain =
    '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570' +
    'e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446';
  const recoveryDestination = '0xd5ADdE17feD8baed3F32b84AF05B8F2816f7b560';
  let baseAddress: string;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tbsc', Tbsc.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbsc') as unknown as AbstractEthLikeNewCoins;

    const pub = new Ecdsa().deriveUnhardened(commonKeyChain, 'm/0').slice(0, 66);
    baseAddress = new EthKeyPair({ pub }).getAddress();
  });

  beforeEach(function () {
    sandbox.stub(basecoin, 'queryAddressBalance').resolves(new BN('100000000000000000'));
    sandbox.stub(basecoin, 'getAddressNonce').resolves(0);
  });

  afterEach(function () {
    sandbox.restore();
  });

  function recover(walletContractAddress: string) {
    return basecoin.recover({
      userKey: commonKeyChain,
      backupKey: commonKeyChain,
      isTss: true,
      walletContractAddress,
      recoveryDestination,
      gasLimit: 200000,
      gasPrice: 20000000000,
      // tbsc is not EIP-1559, so a legacy hardfork is required here
      replayProtectionOptions: { chain: 97, hardfork: 'petersburg' },
    });
  }

  it('derives the base address from the common keychain instead of rejecting it', async function () {
    const sweep = (await recover(baseAddress)) as UnsignedSweepTxMPCv2;

    // The MPCv2 payload shape, not the MPCv1 OfflineVaultTxInfo the broken path would have built.
    sweep.txRequests.should.have.length(1);
    const unsignedTx = sweep.txRequests[0].transactions[0].unsignedTx;
    unsignedTx.derivationPath.should.equal('m/0');
    should.exist(unsignedTx.signableHex);
  });

  it('fails closed when the wallet address is not the one the keychain derives', async function () {
    await recover('0xe740412ab65efdbdbe2a5e4c6e01d7bbc54a38a9').should.be.rejectedWith(RecoveryKeyMismatchError);
  });
});
