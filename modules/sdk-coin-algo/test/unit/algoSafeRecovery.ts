import should from 'should';
import { Talgo } from '../../src';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import Sinon from 'sinon';
import { Algo } from '../../src/algo';
import { ed25519 } from '@noble/curves/ed25519';
import {
  buildSafeRecoverKeyParams,
  deriveSafeWalletKeys,
  encodeDerivableEd25519Pub,
  encodeEd25519ChainCode,
  type DecryptedSafeRoots,
} from '@bitgo/sdk-core';
import algosdk from 'algosdk';

/**
 * End-to-end Safe ALGO recovery: keycard decrypt → derive slot-2 children → map to recover()
 * params → `Algo.recover()` builds and signs a 2-of-3 multisig sweep whose rootAddress equals
 * `multisigAddress(1, 2, [user, backup, bitgo])`.
 *
 * This proves the whole WCN-2898 chain with real keys (no mocked derivation or encryption):
 * the lazy backup signer signs the actual transaction bytes with the derived kL/kR, so the final
 * transaction verifies under algosdk.verifyMultisig.
 */
describe('Safe ALGO recovery end-to-end', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('talgo', Talgo.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('talgo');
  });

  // The ed25519Multisig root fixture the sdk-core unit tests pin (with a distinct BitGo root, so the
  // backup child and the BitGo child are different keys and a slot swap changes every assertion).
  function ed25519Roots(): DecryptedSafeRoots {
    const seed = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';
    const chainCode = Buffer.alloc(32, 0xab);
    const bitgoSeed = Buffer.alloc(32, 0x22);
    const bitgoRootPub = Buffer.from(ed25519.getPublicKey(bitgoSeed));
    const bitgoChainCode = Buffer.alloc(32, 0xcd);
    return {
      secp256k1Multisig: { user: 'u', backup: 'b', bitgo: 'g' },
      ed25519Multisig: {
        user: seed,
        backup: { prv: seed, chainCode: encodeEd25519ChainCode(chainCode) },
        bitgo: encodeDerivableEd25519Pub(bitgoRootPub, bitgoChainCode),
      },
      ecdsaMpc: {
        user: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        backup: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        bitgo: 'g',
      },
      eddsaMpc: {
        user: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        backup: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        bitgo: 'g',
      },
    };
  }

  const nodeParams = {
    token: '2810c2d168e8417c5f111d38d68327b8cfe2d0ddc02986490c22f8ddf4128bcd',
    baseServer: 'http://localhost/',
    port: 8443,
  };
  const fee = 1000;
  const nativeBalance = 10_000_000; // 10 ALGO
  const recoveryDestination = 'GB3YETD5TSTBAIYGYHVWU3O3I7XGOB44HOZA5MOEF5M23CLLZKRQLEVAOA';

  it('recovers a Safe ALGO wallet whose rootAddress equals multisigAddress(1,2,[user,backup,bitgo])', async function () {
    const sandbox = Sinon.createSandbox();
    sandbox.stub(Algo.prototype, 'getAccountBalance').resolves(nativeBalance);

    const roots = ed25519Roots();
    const derived = await deriveSafeWalletKeys({ coin: 'algo', slot: 'ed25519Multisig', account: 0, roots });
    if (derived.slot !== 'ed25519Multisig') {
      throw new Error('expected ed25519Multisig slot');
    }

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'algo',
      slot: 'ed25519Multisig',
      keys: derived.keys,
      mode: 'signed',
    });
    if (keyParams.slot !== 'ed25519Multisig' || keyParams.mode !== 'signed') {
      throw new Error('expected signed ed25519Multisig key params');
    }

    // Distinct fixture roots: a slot swap between backup and bitgo must change the signer and root.
    derived.keys.user.pub.should.not.equal(derived.keys.backup.pub);
    derived.keys.backup.pub.should.not.equal(derived.keys.bitgo.pub);

    // The mapper's rootAddress is the wallet's on-chain address, derived from the same children.
    const expectedRoot = algosdk.multisigAddress({
      version: 1,
      threshold: 2,
      addrs: [
        algosdk.encodeAddress(Buffer.from(derived.keys.user.pub, 'hex')),
        algosdk.encodeAddress(Buffer.from(derived.keys.backup.pub, 'hex')),
        algosdk.encodeAddress(Buffer.from(derived.keys.bitgo.pub, 'hex')),
      ],
    });
    keyParams.rootAddress.should.equal(expectedRoot);

    const recovery = await basecoin.recover({
      userKey: keyParams.userKey,
      rootAddress: keyParams.rootAddress,
      bitgoKey: keyParams.bitgoKey,
      walletPassphrase: keyParams.walletPassphrase,
      fee,
      recoveryDestination,
      firstRound: 5002596,
      nodeParams,
      externalBackupSigner: keyParams.externalBackupSigner,
    });

    recovery.should.have.property('tx');
    const decoded = algosdk.decodeSignedTransaction(Buffer.from(recovery.tx as string, 'base64'));
    should(decoded.msig).not.be.undefined();

    const msigPk = algosdk.decodeAddress(expectedRoot).publicKey;
    algosdk.verifyMultisig(decoded.txn.bytesToSign(), decoded.msig!, msigPk).should.equal(true);

    sandbox.restore();
  });

  it('fails closed with RecoveryKeyMismatchError when the user key does not belong to the root', async function () {
    const sandbox = Sinon.createSandbox();
    sandbox.stub(Algo.prototype, 'getAccountBalance').resolves(nativeBalance);

    const roots = ed25519Roots();
    const derived = await deriveSafeWalletKeys({ coin: 'algo', slot: 'ed25519Multisig', account: 0, roots });
    if (derived.slot !== 'ed25519Multisig') {
      throw new Error('expected ed25519Multisig slot');
    }
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'algo',
      slot: 'ed25519Multisig',
      keys: derived.keys,
      mode: 'signed',
    });
    if (keyParams.slot !== 'ed25519Multisig' || keyParams.mode !== 'signed') {
      throw new Error('expected signed ed25519Multisig key params');
    }

    // A rootAddress the derived keys do not control: the fail-closed check fires before any node call.
    await basecoin
      .recover({
        userKey: keyParams.userKey,
        rootAddress: algosdk.encodeAddress(Buffer.alloc(32, 0xee)),
        bitgoKey: keyParams.bitgoKey,
        walletPassphrase: keyParams.walletPassphrase,
        fee,
        recoveryDestination,
        firstRound: 5002596,
        nodeParams,
        externalBackupSigner: keyParams.externalBackupSigner,
      })
      .should.be.rejectedWith(/does not match the given rootAddress/);

    sandbox.restore();
  });
});
