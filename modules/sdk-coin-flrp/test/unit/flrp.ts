import utils from '../../src/lib/utils';
import * as FlrpLib from '../../src/lib';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Flrp, TflrP } from '../../src/';
import { createHash, randomBytes } from 'crypto';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import { SEED_ACCOUNT, ACCOUNT_1, ACCOUNT_2, ON_CHAIN_TEST_WALLET, CONTEXT } from '../resources/account';
import { EXPORT_IN_C } from '../resources/transactionData/exportInC';
import { EXPORT_IN_P } from '../resources/transactionData/exportInP';
import { IMPORT_IN_P } from '../resources/transactionData/importInP';
import { IMPORT_IN_C } from '../resources/transactionData/importInC';
import {
  MULTISIG_DELEGATION_FULLY_SIGNED_TX_HEX,
  MULTISIG_DELEGATION_PARAMS,
  MPC_DELEGATION_UNSIGNED_TX_HEX,
} from '../resources/transactionData/multisigDelegationTx';
import { HalfSignedAccountTransaction, TransactionType, MPCAlgorithm, common } from '@bitgo/sdk-core';
import { secp256k1, TypeSymbols } from '@flarenetwork/flarejs';
import { FlrpContext, FlrpFeeState } from '@bitgo/public-types';
import assert from 'assert';
import nock from 'nock';
// Wallet mock whose owner set is derived from keychain public key material,
// mirroring the SDK's keychain-based ownership derivation in verifyTransaction
// (CECHO-2716). keyMaterial selects the keychain field: 'pub' (default) or
// 'commonKeychain'. The commonKeychain form stores the REAL TSS shape — the
// 66-char compressed public key followed by a 64-char chain code (130 chars),
// as sdk-core's EcdsaUtils.getPublicKeyFromCommonKeychain expects.
function keychainWallet(privKeys: string[], keyMaterial: 'pub' | 'commonKeychain' = 'pub') {
  return {
    keyIds: () => privKeys.map((_, i) => `${i}`),
    baseCoin: {
      keychains: () => ({
        get: async ({ id }: { id: string }) => {
          const pub = new FlrpLib.KeyPair({ prv: privKeys[Number(id)] }).getKeys().pub;
          return { [keyMaterial]: keyMaterial === 'commonKeychain' ? pub + '0'.repeat(64) : pub };
        },
      }),
    },
    // Import-side verification reads wallet-anchored fields even when the recipient
    // intent is present; the mock returns no rootAddress (undefined) so the
    // recipients-only path is exercised.
    coinSpecific: () => ({}),
    receiveAddress: () => undefined,
  };
}
import { CreatePairedWalletResponse } from '../../src/lib/iface';

describe('Flrp test cases', function () {
  const coinName = 'flrp';
  const tcoinName = 't' + coinName;
  let bitgo: TestBitGoAPI;
  let basecoin;

  const keychains = [{ pub: SEED_ACCOUNT.publicKey }, { pub: ACCOUNT_1.publicKey }, { pub: ACCOUNT_2.publicKey }];

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister(coinName, Flrp.createInstance);
    bitgo.safeRegister(tcoinName, TflrP.createInstance);
    basecoin = bitgo.coin(tcoinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin(tcoinName);
    localBasecoin.should.be.an.instanceof(TflrP);

    localBasecoin = bitgo.coin(coinName);
    localBasecoin.should.be.an.instanceof(Flrp);
  });

  it('should return ' + tcoinName, function () {
    basecoin.getChain().should.equal(tcoinName);
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Flare P-Chain');
  });

  it('should return base factor', function () {
    basecoin.getBaseFactor().should.equal(1e9);
  });

  it('should return coin family', function () {
    basecoin.getFamily().should.equal('flrp');
  });

  it('should return default multisig type', function () {
    basecoin.getDefaultMultisigType().should.equal('tss');
  });

  it('should support TSS', function () {
    basecoin.supportsTss().should.equal(true);
  });

  it('should return ecdsa as MPC algorithm', function () {
    (basecoin.getMPCAlgorithm() as MPCAlgorithm).should.equal('ecdsa');
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
    });

    it('should generate a keypair from a seed', function () {
      const seed = Buffer.from(SEED_ACCOUNT.seed, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      keyPair.pub.should.equal(SEED_ACCOUNT.publicKey);
      keyPair.prv.should.equal(SEED_ACCOUNT.privateKey);
    });

    it('should validate a public key', function () {
      basecoin.isValidPub(SEED_ACCOUNT.publicKey).should.equal(true);
      basecoin.isValidPub(ACCOUNT_1.publicKey).should.equal(true);
    });

    it('should fail to validate an invalid public key', function () {
      basecoin.isValidPub('invalid').should.equal(false);
    });

    it('should validate a private key', function () {
      basecoin.isValidPrv(SEED_ACCOUNT.privateKey).should.equal(true);
      basecoin.isValidPrv(ACCOUNT_1.privateKey).should.equal(true);
    });

    it('should fail to validate an invalid private key', function () {
      basecoin.isValidPrv('invalid').should.equal(false);
    });
  });

  describe('Sign Transaction', () => {
    it('should sign an export from C-chain transaction', async () => {
      const params = {
        txPrebuild: {
          txHex: EXPORT_IN_C.unsignedHex,
        },
        prv: EXPORT_IN_C.privateKey,
      };

      const signedTx = await basecoin.signTransaction(params);
      signedTx.should.have.property('halfSigned');
      const halfSigned = (signedTx as HalfSignedAccountTransaction).halfSigned;
      assert(halfSigned, 'halfSigned should be defined');
      assert(halfSigned.txHex, 'txHex should be defined');
      halfSigned.txHex.should.equal(EXPORT_IN_C.signedHex);
    });

    it('should sign an export from P-chain transaction', async () => {
      // privateKeys[2] corresponds to the first signature slot (sorted address order: 3329be7d... is slot 1)
      const params = {
        txPrebuild: {
          txHex: EXPORT_IN_P.unsignedHex,
        },
        prv: EXPORT_IN_P.privateKeys[2],
      };

      const signedTx = await basecoin.signTransaction(params);
      signedTx.should.have.property('halfSigned');
      const halfSigned = (signedTx as HalfSignedAccountTransaction).halfSigned;
      assert(halfSigned, 'halfSigned should be defined');
      assert(halfSigned.txHex, 'txHex should be defined');
      halfSigned.txHex.should.equal(EXPORT_IN_P.halfSigntxHex);
    });

    it('should sign an import to P-chain transaction', async () => {
      // privateKeys[2] corresponds to the first signature slot (sorted address order: 3329be7d... is slot 1)
      const params = {
        txPrebuild: {
          txHex: IMPORT_IN_P.unsignedHex,
        },
        prv: IMPORT_IN_P.privateKeys[2],
      };

      const signedTx = await basecoin.signTransaction(params);
      signedTx.should.have.property('halfSigned');
      const halfSigned = (signedTx as HalfSignedAccountTransaction).halfSigned;
      assert(halfSigned, 'halfSigned should be defined');
      assert(halfSigned.txHex, 'txHex should be defined');
      halfSigned.txHex.should.equal(IMPORT_IN_P.halfSigntxHex);
    });

    it('should sign an import to C-chain transaction', async () => {
      // privateKeys[2] corresponds to the first signature slot (sorted address order in UTXOs)
      const params = {
        txPrebuild: {
          txHex: IMPORT_IN_C.unsignedHex,
        },
        prv: IMPORT_IN_C.privateKeys[2],
      };

      const signedTx = await basecoin.signTransaction(params);
      signedTx.should.have.property('halfSigned');
      const halfSigned = (signedTx as HalfSignedAccountTransaction).halfSigned;
      assert(halfSigned, 'halfSigned should be defined');
      assert(halfSigned.txHex, 'txHex should be defined');
      halfSigned.txHex.should.equal(IMPORT_IN_C.halfSigntxHex);
    });

    it('should reject signing with an invalid key', async () => {
      const params = {
        txPrebuild: {
          txHex: EXPORT_IN_C.unsignedHex,
        },
        prv: 'invalid-key',
      };

      await basecoin.signTransaction(params).should.be.rejected();
    });
  });

  describe('Sign Message', () => {
    it('should sign a message', async () => {
      const keyPair = new FlrpLib.KeyPair({ prv: SEED_ACCOUNT.privateKey });
      const keys = keyPair.getKeys();
      const messageToSign = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const signature = await basecoin.signMessage(keys, messageToSign.toString('hex'));

      signature.should.be.instanceOf(Buffer);
      signature.length.should.equal(65);
    });

    it('should sign a random message', async () => {
      const keyPair = new FlrpLib.KeyPair();
      const pubKey = keyPair.getKeys().pub;
      const keys = keyPair.getKeys();
      const messageToSign = Buffer.from(randomBytes(32));
      const signature = await basecoin.signMessage(keys, messageToSign.toString('hex'));

      const verify = FlrpLib.Utils.verifySignature(
        FlrpLib.Utils.sha256(messageToSign),
        signature.slice(0, 64), // Remove recovery byte for verification
        Buffer.from(pubKey, 'hex')
      );
      verify.should.be.true();
    });

    it('should fail to sign with missing private key', async () => {
      const keyPair = new FlrpLib.KeyPair({ pub: SEED_ACCOUNT.publicKey });
      const keys = keyPair.getKeys();
      const messageToSign = Buffer.from(SEED_ACCOUNT.message, 'utf8');

      await basecoin
        .signMessage(keys, messageToSign.toString('hex'))
        .should.be.rejectedWith('Invalid key pair options');
    });
  });

  describe('Explain Transaction', () => {
    it('should explain a half signed export from P-chain transaction', async () => {
      const txExplain = await basecoin.explainTransaction({
        halfSigned: { txHex: EXPORT_IN_P.halfSigntxHex },
      });

      txExplain.type.should.equal(TransactionType.Export);
      txExplain.fee.should.have.property('fee');
      txExplain.inputs.should.be.an.Array();
      txExplain.changeAmount.should.equal('14339520'); // 0xDACDC0 from transaction
      txExplain.changeOutputs.should.be.an.Array();
      txExplain.changeOutputs[0].address.should.equal(
        'P-costwo106gc5h5qswhye8e0pmthq4wzf0ekv5qppsrvpu~P-costwo1cueygd7fd37g56s49k3rshqakhp6k8u3adzt6m~P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut'
      );
    });

    it('should explain a signed export from P-chain transaction', async () => {
      const txExplain = await basecoin.explainTransaction({ txHex: EXPORT_IN_P.fullSigntxHex });

      txExplain.type.should.equal(TransactionType.Export);
      txExplain.id.should.equal(EXPORT_IN_P.txhash);
      txExplain.fee.should.have.property('fee');
      txExplain.inputs.should.be.an.Array();
      txExplain.changeAmount.should.equal('14339520'); // 0xDACDC0 from transaction
      txExplain.changeOutputs.should.be.an.Array();
      txExplain.changeOutputs[0].address.should.equal(
        'P-costwo106gc5h5qswhye8e0pmthq4wzf0ekv5qppsrvpu~P-costwo1cueygd7fd37g56s49k3rshqakhp6k8u3adzt6m~P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut'
      );
    });

    it('should explain a half signed import to P-chain transaction', async () => {
      const txExplain = await basecoin.explainTransaction({
        halfSigned: { txHex: IMPORT_IN_P.halfSigntxHex },
      });

      txExplain.type.should.equal(TransactionType.Import);
      txExplain.fee.should.have.property('fee');
      txExplain.inputs.should.be.an.Array();
      txExplain.outputAmount.should.equal('48739000');
      txExplain.outputs.should.be.an.Array();
      txExplain.outputs.length.should.equal(1);
      txExplain.changeOutputs.should.be.empty();
    });

    it('should explain a signed import to P-chain transaction', async () => {
      const txExplain = await basecoin.explainTransaction({ txHex: IMPORT_IN_P.signedHex });

      txExplain.type.should.equal(TransactionType.Import);
      txExplain.id.should.equal(IMPORT_IN_P.txhash);
      txExplain.fee.should.have.property('fee');
      txExplain.inputs.should.be.an.Array();
      txExplain.outputAmount.should.equal('48739000');
      txExplain.outputs.should.be.an.Array();
      txExplain.outputs.length.should.equal(1);
      txExplain.changeOutputs.should.be.empty();
    });

    it('should explain a signed export from C-chain transaction and include recipient P-chain address', async () => {
      const txExplain = await basecoin.explainTransaction({ txHex: EXPORT_IN_C.signedHex });

      txExplain.type.should.equal(TransactionType.Export);
      txExplain.outputs.should.be.an.Array();
      txExplain.outputs.length.should.equal(1);
      // The recipient address must be the P-chain destination — not empty.
      txExplain.outputs[0].address.should.be.a.String();
      txExplain.outputs[0].address.should.not.be.empty();
      txExplain.outputs[0].address.should.startWith('P-');
      txExplain.changeOutputs.should.be.empty();
    });

    it('should subtract minImportToPFee from ExportInC outputAmount to show expected net P-chain receipt', async () => {
      // The ExportInC UTXO amount is the gross amount going to P-chain. The actual P-chain
      // credit will be UTXO - importFee. We subtract minImportToPFee to show the minimum
      // net amount the user will receive on P-chain, preventing the pending display from
      // showing an inflated amount compared to the confirmed P-chain balance.
      const minImportToPFee = BigInt('1261000'); // from FlarePTestnet.minImportToPFee
      const expectedAdjustedAmount = (BigInt(EXPORT_IN_C.amount) - minImportToPFee).toString();

      // Should work for both unsigned (pending) and signed ExportInC hex
      const unsignedExplain = await basecoin.explainTransaction({ txHex: EXPORT_IN_C.unsignedHex });
      unsignedExplain.outputAmount.should.equal(expectedAdjustedAmount);
      unsignedExplain.outputs[0].amount.should.equal(expectedAdjustedAmount);

      const signedExplain = await basecoin.explainTransaction({ txHex: EXPORT_IN_C.signedHex });
      signedExplain.outputAmount.should.equal(expectedAdjustedAmount);
      signedExplain.outputs[0].amount.should.equal(expectedAdjustedAmount);
    });

    it('should fail when transaction hex is not provided', async () => {
      await basecoin.explainTransaction({}).should.be.rejectedWith('missing transaction hex');
    });

    it('should fail for invalid transaction hex', async () => {
      await basecoin.explainTransaction({ txHex: 'invalid' }).should.be.rejected();
    });
  });

  describe('Verify Transaction', () => {
    it('should verify an export from C-chain transaction', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_C.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_C.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isVerified.should.equal(true);
    });

    it('should verify an export when txParams.type is the lowercase "export" intent alias', async () => {
      // WP issues lowercase intentTypes; TransactionType['export'] is undefined, so the
      // alias must normalize to 'Export' or the type gate rejects every such export.
      const txPrebuild = {
        txHex: EXPORT_IN_C.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_C.amount,
          },
        ],
        type: 'export',
        locktime: 0,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isVerified.should.equal(true);
    });

    it('should verify an export from P-chain transaction', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_P.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_P.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };
      const wallet = keychainWallet(EXPORT_IN_P.privateKeys);

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isVerified.should.equal(true);
    });

    it('should verify an import to C-chain transaction', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_C.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: IMPORT_IN_C.to,
            amount: '1',
          },
        ],
        type: 'ImportToC',
        locktime: 0,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isVerified.should.equal(true);
    });

    it('should verify an import to P-chain transaction', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_P.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [{ address: IMPORT_IN_P.pAddresses.join('~'), amount: IMPORT_IN_P.amount }],
        type: 'Import',
        locktime: 0,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isVerified.should.equal(true);
    });

    it('should fail to verify export transaction with wrong amount', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_C.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: '999999999999',
          },
        ],
        type: 'Export',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith(/Tx total amount .* does not match with expected total amount/);
    });

    it('should fail to verify transaction with wrong type', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_C.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_C.amount,
          },
        ],
        type: 'Import',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith('Tx type does not match with expected txParams type');
    });

    it('should fail to verify transaction without txHex', async () => {
      const txPrebuild = {
        txInfo: {},
      };
      const txParams = {
        recipients: [],
        type: 'Export',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith('missing required tx prebuild property txHex');
    });

    it('should fail to verify transaction with invalid txHex', async () => {
      const txPrebuild = {
        txHex: 'invalidhex',
        txInfo: {},
      };
      const txParams = {
        recipients: [],
        type: 'Export',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith('Invalid transaction: Raw transaction is not hex string');
    });

    it('should fail to verify import to C-chain without recipients', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_C.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [],
        type: 'ImportToC',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith('Expected 1 recipient in import transaction');
    });

    it('should reject a P-to-C export whose exported output pays a foreign owner set (CECHO-2716)', async () => {
      // Amount and shape match, but the exporting wallet's keychains (the trust
      // anchor, derived client-side) do not own the fixture tx's outputs — exactly
      // what a malicious prebuild paying an attacker looks like.
      const txPrebuild = {
        txHex: EXPORT_IN_P.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_P.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };
      const wallet = keychainWallet([ON_CHAIN_TEST_WALLET.user.privateKey]);

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet })
        .should.be.rejectedWith(/Export output pays non-wallet address/);
    });

    it('should reject a P-to-C export whose change output pays an attacker (CECHO-2716)', () => {
      // The SDK builder computes change back to the wallet; a malicious prebuild can
      // redirect it. Unit-test the owner binding directly with a crafted explanation.
      const walletAnchor = EXPORT_IN_P.pAddresses.join('~');
      const anchorOwners = new Set(
        walletAnchor
          .split('~')
          .map((a) => a.toLowerCase())
          .sort()
      );
      const attackerChange = ON_CHAIN_TEST_WALLET.user.pChainAddress;

      assert.throws(
        () => basecoin.requireWalletOwnedAddresses('Export change output', attackerChange, anchorOwners),
        /Export change output pays non-wallet address/
      );
    });

    it('should reject a P-to-C export with a mixed owner set (one wallet address, one attacker address)', () => {
      // Subset containment must catch a single foreign owner hidden inside a
      // wallet-majority owner set, not just fully-foreign destinations.
      const walletAnchor = EXPORT_IN_P.pAddresses.join('~');
      const anchorOwners = new Set(
        walletAnchor
          .split('~')
          .map((a) => a.toLowerCase())
          .sort()
      );
      const mixedOwnerSet = `${EXPORT_IN_P.pAddresses[0]}~${ON_CHAIN_TEST_WALLET.user.pChainAddress}`;

      assert.throws(
        () => basecoin.requireWalletOwnedAddresses('Export output', mixedOwnerSet, anchorOwners),
        /Export output pays non-wallet address/
      );
    });

    it('should fail closed on a P-to-C export with no wallet anchor', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_P.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_P.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith(
          'Unable to verify P-chain export: could not derive the wallet owner set from keychains'
        );
    });

    it('should verify a P-to-C export anchored on keychains that carry only commonKeychain (TSS shape)', async () => {
      // TSS/MPC keychains carry the joint public key in commonKeychain and may not
      // populate pub — the derivation must accept both fields.
      const txPrebuild = {
        txHex: EXPORT_IN_P.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_P.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };
      const wallet = keychainWallet(EXPORT_IN_P.privateKeys, 'commonKeychain');

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isVerified.should.equal(true);
    });

    it('should fail closed when a commonKeychain is not the real TSS shape (not 130 hex chars)', async () => {
      // A bare 66-char public key stored in commonKeychain is not the real shape
      // (33-byte compressed pubkey + 32-byte chain code); the extraction must throw
      // rather than feed the field to KeyPair as-is.
      const txPrebuild = {
        txHex: EXPORT_IN_P.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_P.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };
      const pub = new FlrpLib.KeyPair({ prv: ON_CHAIN_TEST_WALLET.user.privateKey }).getKeys().pub;
      const wallet = {
        keyIds: () => ['0'],
        baseCoin: {
          keychains: () => ({
            get: async () => ({ commonKeychain: pub }),
          }),
        },
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet })
        .should.be.rejectedWith(/Invalid commonKeychain length, expected 130/);
    });

    it('should fail closed when keychains carry neither pub nor commonKeychain', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_P.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_P.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };
      const wallet = {
        keyIds: () => ['0'],
        baseCoin: {
          keychains: () => ({
            get: async () => ({ ethAddress: '0xirrelevant' }),
          }),
        },
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet })
        .should.be.rejectedWith(
          'Unable to verify P-chain export: could not derive the wallet owner set from keychains'
        );
    });

    it('should fail closed when a keychain fetch rejects', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_P.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_P.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };
      const wallet = {
        keyIds: () => ['0'],
        baseCoin: {
          keychains: () => ({
            get: async () => {
              throw new Error('keychain not found');
            },
          }),
        },
      };

      await basecoin.verifyTransaction({ txParams, txPrebuild, wallet }).should.be.rejectedWith('keychain not found');
    });

    it('should reject a P-to-C export that burns more than the complexity-scaled fee bound', async () => {
      // inputs 60M, exported 30M, change 0.5M — 29.5M burned exceeds the ceiling
      // (flat 10M maxImportFee + the fixture tx's ~9.1k gas at price 1000 ≈ 19.1M).
      // Gas is computed from the real fixture tx parsed below.
      const factory = new FlrpLib.TransactionBuilderFactory(coins.get('tflrp'));
      const tx = await factory.from(EXPORT_IN_P.fullSigntxHex).build();
      const maliciousExplanation = {
        inputs: [{ address: '', value: '60000000' }],
        outputs: [{ address: EXPORT_IN_P.pAddresses.join('~'), amount: '30000000' }],
        changeOutputs: [{ address: EXPORT_IN_P.pAddresses.join('~'), amount: '500000' }],
      };

      assert.throws(
        () => basecoin.validateExportFee(maliciousExplanation, tx),
        /Export burns .* exceeding the complexity-scaled fee bound/
      );
    });

    it('should accept a P-to-C export whose burned fee is within the complexity-scaled fee bound', async () => {
      // Fixture shape: inputs 50M, exported 30M, change 18.69M — ~1.31M burned,
      // well under the flat 10M floor alone.
      const factory = new FlrpLib.TransactionBuilderFactory(coins.get('tflrp'));
      const tx = await factory.from(EXPORT_IN_P.fullSigntxHex).build();
      const explanation = {
        inputs: [{ address: '', value: '50000000' }],
        outputs: [{ address: EXPORT_IN_P.pAddresses.join('~'), amount: '30000000' }],
        changeOutputs: [{ address: EXPORT_IN_P.pAddresses.join('~'), amount: '18691035' }],
      };

      assert.doesNotThrow(() => basecoin.validateExportFee(explanation, tx));
    });

    it('should accept a many-input export whose dynamic fee exceeds the flat maxImportFee', async () => {
      // Models a 10-input consolidation export: the P-chain dynamic fee grows
      // linearly with input count (~1M nFLR per 2-of-3 input at price 251), so
      // 10 inputs legitimately burn ~11M — above the flat 10M cap but within the
      // complexity-scaled ceiling. Without the gas-scaled bound this false-rejects.
      const factory = new FlrpLib.TransactionBuilderFactory(coins.get('tflrp'));
      const tx = await factory.from(EXPORT_IN_P.fullSigntxHex).build();
      const explanation = {
        inputs: Array.from({ length: 10 }, () => ({ address: '', value: '5000000' })),
        outputs: [{ address: EXPORT_IN_P.pAddresses.join('~'), amount: '30000000' }],
        changeOutputs: [{ address: EXPORT_IN_P.pAddresses.join('~'), amount: '9000000' }],
      };

      assert.doesNotThrow(() => basecoin.validateExportFee(explanation, tx));
    });

    it('should verify a P-to-C export whose outputs and change are wallet-owned', async () => {
      // The fixture export pays the wallet owner set for both the exported output and
      // the P-chain change; subset containment against the wallet anchor holds.
      const txPrebuild = {
        txHex: EXPORT_IN_P.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_P.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };
      const wallet = keychainWallet(EXPORT_IN_P.privateKeys);

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isVerified.should.equal(true);
    });

    it('should reject a P-to-C export when a second exported output is attacker-owned (CECHO-2716)', async () => {
      // Before the fix only outputs[0] was checked; a two-output prebuild with a
      // wallet-owned first output and an attacker-owned second output would have passed.
      // The fix loops over all explainedTx.outputs so the second foreign output is caught.
      const factory = new FlrpLib.TransactionBuilderFactory(coins.get('tflrp'));
      const tx = await factory.from(EXPORT_IN_P.fullSigntxHex).build();
      const realExplanation = tx.explainTransaction();
      const walletAddr = EXPORT_IN_P.pAddresses.join('~');
      const attackerAddr = ON_CHAIN_TEST_WALLET.user.pChainAddress;

      // Patch in a second output that is attacker-owned; keep outputAmount and
      // changeOutputs from the real explanation so the amount window and fee checks
      // do not interfere with the ownership-binding assertion.
      const twoOutputExplainedTx = {
        ...realExplanation,
        outputs: [
          { address: walletAddr, amount: '30000000' },
          { address: attackerAddr, amount: '5000000' },
        ],
      };

      const wallet = keychainWallet(EXPORT_IN_P.privateKeys);
      const recipients = [{ address: '', amount: EXPORT_IN_P.amount }];

      await basecoin
        .validateExportTx(
          recipients,
          twoOutputExplainedTx as FlrpLib.TransactionExplanation,
          tx as FlrpLib.Transaction,
          {
            txParams: { type: 'Export', recipients },
            wallet,
          } as any
        )
        .should.be.rejectedWith(/Export output pays non-wallet address/);
    });

    it('should bind a C-to-P export to the named recipient destination (CECHO-2716)', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_C.signedHex,
        txInfo: {},
      };
      const destination =
        'P-costwo1zt9n96hey4fsvnde35n3k4kt5pu7c784dzewzd~P-costwo1cwrdtrgf4xh80ncu7palrjw7gn4mpj0n4dxghh~P-costwo15msvr27szvhhpmah0c38gcml7vm29xjh7tcek8';
      const txParams = {
        recipients: [
          {
            address: destination,
            amount: EXPORT_IN_C.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isVerified.should.equal(true);
    });

    it('should reject a C-to-P export whose destination differs from the named recipient', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_C.signedHex,
        txInfo: {},
      };
      const attackerDestination = 'P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut';
      const txParams = {
        recipients: [
          {
            address: attackerDestination,
            amount: EXPORT_IN_C.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith(/Export destination .* does not match the expected recipient/);
    });

    it('should reject a C-to-P export when a second output destination differs from the recipient (CECHO-2716)', async () => {
      // Before the fix only outputs[0] was compared against the named recipient;
      // a second output paying an attacker would have passed. The fix loops over all.
      const factory = new FlrpLib.TransactionBuilderFactory(coins.get('tflrp'));
      const tx = await factory.from(EXPORT_IN_C.signedHex).build();
      const realExplanation = tx.explainTransaction();
      const destination =
        'P-costwo1zt9n96hey4fsvnde35n3k4kt5pu7c784dzewzd~P-costwo1cwrdtrgf4xh80ncu7palrjw7gn4mpj0n4dxghh~P-costwo15msvr27szvhhpmah0c38gcml7vm29xjh7tcek8';
      const attackerAddr = ON_CHAIN_TEST_WALLET.user.pChainAddress;

      // outputs[0] matches the recipient; outputs[1] does not.
      const twoOutputExplainedTx = {
        ...realExplanation,
        outputs: [
          { address: destination, amount: realExplanation.outputs[0].amount },
          { address: attackerAddr, amount: '1000' },
        ],
      };

      const recipients = [{ address: destination, amount: EXPORT_IN_C.amount }];

      await basecoin
        .validateExportTx(
          recipients,
          twoOutputExplainedTx as FlrpLib.TransactionExplanation,
          tx as FlrpLib.Transaction,
          {
            txParams: { type: 'Export', recipients },
          } as any
        )
        .should.be.rejectedWith(/Export destination .* does not match the expected recipient/);
    });

    it('should fail to verify import to C-chain with an attacker destination (CECHO-2717)', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_C.fullSigntxHex,
        txInfo: {},
      };
      const attackerAddress = '0x0000000000000000000000000000000000000001';
      const txParams = {
        recipients: [
          {
            address: attackerAddress,
            amount: '1',
          },
        ],
        type: 'ImportToC',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith(/Import destination .* does not match the expected recipient/);
    });

    it('should verify import to C-chain with a lowercase recipient address (case-insensitive compare)', async () => {
      // checksummed vs lowercase forms must compare equal
      const txPrebuild = {
        txHex: IMPORT_IN_C.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: IMPORT_IN_C.to.toLowerCase(),
            amount: '1',
          },
        ],
        type: 'ImportToC',
        locktime: 0,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isVerified.should.equal(true);
    });

    it('should fail to verify import to P-chain with an attacker owner set (CECHO-2717)', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_P.signedHex,
        txInfo: {},
      };
      const attackerAddress = 'P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut';
      const txParams = {
        recipients: [{ address: attackerAddress, amount: IMPORT_IN_P.amount }],
        type: 'Import',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith(/Import destination .* does not match the expected wallet destination/);
    });

    it('should verify import to P-chain against the wallet rootAddress when no recipients are given', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_P.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [],
        type: 'Import',
        locktime: 0,
      };
      const wallet = {
        coinSpecific: () => ({ rootAddress: IMPORT_IN_P.pAddresses.join('~') }),
        receiveAddress: () => undefined,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isVerified.should.equal(true);
    });

    it('should fail to verify import to P-chain when the wallet rootAddress does not match the output', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_P.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [],
        type: 'Import',
        locktime: 0,
      };
      const wallet = {
        coinSpecific: () => ({ rootAddress: ON_CHAIN_TEST_WALLET.user.pChainAddress }),
        receiveAddress: () => undefined,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet })
        .should.be.rejectedWith(/Import destination .* does not match the expected wallet destination/);
    });

    it('should fail closed when import to P-chain has no destination intent at all', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_P.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [],
        type: 'Import',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith(
          'Unable to verify import destination: no expected address provided in txParams.recipients or wallet rootAddress'
        );
    });

    it('should enforce the type gate for ImportToC instead of skipping it', async () => {
      // Previously 'ImportToC' was exempt from the type-match gate, so a prebuild of
      // any other type (here an Export) slipped past the gate when the caller asked
      // for an import. It must now throw.
      const txPrebuild = {
        txHex: EXPORT_IN_C.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: EXPORT_IN_C.amount,
          },
        ],
        type: 'ImportToC',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith('Tx type does not match with expected txParams type');
    });

    it('should accept the lowercase importtoc intent alias for import transactions', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_C.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: IMPORT_IN_C.to,
            amount: '1',
          },
        ],
        type: 'importtoc',
        locktime: 0,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isVerified.should.equal(true);
    });

    it('should throw a clean error when the import-to-C recipient address is empty', async () => {
      // Runtime guard: a missing/empty expected address must fail with a clear
      // validation error, not a TypeError from calling toLowerCase on undefined.
      const txPrebuild = {
        txHex: IMPORT_IN_C.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: '',
            amount: '1',
          },
        ],
        type: 'ImportToC',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith('Invalid expected C-chain import recipient: ');
    });

    it('should throw a clean error when the import-to-C recipient address is undefined', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_C.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [{ amount: '1' }] as unknown as { address: string; amount: string }[],
        type: 'ImportToC',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith('Invalid expected C-chain import recipient: undefined');
    });

    it('should reject import to P-chain when recipients conflict with the wallet rootAddress', async () => {
      // Both intent sources present but disagreeing must fail closed rather than
      // silently preferring one.
      const txPrebuild = {
        txHex: IMPORT_IN_P.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: IMPORT_IN_P.amount }],
        type: 'Import',
        locktime: 0,
      };
      const wallet = {
        coinSpecific: () => ({ rootAddress: IMPORT_IN_P.pAddresses.join('~') }),
        receiveAddress: () => undefined,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet })
        .should.be.rejectedWith(/Import destination intent conflict/);
    });

    it('should verify import to P-chain when recipients and wallet rootAddress agree', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_P.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [{ address: IMPORT_IN_P.pAddresses.join('~'), amount: IMPORT_IN_P.amount }],
        type: 'Import',
        locktime: 0,
      };
      const wallet = {
        coinSpecific: () => ({ rootAddress: IMPORT_IN_P.pAddresses.slice().reverse().join('~') }),
        receiveAddress: () => undefined,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isVerified.should.equal(true);
    });

    it('should verify an export when the recipient carries the matching destination', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_C.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address:
              'P-costwo1zt9n96hey4fsvnde35n3k4kt5pu7c784dzewzd~P-costwo1cwrdtrgf4xh80ncu7palrjw7gn4mpj0n4dxghh~P-costwo15msvr27szvhhpmah0c38gcml7vm29xjh7tcek8',
            amount: EXPORT_IN_C.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
      isVerified.should.equal(true);
    });

    it('should reject an export whose destination differs from the supplied recipient', async () => {
      const txPrebuild = {
        txHex: EXPORT_IN_C.signedHex,
        txInfo: {},
      };
      const attackerAddress = 'P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut';
      const txParams = {
        recipients: [
          {
            address: attackerAddress,
            amount: EXPORT_IN_C.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };

      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.be.rejectedWith(/Export destination .* does not match the expected recipient/);
    });

    it('should verify a P-to-C export whose recipient carries the C-chain destination (not comparable to the P-form output)', async () => {
      // P→C exports pay the wallet's own addresses; a caller-supplied C-chain
      // destination recipient must not be bound against the P-form output owner set.
      const txPrebuild = {
        txHex: EXPORT_IN_P.fullSigntxHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: EXPORT_IN_C.cHexAddress,
            amount: EXPORT_IN_P.amount,
          },
        ],
        type: 'Export',
        locktime: 0,
      };
      const wallet = keychainWallet(EXPORT_IN_P.privateKeys);

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isVerified.should.equal(true);
    });

    it('should verify import to P-chain via wallet receiveAddress when rootAddress is absent', async () => {
      const txPrebuild = {
        txHex: IMPORT_IN_P.signedHex,
        txInfo: {},
      };
      const txParams = {
        recipients: [],
        type: 'Import',
        locktime: 0,
      };
      const wallet = {
        coinSpecific: () => ({}),
        receiveAddress: () => IMPORT_IN_P.pAddresses.join('~'),
      };

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isVerified.should.equal(true);
    });

    it('should reject an import whose burned fee exceeds maxImportFee', () => {
      // inputs 20M, output 5M — 15M burned exceeds the network maxImportFee of 10M.
      // Real explanations map outputs to { address, amount }, inputs carry value.
      const maliciousExplanation = {
        inputs: [
          { address: '', value: '10000000' },
          { address: '', value: '10000000' },
        ],
        outputs: [{ address: IMPORT_IN_P.pAddresses.join('~'), amount: '5000000' }],
      };

      assert.throws(
        () => basecoin.validateImportFee(maliciousExplanation),
        /Import burns .* exceeding the network maxImportFee/
      );
    });

    it('should accept an import whose burned fee is within maxImportFee', () => {
      const explanation = {
        inputs: [{ address: '', value: '50000000' }],
        outputs: [{ address: IMPORT_IN_P.pAddresses.join('~'), amount: '48739000' }],
      };

      assert.doesNotThrow(() => basecoin.validateImportFee(explanation));
    });

    it('should fail closed when import output entries lack the amount field', () => {
      const malformedExplanation = {
        inputs: [{ address: '', value: '50000000' }],
        outputs: [{ address: IMPORT_IN_P.pAddresses.join('~') }],
      };

      assert.throws(() => basecoin.validateImportFee(malformedExplanation), /not finite numbers/);
    });
  });

  describe('Address Validation', () => {
    it('should validate mainnet P-chain address', function () {
      basecoin.isValidAddress(SEED_ACCOUNT.addressMainnet).should.be.true();
    });

    it('should validate testnet P-chain address', function () {
      basecoin.isValidAddress(SEED_ACCOUNT.addressTestnet).should.be.true();
    });

    it('should validate array of P-chain addresses', function () {
      basecoin.isValidAddress(EXPORT_IN_C.pAddresses).should.be.true();
    });

    it('should validate tilde-separated multisig address', function () {
      const multiSigAddress = EXPORT_IN_C.pAddresses.join('~');
      basecoin.isValidAddress(multiSigAddress).should.be.true();
    });

    it('should validate C-chain hex address', function () {
      basecoin.isValidAddress(EXPORT_IN_C.cHexAddress).should.be.true();
    });

    it('should validate lowercase C-chain address', function () {
      basecoin.isValidAddress(IMPORT_IN_C.to.toLowerCase()).should.be.true();
    });

    it('should fail to validate undefined address', function () {
      basecoin.isValidAddress(undefined).should.be.false();
    });

    it('should fail to validate empty string', function () {
      basecoin.isValidAddress('').should.be.false();
    });

    it('should fail to validate invalid address', function () {
      basecoin.isValidAddress('invalid-address').should.be.false();
    });

    it('should fail to validate array with invalid address', function () {
      basecoin.isValidAddress([...EXPORT_IN_C.pAddresses, 'invalid']).should.be.false();
    });
  });

  describe('Wallet Address Verification', () => {
    it('should verify wallet address with matching keychains', async () => {
      const keyPairs = [{ pub: SEED_ACCOUNT.publicKey }, { pub: ACCOUNT_1.publicKey }, { pub: ACCOUNT_2.publicKey }];

      // Derive addresses from public keys to ensure they match
      const derivedAddresses = keyPairs.map((kp) => new FlrpLib.KeyPair({ pub: kp.pub }).getAddress('testnet'));
      const address = derivedAddresses.join('~');

      const isValid = await basecoin.isWalletAddress({
        address,
        keychains: keyPairs,
      });

      isValid.should.be.true();
    });

    it('should verify MPC wallet address with single keychain', async () => {
      const address = SEED_ACCOUNT.addressTestnet;

      const isValid = await basecoin.isWalletAddress({
        address,
        keychains: [{ pub: SEED_ACCOUNT.publicKey }],
      });

      isValid.should.be.true();
    });

    it('should reject MPC wallet address that does not match keychain', async () => {
      const address = SEED_ACCOUNT.addressTestnet;

      await assert.rejects(
        async () =>
          basecoin.isWalletAddress({
            address,
            keychains: [{ pub: ACCOUNT_1.publicKey }],
          }),
        /address validation failure/
      );
    });

    it('should throw for multisig address with wrong number of keychains', async () => {
      // Two tilde-separated addresses but only 2 keychains
      const address = SEED_ACCOUNT.addressTestnet + '~' + ACCOUNT_1.addressTestnet;

      await assert.rejects(
        async () =>
          basecoin.isWalletAddress({
            address,
            keychains: [{ pub: SEED_ACCOUNT.publicKey }, { pub: ACCOUNT_1.publicKey }],
          }),
        /Invalid keychains/
      );
    });

    it('should throw for invalid address', async () => {
      await assert.rejects(
        async () =>
          basecoin.isWalletAddress({
            address: 'invalid',
            keychains,
          }),
        /invalid address/
      );
    });

    it('should throw when address length does not match keychain length', async () => {
      const address = SEED_ACCOUNT.addressTestnet;

      await assert.rejects(async () =>
        basecoin.isWalletAddress({
          address,
          keychains,
        })
      );
    });

    it('should throw when addresses do not match keychains', async () => {
      // Use addresses that don't match the keychains
      const address = EXPORT_IN_C.pAddresses.join('~');

      await assert.rejects(async () =>
        basecoin.isWalletAddress({
          address,
          keychains,
        })
      );
    });
  });

  describe('Recovery Signature', () => {
    it('should recover signature from signed message', async () => {
      const message = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(SEED_ACCOUNT.privateKey, 'hex');
      const signature = FlrpLib.Utils.createSignature(basecoin._staticsCoin.network, message, privateKey);
      const messageHash = FlrpLib.Utils.sha256(message);
      const recoveredPubKey = basecoin.recoverySignature(messageHash, signature);

      recoveredPubKey.should.be.instanceOf(Buffer);
      recoveredPubKey.length.should.equal(33);
    });
  });

  describe('Delegation Transaction Validation', () => {
    describe('validateDelegationTx', () => {
      const validStakingOptions = {
        nodeID: 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL',
        amount: '50000000000000', // 50,000 FLR in nFLR
        durationSeconds: 86400 * 14, // 14 days
        rewardAddress: 'C-costwo1uyp5n76gjqltrddur7qlrsmt3kyh8fnrmwhqk7',
      };

      const validExplainedTx = {
        outputAmount: '50000000000000',
        type: TransactionType.AddPermissionlessDelegator,
        inputs: [],
        outputs: [{ address: validStakingOptions.nodeID, value: '0' }],
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: '1000' },
      };

      it('should validate a correct delegation transaction', () => {
        const txParams = { stakingOptions: validStakingOptions };
        assert.doesNotThrow(() => basecoin.validateDelegationTx(txParams, validExplainedTx));
      });

      it('should throw when stakingOptions is missing', () => {
        const txParams = {};
        assert.throws(
          () => basecoin.validateDelegationTx(txParams, validExplainedTx),
          /Delegation transaction requires stakingOptions/
        );
      });

      it('should throw when nodeID has invalid format', () => {
        const txParams = {
          stakingOptions: {
            ...validStakingOptions,
            nodeID: 'InvalidPrefix-123',
          },
        };
        assert.throws(() => basecoin.validateDelegationTx(txParams, validExplainedTx), /Invalid nodeID format/);
      });

      it('should throw when amount is missing', () => {
        const txParams = {
          stakingOptions: {
            ...validStakingOptions,
            amount: undefined,
          },
        };
        assert.throws(
          () => basecoin.validateDelegationTx(txParams, validExplainedTx),
          /Delegation transaction requires amount/
        );
      });

      it('should throw when durationSeconds is missing', () => {
        const txParams = {
          stakingOptions: {
            ...validStakingOptions,
            durationSeconds: undefined,
          },
        };
        assert.throws(
          () => basecoin.validateDelegationTx(txParams, validExplainedTx),
          /Delegation transaction requires durationSeconds/
        );
      });

      it('should fail closed when the delegation transaction exposes no stake outputs', () => {
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [],
              getDelegatorRewardsOwner: () => ({ addrs: [] }),
            }),
          }),
        };
        const params = { txParams: { stakingOptions: validStakingOptions } };

        assert.throws(() => basecoin.validateDelegationOwners(delegationTx, params), /exposes no stake outputs/);
      });

      it('should reject a delegation whose rewards owner differs from stakingOptions.rewardAddress', () => {
        const attackerOwnerBytes = Buffer.alloc(20, 2);
        const walletOwnerBytes = utils.parseAddress(ON_CHAIN_TEST_WALLET.user.pChainAddress);
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [{ output: { getOwners: () => [walletOwnerBytes], getThreshold: () => 1 } }],
              baseTx: { outputs: [] },
              getDelegatorRewardsOwner: () => ({ addrs: [{ toBytes: () => attackerOwnerBytes }] }),
            }),
          }),
        };
        const params = {
          txParams: { stakingOptions: validStakingOptions },
          wallet: {
            coinSpecific: () => ({ rootAddress: ON_CHAIN_TEST_WALLET.user.pChainAddress }),
            receiveAddress: () => undefined,
          },
        };

        assert.throws(
          () => basecoin.validateDelegationOwners(delegationTx, params),
          /does not match the requested rewardAddress/
        );
      });

      it('should reject a delegation whose stake owner is outside the wallet anchor', () => {
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [{ output: { getOwners: () => [Buffer.alloc(20, 1)], getThreshold: () => 1 } }],
              baseTx: { outputs: [] },
              getDelegatorRewardsOwner: () => ({ addrs: [{ toBytes: () => Buffer.alloc(20, 3) }] }),
            }),
          }),
        };

        const params = {
          txParams: { stakingOptions: validStakingOptions },
          wallet: {
            coinSpecific: () => ({ rootAddress: ON_CHAIN_TEST_WALLET.user.pChainAddress }),
            receiveAddress: () => undefined,
          },
        };

        assert.throws(
          () => basecoin.validateDelegationOwners(delegationTx, params),
          /is not one of the wallet's own addresses/
        );
      });

      it('should run wallet-anchored ownership checks in the MPC staking flow even without stakingOptions (CECHO-2715)', () => {
        // The no-intent path must still reject a delegation whose stake owner is not
        // one of the wallet's addresses — previously this shape verified unconditionally.
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [{ output: { getOwners: () => [Buffer.alloc(20, 1)], getThreshold: () => 1 } }],
              baseTx: { outputs: [] },
            }),
          }),
        };

        assert.throws(
          () => basecoin.validateDelegationWalletOwnership(delegationTx, ON_CHAIN_TEST_WALLET.user.pChainAddress),
          /Delegation stake output 0 owner .* is not one of the wallet's own addresses/
        );
      });

      it('should bind every stake output, not just the first', () => {
        // A malicious prebuild can put a wallet-owned stake output first and an
        // attacker-owned one after it — every stake output must be wallet-owned.
        const walletOwnerBytes = utils.parseAddress(ON_CHAIN_TEST_WALLET.user.pChainAddress);
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [
                { output: { getOwners: () => [walletOwnerBytes], getThreshold: () => 1 } },
                { output: { getOwners: () => [Buffer.alloc(20, 1)], getThreshold: () => 1 } },
              ],
              baseTx: { outputs: [] },
            }),
          }),
        };

        assert.throws(
          () => basecoin.validateDelegationWalletOwnership(delegationTx, ON_CHAIN_TEST_WALLET.user.pChainAddress),
          /Delegation stake output 1 owner .* is not one of the wallet's own addresses/
        );
      });

      it('should fail closed in the MPC staking flow when no wallet anchor is available (CECHO-2715)', () => {
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [{ output: { getOwners: () => [Buffer.alloc(20, 1)], getThreshold: () => 1 } }],
              baseTx: { outputs: [] },
            }),
          }),
        };

        assert.throws(
          () => basecoin.validateDelegationWalletOwnership(delegationTx, undefined),
          /Unable to verify delegation: no wallet address available/
        );
      });

      it('should reject a delegation whose change output pays an attacker even without stakingOptions (CECHO-2715)', () => {
        const walletOwnerBytes = utils.parseAddress(ON_CHAIN_TEST_WALLET.user.pChainAddress);
        const attackerChangeBytes = utils.parseAddress(ON_CHAIN_TEST_WALLET.bitgo.pChainAddress);
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [{ output: { getOwners: () => [walletOwnerBytes], getThreshold: () => 1 } }],
              baseTx: {
                outputs: [
                  {
                    _type: TypeSymbols.TransferableOutput,
                    amount: () => 1000n,
                    output: { getOwners: () => [attackerChangeBytes], getLocktime: () => 0n, getThreshold: () => 1 },
                  },
                ],
              },
            }),
          }),
        };

        assert.throws(
          () => basecoin.validateDelegationWalletOwnership(delegationTx, ON_CHAIN_TEST_WALLET.user.pChainAddress),
          /Delegation change output 0 owner set .* does not match the wallet's full owner set/
        );
      });

      it('should reject a delegation whose change output has a future locktime', () => {
        const walletOwnerBytes = utils.parseAddress(ON_CHAIN_TEST_WALLET.user.pChainAddress);
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [{ output: { getOwners: () => [walletOwnerBytes], getThreshold: () => 1 } }],
              baseTx: {
                outputs: [
                  {
                    _type: TypeSymbols.TransferableOutput,
                    amount: () => 1000n,
                    output: { getOwners: () => [walletOwnerBytes], getLocktime: () => 3600n, getThreshold: () => 1 },
                  },
                ],
              },
            }),
          }),
        };

        assert.throws(
          () => basecoin.validateDelegationWalletOwnership(delegationTx, ON_CHAIN_TEST_WALLET.user.pChainAddress),
          /Delegation change output 0 locktime 3600 must be 0/
        );
      });

      it('should reject a delegation whose change output threshold is structurally invalid', () => {
        const walletOwnerBytes = utils.parseAddress(ON_CHAIN_TEST_WALLET.user.pChainAddress);
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [{ output: { getOwners: () => [walletOwnerBytes], getThreshold: () => 1 } }],
              baseTx: {
                outputs: [
                  {
                    _type: TypeSymbols.TransferableOutput,
                    amount: () => 1000n,
                    output: { getOwners: () => [walletOwnerBytes], getLocktime: () => 0n, getThreshold: () => 2 },
                  },
                ],
              },
            }),
          }),
        };

        assert.throws(
          () => basecoin.validateDelegationWalletOwnership(delegationTx, ON_CHAIN_TEST_WALLET.user.pChainAddress),
          /Delegation change output 0 threshold 2 is invalid for 1 owner/
        );
      });

      it('should reject a single-key change output on a multi-address wallet anchor', () => {
        // Exact-set equality (review hardening): the builder pays change to the
        // wallet's full from-address set, so a change output owned by only one
        // wallet address (e.g. just the BitGo key at threshold 1) must not let
        // the platform control the surplus alone.
        const walletOwners = [
          ON_CHAIN_TEST_WALLET.user.pChainAddress,
          ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
          ON_CHAIN_TEST_WALLET.backup.pChainAddress,
        ].join('~');
        const changePaysBitgoOnly = utils.parseAddress(ON_CHAIN_TEST_WALLET.bitgo.pChainAddress);
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [
                {
                  output: {
                    getOwners: () => [utils.parseAddress(ON_CHAIN_TEST_WALLET.user.pChainAddress)],
                    getThreshold: () => 1,
                  },
                },
              ],
              baseTx: {
                outputs: [
                  {
                    _type: TypeSymbols.TransferableOutput,
                    amount: () => 1000n,
                    output: { getOwners: () => [changePaysBitgoOnly], getLocktime: () => 0n, getThreshold: () => 1 },
                  },
                ],
              },
            }),
          }),
        };

        assert.throws(
          () => basecoin.validateDelegationWalletOwnership(delegationTx, walletOwners),
          /Delegation change output 0 owner set .* does not match the wallet's full owner set/
        );
      });

      it('should accept a change output carrying the full wallet owner set in any order', () => {
        const walletOwners = [
          ON_CHAIN_TEST_WALLET.user.pChainAddress,
          ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
          ON_CHAIN_TEST_WALLET.backup.pChainAddress,
        ].join('~');
        // Deliberately a different order than the anchor — order-insensitive compare.
        const fullSetReordered = [
          ON_CHAIN_TEST_WALLET.backup.pChainAddress,
          ON_CHAIN_TEST_WALLET.user.pChainAddress,
          ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
        ].map((addr) => utils.parseAddress(addr));
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [
                {
                  output: {
                    getOwners: () => [utils.parseAddress(ON_CHAIN_TEST_WALLET.user.pChainAddress)],
                    getThreshold: () => 1,
                  },
                },
              ],
              baseTx: {
                outputs: [
                  {
                    _type: TypeSymbols.TransferableOutput,
                    amount: () => 1000n,
                    output: { getOwners: () => fullSetReordered, getLocktime: () => 0n, getThreshold: () => 1 },
                  },
                ],
              },
            }),
          }),
        };

        assert.doesNotThrow(() => basecoin.validateDelegationWalletOwnership(delegationTx, walletOwners));
      });

      it('should accept a delegation with no change outputs (empty baseTx.outputs)', () => {
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [
                {
                  output: {
                    getOwners: () => [utils.parseAddress(ON_CHAIN_TEST_WALLET.user.pChainAddress)],
                    getThreshold: () => 1,
                  },
                },
              ],
              baseTx: { outputs: [] },
            }),
          }),
        };

        assert.doesNotThrow(() =>
          basecoin.validateDelegationWalletOwnership(delegationTx, ON_CHAIN_TEST_WALLET.user.pChainAddress)
        );
      });

      it('should accept a delegation whose stake owners are a signing-key subset of the wallet owner set', () => {
        // Stake outputs are built from getSigningAddresses() — two of the wallet's three
        // keys (user+bitgo, or backup+bitgo in recovery) — so the stake owners are a
        // subset of the wallet's full owner set, not equal to it.
        const walletOwners = [
          ON_CHAIN_TEST_WALLET.user.pChainAddress,
          ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
          ON_CHAIN_TEST_WALLET.backup.pChainAddress,
        ].join('~');
        const signingOwnerBytes = [
          utils.parseAddress(ON_CHAIN_TEST_WALLET.user.pChainAddress),
          utils.parseAddress(ON_CHAIN_TEST_WALLET.bitgo.pChainAddress),
        ];
        const rewardBytes = utils.parseAddress(validStakingOptions.rewardAddress);
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [{ output: { getOwners: () => signingOwnerBytes, getThreshold: () => 1 } }],
              getDelegatorRewardsOwner: () => ({ addrs: [{ toBytes: () => rewardBytes }] }),
              baseTx: { outputs: [] },
            }),
          }),
        };
        const params = {
          txParams: { stakingOptions: validStakingOptions },
          wallet: {
            coinSpecific: () => ({ rootAddress: walletOwners }),
            receiveAddress: () => undefined,
          },
        };

        assert.doesNotThrow(() => basecoin.validateDelegationOwners(delegationTx, params));
      });

      it('should accept a delegation whose rewardAddress is supplied in hex form', () => {
        // The builder accepts 0x-prefixed reward addresses; the comparison is by decoded
        // bytes so hex, raw-hex, and P-/C- bech32 forms of the same address all match.
        const rewardBytes = utils.parseAddress(validStakingOptions.rewardAddress);
        const hexRewardAddress = '0x' + rewardBytes.toString('hex');
        const delegationTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              stake: [{ output: { getOwners: () => [rewardBytes], getThreshold: () => 1 } }],
              baseTx: { outputs: [] },
              getDelegatorRewardsOwner: () => ({ addrs: [{ toBytes: () => rewardBytes }] }),
            }),
          }),
        };
        const params = {
          txParams: { stakingOptions: { ...validStakingOptions, rewardAddress: hexRewardAddress } },
          wallet: {
            // P-form of the same payload as the C-prefixed fixture rewardAddress:
            // the stake owner's derived P-address must be in the anchor set.
            coinSpecific: () => ({ rootAddress: 'P-costwo1uyp5n76gjqltrddur7qlrsmt3kyh8fnrmwhqk7' }),
            receiveAddress: () => undefined,
          },
        };

        assert.doesNotThrow(() => basecoin.validateDelegationOwners(delegationTx, params));
      });

      it('should throw when rewardAddress is missing', () => {
        const txParams = {
          stakingOptions: {
            ...validStakingOptions,
            rewardAddress: undefined,
          },
        };
        assert.throws(
          () => basecoin.validateDelegationTx(txParams, validExplainedTx),
          /Delegation transaction requires rewardAddress/
        );
      });

      it('should throw when outputAmount does not match expected amount', () => {
        const txParams = { stakingOptions: validStakingOptions };
        const mismatchedExplainedTx = {
          ...validExplainedTx,
          outputAmount: '60000000000000', // Different from expected 50000000000000
        };
        assert.throws(
          () => basecoin.validateDelegationTx(txParams, mismatchedExplainedTx),
          /Delegation amount mismatch/
        );
      });

      it('should pass when the transaction validator nodeId matches the requested nodeID', () => {
        const txParams = { stakingOptions: validStakingOptions };
        const explainedTx = {
          ...validExplainedTx,
          outputs: [{ address: validStakingOptions.nodeID, value: '0' }],
        };
        assert.doesNotThrow(() => basecoin.validateDelegationTx(txParams, explainedTx));
      });

      it('should throw when the transaction delegates to a different node than requested', () => {
        const txParams = { stakingOptions: validStakingOptions };
        const explainedTx = {
          ...validExplainedTx,
          outputs: [{ address: 'NodeID-AnotherNode1234567890abcdefghijklmnopqr', value: '0' }],
        };
        assert.throws(() => basecoin.validateDelegationTx(txParams, explainedTx), /Delegation nodeID mismatch/);
      });

      it('should fail closed when the delegation transaction exposes no nodeId', () => {
        const txParams = { stakingOptions: validStakingOptions };
        const explainedTx = {
          ...validExplainedTx,
          outputs: [],
        };
        assert.throws(
          () => basecoin.validateDelegationTx(txParams, explainedTx),
          /does not expose the validator nodeId/
        );
      });
    });
  });

  describe('MPC/TSS Coin-Level Methods', () => {
    const coinConfig = coins.get('tflrp');
    const factory = new FlrpLib.TransactionBuilderFactory(coinConfig);

    // Helper: build unsigned MPC ExportInC tx and return its hex
    async function buildUnsignedExportInC(): Promise<string> {
      const txBuilder = factory
        .getExportInCBuilder()
        .fromPubKey(EXPORT_IN_C.cHexAddress)
        .nonce(EXPORT_IN_C.nonce)
        .amount(EXPORT_IN_C.amount)
        .threshold(1)
        .locktime(0)
        .to(ON_CHAIN_TEST_WALLET.user.pChainAddress)
        .fee(EXPORT_IN_C.fee)
        .context(CONTEXT as FlrpContext);

      const tx = await txBuilder.build();
      return tx.toBroadcastFormat();
    }

    // Helper: build unsigned MPC ImportInP tx and return its hex.
    // outputLocktime/outputThreshold shape the destination output; utxoThreshold is the
    // threshold of the consumed UTXO (which determines the imported input's sig indices).
    async function buildUnsignedImportInP(opts?: {
      outputLocktime?: number;
      outputThreshold?: number;
      utxoThreshold?: number;
    }): Promise<string> {
      const { outputLocktime = 0, outputThreshold = 1, utxoThreshold = 1 } = opts ?? {};
      const mpcUtxo = {
        outputID: 7,
        amount: '50000000',
        txid: 'aLwVQequmbhhjfhL6SvfM6MGWAB8wHwQfJ67eowEbAEUpkueN',
        threshold: utxoThreshold,
        addresses: [ON_CHAIN_TEST_WALLET.user.pChainAddress],
        outputidx: '0',
        locktime: '0',
      };
      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(outputThreshold)
        .locktime(outputLocktime)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.corethAddress])
        .to([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .externalChainId(IMPORT_IN_P.sourceChainId)
        .decodedUtxos([mpcUtxo])
        .context(IMPORT_IN_P.context as FlrpContext)
        .feeState(IMPORT_IN_P.feeState as any);

      const tx = await txBuilder.build();
      return tx.toBroadcastFormat();
    }

    // Helper: build unsigned MPC ExportInP tx and return its hex
    // Helper: build unsigned MPC ExportInP tx and return its hex.
    // amount/locktime shape the exported output (a full-spend amount produces no
    // change output; a future locktime produces a time-locked output).
    async function buildUnsignedExportInP(opts?: { amount?: string; locktime?: number }): Promise<string> {
      const { amount = '30000000', locktime = 0 } = opts ?? {};
      const mpcUtxo = {
        outputID: 7,
        amount: '50000000',
        txid: 'bgHnEJ64td8u31aZrGDaWcDqxZ8vDV5qGd7bmSifgvUnUW8v2',
        threshold: 1,
        addresses: [ON_CHAIN_TEST_WALLET.user.pChainAddress],
        outputidx: '0',
        locktime: '0',
      };
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(1)
        .locktime(locktime)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .amount(amount)
        .externalChainId(EXPORT_IN_P.sourceChainId)
        .decodedUtxos([mpcUtxo])
        .context(EXPORT_IN_P.context as FlrpContext)
        .feeState(EXPORT_IN_P.feeState as unknown as FlrpFeeState);

      const tx = await txBuilder.build();
      return tx.toBroadcastFormat();
    }

    // Helper: build unsigned MPC ImportInC tx and return its hex
    async function buildUnsignedImportInC(): Promise<string> {
      const mpcUtxo = {
        outputID: 7,
        amount: '30000000',
        txid: 'nSBwNcgfLbk5S425b1qaYaqTTCiMCV75KU4Fbnq8SPUUqLq2',
        threshold: 1,
        addresses: [ON_CHAIN_TEST_WALLET.user.pChainAddress],
        outputidx: '1',
        locktime: '0',
      };
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(1)
        .locktime(0)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
        .fee('1000000')
        .decodedUtxos([mpcUtxo])
        .context(IMPORT_IN_C.context as FlrpContext);

      const tx = await txBuilder.build();
      return tx.toBroadcastFormat();
    }

    describe('getSignablePayload', () => {
      it('should return signable payload for ExportInC', async () => {
        const txHex = await buildUnsignedExportInC();
        const payload = await basecoin.getSignablePayload(txHex);

        payload.should.be.instanceOf(Buffer);
        payload.length.should.be.greaterThan(0);
      });

      it('should return signable payload for ImportInP', async () => {
        const txHex = await buildUnsignedImportInP();
        const payload = await basecoin.getSignablePayload(txHex);

        payload.should.be.instanceOf(Buffer);
        payload.length.should.be.greaterThan(0);
      });

      it('should return signable payload for ExportInP', async () => {
        const txHex = await buildUnsignedExportInP();
        const payload = await basecoin.getSignablePayload(txHex);

        payload.should.be.instanceOf(Buffer);
        payload.length.should.be.greaterThan(0);
      });

      it('should return signable payload for ImportInC', async () => {
        const txHex = await buildUnsignedImportInC();
        const payload = await basecoin.getSignablePayload(txHex);

        payload.should.be.instanceOf(Buffer);
        payload.length.should.be.greaterThan(0);
      });
    });

    describe('addSignatureToTransaction', () => {
      it('should complete getSignablePayload → sign → addSignatureToTransaction round-trip for ExportInC', async () => {
        const txHex = await buildUnsignedExportInC();

        // Get signable payload (what MPC ceremony would receive)
        const payload = await basecoin.getSignablePayload(txHex);

        // Simulate MPC: sign externally
        const signature = await secp256k1.sign(payload, Buffer.from(ON_CHAIN_TEST_WALLET.user.privateKey, 'hex'));

        // Inject signature
        const signedHex = await basecoin.addSignatureToTransaction(txHex, Buffer.from(signature));
        signedHex.should.not.equal(txHex);

        // Verify signed tx can be parsed
        const txBuilder = factory.from(signedHex);
        const tx = await txBuilder.build();
        tx.signature.length.should.equal(1);
        tx.toJson().type.should.equal(TransactionType.Export);
      });

      it('should complete round-trip for ImportInP', async () => {
        const txHex = await buildUnsignedImportInP();
        const payload = await basecoin.getSignablePayload(txHex);
        const signature = await secp256k1.sign(payload, Buffer.from(ON_CHAIN_TEST_WALLET.user.privateKey, 'hex'));
        const signedHex = await basecoin.addSignatureToTransaction(txHex, Buffer.from(signature));

        signedHex.should.not.equal(txHex);
        const tx = await factory.from(signedHex).build();
        tx.signature.length.should.equal(1);
        tx.toJson().type.should.equal(TransactionType.Import);
      });

      it('should complete round-trip for ExportInP', async () => {
        const txHex = await buildUnsignedExportInP();
        const payload = await basecoin.getSignablePayload(txHex);
        const signature = await secp256k1.sign(payload, Buffer.from(ON_CHAIN_TEST_WALLET.user.privateKey, 'hex'));
        const signedHex = await basecoin.addSignatureToTransaction(txHex, Buffer.from(signature));

        signedHex.should.not.equal(txHex);
        const tx = await factory.from(signedHex).build();
        tx.signature.length.should.equal(1);
        tx.toJson().type.should.equal(TransactionType.Export);
      });

      it('should complete round-trip for ImportInC', async () => {
        const txHex = await buildUnsignedImportInC();
        const payload = await basecoin.getSignablePayload(txHex);
        const signature = await secp256k1.sign(payload, Buffer.from(ON_CHAIN_TEST_WALLET.user.privateKey, 'hex'));
        const signedHex = await basecoin.addSignatureToTransaction(txHex, Buffer.from(signature));

        signedHex.should.not.equal(txHex);
        const tx = await factory.from(signedHex).build();
        tx.signature.length.should.equal(1);
        tx.toJson().type.should.equal(TransactionType.Import);
      });

      it('should produce valid signed tx via both sign() and addSignatureToTransaction() for ExportInC', async () => {
        const privateKey = ON_CHAIN_TEST_WALLET.user.privateKey;

        // Path 1: sign() via signTransaction
        const signResult = await basecoin.signTransaction({
          txPrebuild: { txHex: await buildUnsignedExportInC() },
          prv: privateKey,
        });
        const signedHex1 = (signResult as HalfSignedAccountTransaction).halfSigned!.txHex!;

        // Path 2: getSignablePayload → external sign → addSignatureToTransaction
        const unsignedHex = await buildUnsignedExportInC();
        const payload = await basecoin.getSignablePayload(unsignedHex);
        const signature = await secp256k1.sign(payload, Buffer.from(privateKey, 'hex'));
        const signedHex2 = await basecoin.addSignatureToTransaction(unsignedHex, Buffer.from(signature));

        // Both paths should produce valid signed transactions with 1 signature
        const tx1 = await factory.from(signedHex1).build();
        const tx2 = await factory.from(signedHex2).build();
        tx1.signature.length.should.equal(1);
        tx2.signature.length.should.equal(1);
        tx1.toJson().type.should.equal(TransactionType.Export);
        tx2.toJson().type.should.equal(TransactionType.Export);
      });
    });

    describe('verifyTransaction with MPC params', () => {
      it('should verify MPC ExportInC transaction', async () => {
        const txHex = await buildUnsignedExportInC();
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: EXPORT_IN_C.amount }],
          type: 'Export',
          locktime: 0,
        };

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
        isVerified.should.equal(true);
      });

      it('should verify MPC ImportInP transaction', async () => {
        const txHex = await buildUnsignedImportInP();
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: '1' }],
          type: 'Import',
          locktime: 0,
        };

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
        isVerified.should.equal(true);
      });

      it('should verify MPC ImportInP transaction when txParams.type is the "import" intent alias', async () => {
        const txHex = await buildUnsignedImportInP();
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: '1' }],
          type: 'import',
          locktime: 0,
        };

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
        isVerified.should.equal(true);
      });

      it('should verify MPC ExportInP transaction', async () => {
        const txHex = await buildUnsignedExportInP();
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: '30000000' }],
          type: 'Export',
          locktime: 0,
        };
        const wallet = keychainWallet([ON_CHAIN_TEST_WALLET.user.privateKey]);

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
        isVerified.should.equal(true);
      });

      it('should verify a P-to-C export with no change outputs (full-spend export)', async () => {
        // Exporting the entire spendable amount leaves no P-chain change output;
        // the empty change list must verify cleanly.
        const txHex = await buildUnsignedExportInP({ amount: '48739000' });
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: '48739000' }],
          type: 'Export',
          locktime: 0,
        };
        const wallet = keychainWallet([ON_CHAIN_TEST_WALLET.user.privateKey]);

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
        isVerified.should.equal(true);
      });

      it('should reject a P-to-C export whose output has a future locktime', async () => {
        // Wallet-owned output, matching amount — but time-locked funds would be
        // frozen until the locktime passes; verification must fail.
        const futureLocktime = Math.floor(Date.now() / 1000) + 3600;
        const txHex = await buildUnsignedExportInP({ locktime: futureLocktime });
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: '30000000' }],
          type: 'Export',
          locktime: 0,
        };
        const wallet = keychainWallet([ON_CHAIN_TEST_WALLET.user.privateKey]);

        await basecoin
          .verifyTransaction({ txParams, txPrebuild, wallet })
          .should.be.rejectedWith(/Export output locktime .* must be 0/);
      });

      it('should verify MPC ImportInC transaction', async () => {
        const txHex = await buildUnsignedImportInC();
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: '0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35', amount: '1' }],
          type: 'ImportToC',
          locktime: 0,
        };

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
        isVerified.should.equal(true);
      });

      it('should enforce the import-to-C destination check even without txParams.type (TSS intent flow pin)', async () => {
        // The MPC signing flow can reach verifyTransaction with no txParams.type; the
        // destination check must not depend on it. Correct destination passes:
        const txHex = await buildUnsignedImportInC();
        const txPrebuild = { txHex, txInfo: {} };
        const okParams = {
          recipients: [{ address: '0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35', amount: '1' }],
          locktime: 0,
        };

        const isVerified = await basecoin.verifyTransaction({ txParams: okParams, txPrebuild });
        isVerified.should.equal(true);

        // Attacker destination without a type still rejects:
        const attackerParams = {
          recipients: [{ address: '0x0000000000000000000000000000000000000001', amount: '1' }],
          locktime: 0,
        };
        await basecoin
          .verifyTransaction({ txParams: attackerParams, txPrebuild })
          .should.be.rejectedWith(/Import destination .* does not match the expected recipient/);
      });

      it('should reject an import-to-P output with a future locktime', async () => {
        const futureLocktime = Math.floor(Date.now() / 1000) + 3600;
        const txHex = await buildUnsignedImportInP({ outputLocktime: futureLocktime });
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: '1' }],
          type: 'Import',
          locktime: 0,
        };

        await basecoin
          .verifyTransaction({ txParams, txPrebuild })
          .should.be.rejectedWith(/Import output locktime .* must be 0/);
      });

      it('should accept an import-to-P that consumes UTXOs whose thresholds differ from the output threshold', () => {
        // Inputs may carry any threshold the network accepts — the consumed atomic UTXO's
        // threshold is set by whoever created it (the earlier export), so importing a
        // 1-of-N UTXO into a 2-of-3 output must not throw (regression pin).
        const mixedThresholdTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              baseTx: {
                outputs: [
                  {
                    output: {
                      getLocktime: () => 0n,
                      getThreshold: () => 2,
                      getOwners: () => [Buffer.alloc(20, 1), Buffer.alloc(20, 2), Buffer.alloc(20, 3)],
                    },
                  },
                ],
              },
              ins: [{ input: { sigIndicies: () => [0] } }, { input: { sigIndicies: () => [0, 1] } }],
            }),
          }),
        };

        assert.doesNotThrow(() => basecoin.validateImportOutputPolicy(mixedThresholdTx));
      });

      it('should reject an import-to-P output whose threshold is structurally invalid', () => {
        // threshold 0 and threshold > owner count are both invalid output policies
        const zeroThresholdTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              baseTx: {
                outputs: [
                  { output: { getLocktime: () => 0n, getThreshold: () => 0, getOwners: () => [Buffer.alloc(20, 1)] } },
                ],
              },
              ins: [{ input: { sigIndicies: () => [0] } }],
            }),
          }),
        };
        assert.throws(() => basecoin.validateImportOutputPolicy(zeroThresholdTx), /threshold 0 is invalid/);

        const overThresholdTx = {
          getFlareTransaction: () => ({
            getTx: () => ({
              baseTx: {
                outputs: [
                  {
                    output: {
                      getLocktime: () => 0n,
                      getThreshold: () => 3,
                      getOwners: () => [Buffer.alloc(20, 1), Buffer.alloc(20, 2)],
                    },
                  },
                ],
              },
              ins: [{ input: { sigIndicies: () => [0] } }],
            }),
          }),
        };
        assert.throws(() => basecoin.validateImportOutputPolicy(overThresholdTx), /threshold 3 is invalid/);
      });

      it('should verify an import-to-P output with a valid 2-of-2 owner set', async () => {
        const mpcUtxo = {
          outputID: 7,
          amount: '50000000',
          txid: 'aLwVQequmbhhjfhL6SvfM6MGWAB8wHwQfJ67eowEbAEUpkueN',
          threshold: 2,
          addresses: [ON_CHAIN_TEST_WALLET.user.pChainAddress, ON_CHAIN_TEST_WALLET.bitgo.pChainAddress],
          outputidx: '0',
          locktime: '0',
        };
        const txBuilder = factory
          .getImportInPBuilder()
          .threshold(2)
          .locktime(0)
          .fromPubKey([ON_CHAIN_TEST_WALLET.user.corethAddress, ON_CHAIN_TEST_WALLET.bitgo.corethAddress])
          .to([ON_CHAIN_TEST_WALLET.user.pChainAddress, ON_CHAIN_TEST_WALLET.bitgo.pChainAddress])
          .externalChainId(IMPORT_IN_P.sourceChainId)
          .decodedUtxos([mpcUtxo])
          .context(IMPORT_IN_P.context as FlrpContext)
          .feeState(IMPORT_IN_P.feeState as any);
        const txHex = (await (await txBuilder.build()).toBroadcastFormat()) as unknown as string;
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [
            {
              address: `${ON_CHAIN_TEST_WALLET.user.pChainAddress}~${ON_CHAIN_TEST_WALLET.bitgo.pChainAddress}`,
              amount: '1',
            },
          ],
          type: 'Import',
          locktime: 0,
        };

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
        isVerified.should.equal(true);
      });

      it('should verify delegation transaction when txParams.type is the "stake" intent alias', async () => {
        const txPrebuild = { txHex: MULTISIG_DELEGATION_FULLY_SIGNED_TX_HEX, txInfo: {} };
        const txParams = {
          type: 'stake', // intent-type alias used by wallet-platform; must normalise to AddPermissionlessDelegator
          stakingOptions: {
            nodeID: MULTISIG_DELEGATION_PARAMS.nodeID,
            amount: MULTISIG_DELEGATION_PARAMS.stakeAmount,
            durationSeconds: MULTISIG_DELEGATION_PARAMS.duration * 24 * 60 * 60,
            rewardAddress: MULTISIG_DELEGATION_PARAMS.rewardAddress,
          },
        };
        // The fixture delegation's stake and change owners are the wallet's multisig
        // address set; the intent path also requires the wallet anchor (CECHO-2715).
        const wallet = {
          coinSpecific: () => ({ rootAddress: MULTISIG_DELEGATION_PARAMS.multisigAddresses.join('~') }),
          receiveAddress: () => undefined,
        };

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
        isVerified.should.equal(true);
      });
      it('should verify delegation in the MPC staking flow (no type, no stakingOptions) against the wallet anchor', async () => {
        // In the MPC/TSS staking flow, the txRequest is created by staking-service (not the UI).
        // The UI only has txRequestId — no buildParams. The SDK falls back to { recipients: [] }
        // with no type and no stakingOptions. Without staking intent, verification now runs the
        // wallet-anchored ownership checks (stake and change owners) and fails closed when no
        // anchor is available (CECHO-2715); the nodeID/rewards/amount residual is tracked as
        // CECHO-2904. The real signing flow always passes the wallet — mirrored here.
        const txPrebuild = { txHex: MPC_DELEGATION_UNSIGNED_TX_HEX, txInfo: {} };
        const txParams = {
          recipients: [],
          // no type — simulates MPC staking flow where buildParams is unavailable
          // no stakingOptions — not passed through in the MPC intent flow
        };
        // The fixture delegation's stake and change owners are the wallet's own address.
        const wallet = {
          coinSpecific: () => ({
            rootAddress: 'P-costwo1snayg8ucrl88e433382swxqzxa4dvemwscm7nq',
          }),
          receiveAddress: () => undefined,
        };

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet });
        isVerified.should.equal(true);
      });
    });

    describe('verifyTransaction with TSS wallet (Avalanche atomic)', () => {
      it('should verify TSS ExportInP when passed serializedTxHex (not signableHex)', async () => {
        // The SDK's signRequestBase now passes serializedTxHex (the full
        // PVM transaction bytes) to verifyTransaction for Avalanche atomic txs,
        // instead of signableHex (a 32-byte SHA-256 hash that can't be parsed).
        // This test confirms verifyTransaction succeeds with the actual tx bytes.
        const txHex = await buildUnsignedExportInP();
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: '30000000' }],
          type: 'Export',
          locktime: 0,
        };

        const wallet = keychainWallet([ON_CHAIN_TEST_WALLET.user.privateKey]);
        const isVerified = await basecoin.verifyTransaction({
          txParams,
          txPrebuild,
          walletType: 'tss',
          wallet,
        });
        isVerified.should.equal(true);
      });

      it('should verify TSS ImportInP when passed serializedTxHex', async () => {
        const txHex = await buildUnsignedImportInP();
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: ON_CHAIN_TEST_WALLET.user.pChainAddress, amount: '1' }],
          type: 'Import',
          locktime: 0,
        };

        const wallet = keychainWallet([ON_CHAIN_TEST_WALLET.user.privateKey]);
        const isVerified = await basecoin.verifyTransaction({
          txParams,
          txPrebuild,
          walletType: 'tss',
          wallet,
        });
        isVerified.should.equal(true);
      });

      it('should verify TSS ImportInC when passed serializedTxHex', async () => {
        const txHex = await buildUnsignedImportInC();
        const txPrebuild = { txHex, txInfo: {} };
        const txParams = {
          recipients: [{ address: '0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35', amount: '1' }],
          type: 'ImportToC',
          locktime: 0,
        };

        const wallet = keychainWallet([ON_CHAIN_TEST_WALLET.user.privateKey]);
        const isVerified = await basecoin.verifyTransaction({
          txParams,
          txPrebuild,
          walletType: 'tss',
          wallet,
        });
        isVerified.should.equal(true);
      });

      it('isSignablePreHashed should be true for Avalanche atomic txs', async () => {
        const txHex = await buildUnsignedExportInP();
        const rawHex = txHex.startsWith('0x') ? txHex.substring(2) : txHex;
        const signableHex = createHash('sha256').update(Buffer.from(rawHex, 'hex')).digest('hex');

        basecoin.isSignablePreHashed({ serializedTxHex: rawHex, signableHex }).should.equal(true);
        basecoin
          .isSignablePreHashed({ serializedTxHex: 'f86c808504a817c800825208', signableHex: 'f86c808504a817c800825208' })
          .should.equal(false);
      });

      it('should verify signablePayload is SHA-256 of serialized tx (sandbox-verified)', async () => {
        // unsignedTx.toBytes() → sha256 → MPC.sign()
        // The signablePayload must be exactly 32 bytes (SHA-256 digest).
        // This is what the WP stores as signableHex and what ecdsaMPCv2.ts
        // must use directly (no keccak256 re-hashing).
        const txHex = await buildUnsignedExportInP();
        const payload = await basecoin.getSignablePayload(txHex);

        // signablePayload is SHA-256(txBody) — always 32 bytes
        assert.strictEqual(payload.length, 32, 'signablePayload must be 32 bytes (SHA-256)');

        // The serializedTxHex (after stripping 0x) starts with Avalanche codec '0000'
        // This is how ecdsaMPCv2.ts detects atomic transactions
        const rawHex = txHex.startsWith('0x') ? txHex.substring(2) : txHex;
        assert.ok(rawHex.startsWith('0000'), 'Avalanche atomic tx must start with codec prefix 0000');
      });

      it('should reject a SHA-256 hash as txHex (proves the fix is needed)', async () => {
        const sha256Hash = 'a'.repeat(64);
        const txPrebuild = { txHex: sha256Hash, txInfo: {} };
        const txParams = { recipients: [], type: 'Export', locktime: 0 };

        let threw = false;
        try {
          await basecoin.verifyTransaction({ txParams, txPrebuild, walletType: 'tss' });
        } catch (e) {
          threw = true;
          assert(e.message.includes('Invalid transaction'), `Expected 'Invalid transaction', got: ${e.message}`);
        }
        assert(threw, 'Expected verifyTransaction to throw for SHA-256 hash as txHex');
      });
    });
  });

  describe('createPairedWallet', function () {
    const walletId = 'abc123def456abc123def456abc123de';

    afterEach(function () {
      nock.cleanAll();
    });

    it('should POST to create-paired-wallet and return new wallet', async function () {
      const bgUrl = common.Environments[bitgo.getEnv()].uri;
      const expectedResponse: CreatePairedWalletResponse = {
        id: 'newwalletid000000000000000000001',
        coin: 'tflr',
        label: 'My FLR C Wallet',
        keys: ['key1', 'key2', 'key3'],
        keySignatures: { backupPub: 'sig1', bitgoPub: 'sig2' },
        m: 2,
        n: 3,
        type: 'hot',
        multisigType: 'tss',
        coinSpecific: {
          pairedWalletId: walletId,
          baseAddress: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
        },
      };

      nock(bgUrl)
        .post(`/api/v2/tflrp/wallet/${walletId}/create-paired-wallet`, { label: 'My FLR C Wallet' })
        .reply(200, expectedResponse);

      const result = await basecoin.createPairedWallet({ walletId, label: 'My FLR C Wallet' });
      result.should.deepEqual(expectedResponse);
      result.coin.should.equal('tflr');
      result.coinSpecific.pairedWalletId.should.equal(walletId);
    });

    it('should POST without body when label is not provided', async function () {
      const bgUrl = common.Environments[bitgo.getEnv()].uri;
      const expectedResponse: CreatePairedWalletResponse = {
        id: 'newwalletid000000000000000000002',
        coin: 'tflr',
        label: 'FLR C wallet (from tflrp wallet abc123def456abc123def456abc123de)',
        keys: ['key1', 'key2', 'key3'],
        keySignatures: {},
        m: 2,
        n: 3,
        type: 'hot',
        multisigType: 'tss',
        coinSpecific: { pairedWalletId: walletId },
      };

      nock(bgUrl).post(`/api/v2/tflrp/wallet/${walletId}/create-paired-wallet`, {}).reply(200, expectedResponse);

      const result = await basecoin.createPairedWallet({ walletId });
      result.should.deepEqual(expectedResponse);
    });

    it('should propagate HTTP errors from the server', async function () {
      const bgUrl = common.Environments[bitgo.getEnv()].uri;

      nock(bgUrl)
        .post(`/api/v2/tflrp/wallet/${walletId}/create-paired-wallet`)
        .reply(400, { error: 'Source FLR P wallet is not MPC (multisigType: onchain)' });

      await basecoin
        .createPairedWallet({ walletId })
        .should.be.rejectedWith('Source FLR P wallet is not MPC (multisigType: onchain)');
    });
  });
});
