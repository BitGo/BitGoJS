import * as FlrpLib from '../../src/lib';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Flrp, TflrP } from '../../src/';
import { randomBytes } from 'crypto';
import { BitGoAPI } from '@bitgo/sdk-api';
import { SEED_ACCOUNT, ACCOUNT_1, ACCOUNT_2 } from '../resources/account';
import { EXPORT_IN_C } from '../resources/transactionData/exportInC';
import { EXPORT_IN_P } from '../resources/transactionData/exportInP';
import { IMPORT_IN_P } from '../resources/transactionData/importInP';
import { IMPORT_IN_C } from '../resources/transactionData/importInC';
import { HalfSignedAccountTransaction, TransactionType } from '@bitgo/sdk-core';
import assert from 'assert';

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
      const params = {
        txPrebuild: {
          txHex: EXPORT_IN_P.unsignedHex,
        },
        prv: EXPORT_IN_P.privateKeys[0],
      };

      const signedTx = await basecoin.signTransaction(params);
      signedTx.should.have.property('halfSigned');
      const halfSigned = (signedTx as HalfSignedAccountTransaction).halfSigned;
      assert(halfSigned, 'halfSigned should be defined');
      assert(halfSigned.txHex, 'txHex should be defined');
      halfSigned.txHex.should.equal(EXPORT_IN_P.halfSigntxHex);
    });

    it('should sign an import to P-chain transaction', async () => {
      const params = {
        txPrebuild: {
          txHex: IMPORT_IN_P.unsignedHex,
        },
        prv: IMPORT_IN_P.privateKeys[0],
      };

      const signedTx = await basecoin.signTransaction(params);
      signedTx.should.have.property('halfSigned');
      const halfSigned = (signedTx as HalfSignedAccountTransaction).halfSigned;
      assert(halfSigned, 'halfSigned should be defined');
      assert(halfSigned.txHex, 'txHex should be defined');
      halfSigned.txHex.should.equal(IMPORT_IN_P.halfSigntxHex);
    });

    it('should sign an import to C-chain transaction', async () => {
      const params = {
        txPrebuild: {
          txHex: IMPORT_IN_C.unsignedHex,
        },
        prv: IMPORT_IN_C.privateKeys[0],
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
      txExplain.fee.fee.should.equal(EXPORT_IN_P.fee);
      txExplain.inputs.should.be.an.Array();
      txExplain.changeAmount.should.equal('498459568');
      txExplain.changeOutputs.should.be.an.Array();
      txExplain.changeOutputs[0].address.should.equal(
        'P-costwo106gc5h5qswhye8e0pmthq4wzf0ekv5qppsrvpu~P-costwo1cueygd7fd37g56s49k3rshqakhp6k8u3adzt6m~P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut'
      );
    });

    it('should explain a signed export from P-chain transaction', async () => {
      const txExplain = await basecoin.explainTransaction({ txHex: EXPORT_IN_P.fullSigntxHex });

      txExplain.type.should.equal(TransactionType.Export);
      txExplain.id.should.equal(EXPORT_IN_P.txhash);
      txExplain.fee.fee.should.equal(EXPORT_IN_P.fee);
      txExplain.inputs.should.be.an.Array();
      txExplain.changeAmount.should.equal('498459568');
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
      txExplain.fee.fee.should.equal(IMPORT_IN_P.fee);
      txExplain.inputs.should.be.an.Array();
      txExplain.outputAmount.should.equal('48739000');
      txExplain.outputs.should.be.an.Array();
      txExplain.outputs.length.should.equal(1);
      txExplain.changeOutputs.should.be.empty();
    });

    it('should explain a signed import to P-chain transaction', async () => {
      const txExplain = await basecoin.explainTransaction({ txHex: IMPORT_IN_P.fullSigntxHex });

      txExplain.type.should.equal(TransactionType.Import);
      txExplain.id.should.equal(IMPORT_IN_P.txhash);
      txExplain.fee.fee.should.equal(IMPORT_IN_P.fee);
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
        txHex: IMPORT_IN_P.fullSigntxHex,
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

    it('should throw for address with wrong number of keychains', async () => {
      const address = SEED_ACCOUNT.addressTestnet;

      await assert.rejects(
        async () =>
          basecoin.isWalletAddress({
            address,
            keychains: [{ pub: SEED_ACCOUNT.publicKey }],
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
});
