import * as FlrpLib from '../../src/lib';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Flrp, TflrP } from '../../src/';
import { randomBytes } from 'crypto';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import { SEED_ACCOUNT, ACCOUNT_1, ACCOUNT_2, ON_CHAIN_TEST_WALLET, CONTEXT } from '../resources/account';
import { EXPORT_IN_C } from '../resources/transactionData/exportInC';
import { EXPORT_IN_P } from '../resources/transactionData/exportInP';
import { IMPORT_IN_P } from '../resources/transactionData/importInP';
import { IMPORT_IN_C } from '../resources/transactionData/importInC';
import { HalfSignedAccountTransaction, TransactionType, MPCAlgorithm, common } from '@bitgo/sdk-core';
import { secp256k1 } from '@flarenetwork/flarejs';
import { FlrpContext } from '@bitgo/public-types';
import assert from 'assert';
import nock from 'nock';
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
    basecoin.getDefaultMultisigType().should.equal('onchain');
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

      const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
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
        recipients: [],
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
      const addresses = [...EXPORT_IN_C.pAddresses, 'invalid'];
      basecoin.isValidAddress(addresses).should.be.false();
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
        outputs: [],
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

    // Helper: build unsigned MPC ImportInP tx and return its hex
    async function buildUnsignedImportInP(): Promise<string> {
      const mpcUtxo = {
        outputID: 7,
        amount: '50000000',
        txid: 'aLwVQequmbhhjfhL6SvfM6MGWAB8wHwQfJ67eowEbAEUpkueN',
        threshold: 1,
        addresses: [ON_CHAIN_TEST_WALLET.user.pChainAddress],
        outputidx: '0',
        locktime: '0',
      };
      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(1)
        .locktime(0)
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
    async function buildUnsignedExportInP(): Promise<string> {
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
        .locktime(0)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .amount('30000000')
        .externalChainId(EXPORT_IN_P.sourceChainId)
        .decodedUtxos([mpcUtxo])
        .context(EXPORT_IN_P.context as FlrpContext)
        .feeState(EXPORT_IN_P.feeState as any);

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
          recipients: [],
          type: 'Import',
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

        const isVerified = await basecoin.verifyTransaction({ txParams, txPrebuild });
        isVerified.should.equal(true);
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
