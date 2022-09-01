import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AvaxC, TavaxC, TransactionBuilder } from '../../src';
import { getBuilder } from './getBuilder';
import * as secp256k1 from 'secp256k1';
import { bip32 } from '@bitgo/utxo-lib';
import * as nock from 'nock';
import { common, TransactionType, Wallet } from '@bitgo/sdk-core';
import { Eth } from '@bitgo/sdk-coin-eth';
import { AvaxSignTransactionOptions } from '../../src/iface';

nock.enableNetConnect();

describe('Avalanche C-Chain', function () {
  let bitgo: TestBitGoAPI;
  let tavaxCoin;
  let avaxCoin;
  let hopTxBitgoSignature;

  const address1 = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const address2 = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
  const hopContractAddress = '0x47ce7cc86efefef19f8fb516b11735d183da8635';
  const hopDestinationAddress = '0x9c7e8ce6825bD48278B3Ab59228EE26f8BE7925b';
  const hopTx =
    '0xf86b808504a817c8ff8252ff949c7e8ce6825bd48278b3ab59228ee26f8be7925b87038d7ea4c68000801ca011bc22c664570133dfca4f08a0b8d02339cf467046d6a4152f04f368d0eaf99ea01d6dc5cf0c897c8d4c3e1df53d0d042784c424536a4cc5b802552b7d64fee8b5';
  const hopTxid = '0x4af65143bc77da2b50f35b3d13cacb4db18f026bf84bc0743550bc57b9b53351';
  const userReqSig =
    '0x404db307f6147f0d8cd338c34c13906ef46a6faa7e0e119d5194ef05aec16e6f3d710f9b7901460f97e924066b62efd74443bd34402c6d40b49c203a559ff2c8';

  before(function () {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    hopTxBitgoSignature =
      '0xaa' +
      Buffer.from(secp256k1.ecdsaSign(Buffer.from(hopTxid.slice(2), 'hex'), bitgoKey.privateKey).signature).toString(
        'hex'
      );

    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('avaxc', AvaxC.createInstance);
    bitgo.safeRegister('tavaxc', TavaxC.createInstance);
    bitgo.safeRegister('teth', Eth.createInstance);
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo.initializeTestVars();
  });

  beforeEach(() => {
    tavaxCoin = bitgo.coin('tavaxc') as TavaxC;
    avaxCoin = bitgo.coin('avaxc') as AvaxC;
  });

  after(function () {
    nock.cleanAll();
  });

  describe('Instantiate & Statics', () => {
    it('should instantiate the coin', function () {
      let localBasecoin = bitgo.coin('tavaxc');
      localBasecoin.should.be.an.instanceof(TavaxC);

      localBasecoin = bitgo.coin('avaxc');
      localBasecoin.should.be.an.instanceof(AvaxC);
    });

    it('should get hop digest', () => {
      const digest = AvaxC.getHopDigest(['1', '2', '3']);
      digest.toString('hex').should.equal('231cda5f050c841322b9df536afb633ca062400a8f393bf654a48bdd1dfd825b');
    });
  });

  describe('KeyPair', () => {
    it('should generate tavax keyPair without aguments', () => {
      const kp = tavaxCoin.generateKeyPair();
      kp.should.have.property('prv');
      kp.should.have.property('pub');
    });

    it('should generate avax keyPair without aguments', () => {
      const kp = avaxCoin.generateKeyPair();
      kp.should.have.property('prv');
      kp.should.have.property('pub');
    });

    it('should generate avax keyPair from seed', () => {
      const seed = '4b3b89f6ca897cb729d2146913877f71';
      const tAvaxKeyPair = tavaxCoin.generateKeyPair(Buffer.from(seed, 'hex'));
      const avaxKeyPair = avaxCoin.generateKeyPair(Buffer.from(seed, 'hex'));
      tAvaxKeyPair.should.have.property('prv');
      tAvaxKeyPair.should.have.property('pub');
      tAvaxKeyPair.prv.should.equals(
        'xprv9s21ZrQH143K2MJE1yvV8UhjfLQcaDPPipMYvfYjrPbHLptLsnt1FbbCrCT9E5LCmRrS593YZ1CKgf3rf3C2hYTynZN5au3VvBvLcWh8sV2'
      );
      tAvaxKeyPair.pub!.should.equals(
        'xpub661MyMwAqRbcEqNh81TVVceUDNF6yg7F63H9j3xMQj8GDdDVRLCFoPughSdgGs4X1n89iPXFKPMy3f45Y7E63kXGAZKuZ1fhLqsKtkoB3yZ'
      );
      tAvaxKeyPair.should.deepEqual(avaxKeyPair);
    });
  });

  describe('keys validations success cases', () => {
    it('validate valid eth uncompressed public key', () => {
      const uncompressedPublicKey =
        '043BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E227874E8075353564D83047566EEA6CF5A7313816AF004DDA8CA529DE8C94BC6A';
      tavaxCoin.isValidPub(uncompressedPublicKey).should.be.true();
      avaxCoin.isValidPub(uncompressedPublicKey).should.be.true();
    });

    it('validate valid eth compressed public key', () => {
      const compressedPublicKey = '023BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E2';
      tavaxCoin.isValidPub(compressedPublicKey).should.be.true();
      avaxCoin.isValidPub(compressedPublicKey).should.be.true();
    });

    it('validate valid extended public key', () => {
      const extendedPublicKey =
        'xpub661MyMwAqRbcEqNh81TVVceUDNF6yg7F63H9j3xMQj8GDdDVRLCFoPughSdgGs4X1n89iPXFKPMy3f45Y7E63kXGAZKuZ1fhLqsKtkoB3yZ';
      tavaxCoin.isValidPub(extendedPublicKey).should.be.true();
      avaxCoin.isValidPub(extendedPublicKey).should.be.true();
    });

    it('validate valid eth address', () => {
      const address = '0x1374a2046661f914d1687d85dbbceb9ac7910a29';
      tavaxCoin.isValidAddress(address).should.be.true();
      avaxCoin.isValidAddress(address).should.be.true();
    });
  });

  describe('keys validations failure cases', () => {
    it('validate empty eth public key', () => {
      tavaxCoin.isValidPub('').should.be.false();
      avaxCoin.isValidPub('').should.be.false();

      tavaxCoin.isValidPub(undefined).should.be.false();
      avaxCoin.isValidPub(undefined).should.be.false();
    });

    it('validate empty eth address', () => {
      tavaxCoin.isValidAddress(undefined).should.be.false();
      avaxCoin.isValidAddress(undefined).should.be.false();
    });

    it('validate eth uncompressed public key too short', () => {
      const uncompressedPublicKey =
        '043BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E227874E8075353564D83047566EEA6CF5A7313816AF004DDA8CA529DE8C94BC6A';

      tavaxCoin.isValidPub(uncompressedPublicKey.slice(1)).should.be.false();
      avaxCoin.isValidPub(uncompressedPublicKey.slice(1)).should.be.false();
    });

    it('validate eth compressed public key too short', () => {
      const compressedPublicKey = '023BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E2';

      tavaxCoin.isValidPub(compressedPublicKey.slice(1)).should.be.false();
      avaxCoin.isValidPub(compressedPublicKey.slice(1)).should.be.false();
    });

    it('validate invalid extended private key', () => {
      const extendedPublicKey =
        'xpub661MyMwAqRbcEqNh81TVVceUDNF6yg7F63H9j3xMQj8GDdDVRLCFoPughSdgGs4X1n89iPXFKPMy3f45Y7E63kXGAZKuZ1fhLqsKtkoB3yZ';

      tavaxCoin.isValidPub(extendedPublicKey.substr(0, extendedPublicKey.length - 1)).should.be.false();
      avaxCoin.isValidPub(extendedPublicKey.substr(0, extendedPublicKey.length - 1)).should.be.false();
    });

    it('validate eth address too short', () => {
      const address = '0x1374a2046661f914d1687d85dbbceb9ac7910a29';

      tavaxCoin.isValidAddress(address.slice(1)).should.be.false();
      avaxCoin.isValidAddress(address.slice(1)).should.be.false();
    });

    it('validate eth uncompressed public key too long', () => {
      const uncompressedPublicKey =
        '043BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E227874E8075353564D83047566EEA6CF5A7313816AF004DDA8CA529DE8C94BC6A';

      tavaxCoin.isValidPub(uncompressedPublicKey + '00').should.be.false();
      avaxCoin.isValidPub(uncompressedPublicKey + '00').should.be.false();
    });

    it('validate eth compressed public key too long', () => {
      const compressedPublicKey = '023BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E2';

      tavaxCoin.isValidPub(compressedPublicKey + '00').should.be.false();
      avaxCoin.isValidPub(compressedPublicKey + '00').should.be.false();
    });

    it('validate extended public key too long', () => {
      const extendedPublicKey =
        'xpub661MyMwAqRbcEqNh81TVVceUDNF6yg7F63H9j3xMQj8GDdDVRLCFoPughSdgGs4X1n89iPXFKPMy3f45Y7E63kXGAZKuZ1fhLqsKtkoB3yZ';

      tavaxCoin.isValidPub(extendedPublicKey + '00').should.be.false();
      avaxCoin.isValidPub(extendedPublicKey + '00').should.be.false();
    });

    it('validate eth address too long', () => {
      const address = '0x1374a2046661f914d1687d85dbbceb9ac7910a29';

      tavaxCoin.isValidAddress(address + '00').should.be.false();
      avaxCoin.isValidAddress(address + '00').should.be.false();
    });
  });

  describe('Sign Transaction', () => {
    const account_1 = {
      address: '0xeeaf0F05f37891ab4a21208B105A0687d12c5aF7',
      owner_1: '4ee089aceabf3ddbf748db79b1066c33b7d3ea1ab3eb7e325121bba2bff2f5ca',
      owner_2: '5ca116d25aec5f765465432cc421ff25ef9ffdc330b10bb3d9ad61e3baad88d7',
      owner_3: '1fae946cc84af8bd74d610a88537e24e19c3349d478d86fc5bb59ba4c88fb9cc',
    };

    const account_2 = {
      address: '0x8Ce59c2d1702844F8EdED451AA103961bC37B4e8',
      owner_1: '4ee089aceabf3ddbf748db79b1066c33b7d3ea1ab3eb7e325121bba2bff2f5ca',
      owner_2: '5c7e4efff7304d4dfff6d5f1591844ec6f2adfa6a47e9fece6a3c1a4d755f1e3',
      owner_3: '4421ab25dd91e1a3180d03d57c323a7886dcc313d3b3a4b4256a5791572bf597',
    };

    it('should sign an unsigned test tx', async function () {
      const builder = getBuilder('tavaxc') as TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      builder.counter(1);
      builder.type(TransactionType.Send);
      builder.contract(account_1.address);
      builder.transfer().amount('1').to(account_2.address).expirationTime(10000).contractSequenceId(1);

      const unsignedTx = await builder.build();
      const unsignedTxForBroadcasting = unsignedTx.toBroadcastFormat();

      const halfSignedRawTx = await tavaxCoin.signTransaction({
        txPrebuild: {
          txHex: unsignedTxForBroadcasting,
        },
        prv: account_1.owner_2,
      });

      builder.transfer().key(account_1.owner_2);
      const halfSignedTx = await builder.build();
      const halfSignedTxForBroadcasting = halfSignedTx.toBroadcastFormat();

      halfSignedRawTx.halfSigned.txHex.should.equals(halfSignedTxForBroadcasting);
      halfSignedRawTx.halfSigned.recipients.length.should.equals(1);
      halfSignedRawTx.halfSigned.recipients[0].address.toLowerCase().should.equals(account_2.address.toLowerCase());
      halfSignedRawTx.halfSigned.recipients[0].amount.toLowerCase().should.equals('1');
    });

    it('should sign an unsigned test tx with eip1559', async function () {
      const builder = getBuilder('tavaxc') as TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
        eip1559: {
          maxFeePerGas: '7593123',
          maxPriorityFeePerGas: '150',
        },
      });
      builder.counter(1);
      builder.type(TransactionType.Send);
      builder.contract(account_1.address);
      builder.transfer().amount('1').to(account_2.address).expirationTime(10000).contractSequenceId(1);

      const unsignedTx = await builder.build();
      const unsignedTxForBroadcasting = unsignedTx.toBroadcastFormat();

      const halfSignedRawTx = await tavaxCoin.signTransaction({
        txPrebuild: {
          txHex: unsignedTxForBroadcasting,
          eip1559: {
            maxFeePerGas: '7593123',
            maxPriorityFeePerGas: '150',
          },
        },
        prv: account_1.owner_2,
      });

      builder.transfer().key(account_1.owner_2);
      const halfSignedTx = await builder.build();
      const halfSignedTxForBroadcasting = halfSignedTx.toBroadcastFormat();

      halfSignedRawTx.halfSigned.txHex.should.equals(halfSignedTxForBroadcasting);
      halfSignedRawTx.halfSigned.recipients.length.should.equals(1);
      halfSignedRawTx.halfSigned.recipients[0].address.toLowerCase().should.equals(account_2.address.toLowerCase());
      halfSignedRawTx.halfSigned.recipients[0].amount.toLowerCase().should.equals('1');
      halfSignedRawTx.halfSigned.eip1559.maxFeePerGas.should.equal('7593123');
      halfSignedRawTx.halfSigned.eip1559.maxPriorityFeePerGas.should.equal('150');
    });

    it('should sign an unsigned mainnet tx', async function () {
      const builder = getBuilder('avaxc') as TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      builder.counter(1);
      builder.type(TransactionType.Send);
      builder.contract(account_1.address);
      builder.transfer().amount('1').to(account_2.address).expirationTime(10000).contractSequenceId(1);

      const unsignedTx = await builder.build();
      const unsignedTxForBroadcasting = unsignedTx.toBroadcastFormat();

      const halfSignedRawTx = await avaxCoin.signTransaction({
        txPrebuild: {
          txHex: unsignedTxForBroadcasting,
        },
        prv: account_1.owner_2,
      });

      builder.transfer().key(account_1.owner_2);
      const halfSignedTx = await builder.build();
      const halfSignedTxForBroadcasting = halfSignedTx.toBroadcastFormat();

      halfSignedRawTx.halfSigned.txHex.should.equals(halfSignedTxForBroadcasting);
      halfSignedRawTx.halfSigned.recipients.length.should.equals(1);
      halfSignedRawTx.halfSigned.recipients[0].address.toLowerCase().should.equals(account_2.address.toLowerCase());
      halfSignedRawTx.halfSigned.recipients[0].amount.toLowerCase().should.equals('1');
    });
  });

  describe('Transaction Verification', () => {
    it('should verify a hop txPrebuild from the bitgo server that matches the client txParams', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [{ amount: 1000000000000000, address: hopDestinationAddress }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
        hop: true,
      };

      const txPrebuild = {
        recipients: [{ amount: '5000000000000000', address: hopContractAddress }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tavaxc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        hopTransaction: {
          tx: hopTx,
          id: hopTxid,
          signature: hopTxBitgoSignature,
          paymentId: '2773928196',
          gasPrice: 20000000000,
          gasLimit: 500000,
          amount: '1000000000000000',
          recipient: hopDestinationAddress,
          nonce: 0,
          userReqSig: userReqSig,
          gasPriceMax: 500000000000,
        },
      };

      const verification = {};

      const isTransactionVerified = await tavaxCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should reject when client txParams are missing', async function () {
      const coin = bitgo.coin('teth');
      const wallet = new Wallet(bitgo, coin, {});

      const txParams = null;

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tavaxc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await coin
        .verifyTransaction({ txParams: txParams as any, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('missing params');
    });

    it('should reject txPrebuild that is both batch and hop', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [
          { amount: '1000000000000', address: address1 },
          { amount: '2500000000000', address: address2 },
        ],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
        hop: true,
      };

      const txPrebuild = {
        recipients: [{ amount: '3500000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'tavaxc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        hopTransaction: {
          tx: hopTx,
          id: hopTxid,
          signature: hopTxBitgoSignature,
          paymentId: '2773928196',
          gasPrice: 20000000000,
          gasLimit: 500000,
          amount: '1000000000000000',
          recipient: hopDestinationAddress,
          nonce: 0,
          userReqSig: userReqSig,
          gasPriceMax: 500000000000,
        },
      };

      const verification = {};

      await tavaxCoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('tx cannot be both a batch and hop transaction');
    });

    it('should reject a txPrebuild with more than one recipient', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [
          { amount: '1000000000000', address: address1 },
          { amount: '2500000000000', address: address2 },
        ],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [
          { amount: '1000000000000', address: address1 },
          { amount: '2500000000000', address: address2 },
        ],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'tavaxc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await tavaxCoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('txPrebuild should only have 1 recipient but 2 found');
    });

    it('should reject a hop txPrebuild that does not send to its hop address', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000000', address: hopDestinationAddress }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
        hop: true,
      };

      const txPrebuild = {
        recipients: [{ amount: '5000000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tavaxc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        hopTransaction: {
          tx: hopTx,
          id: hopTxid,
          signature: hopTxBitgoSignature,
          paymentId: '0',
          gasPrice: 20000000000,
          gasLimit: 500000,
          amount: '1000000000000000',
          recipient: hopDestinationAddress,
          nonce: 0,
          userReqSig: userReqSig,
          gasPriceMax: 500000000000,
        },
      };

      const verification = {};

      await tavaxCoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('recipient address of txPrebuild does not match hop address');
    });

    it('should reject a normal txPrebuild from the bitgo server with the wrong amount', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '2000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tavaxc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await tavaxCoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith(
          'normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
    });

    it('should reject a normal txPrebuild from the bitgo server with the wrong recipient', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address2 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tavaxc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await tavaxCoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith(
          'destination address in normal txPrebuild does not match that in txParams supplied by client'
        );
    });

    it('should verify a token txPrebuild from the bitgo server that matches the client txParams', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tavaxc',
        token: 'test',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      const isTransactionVerified = await tavaxCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should reject a txPrebuild from the bitgo server with the wrong coin', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'btc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await tavaxCoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('coin in txPrebuild did not match that in txParams supplied by client');
    });
  });

  // TODO(BG-56136): move to modules/bitgo/test/v2/integration/coins/avaxc.ts
  describe('Recovery', function () {
    describe('Non-BitGo', async function () {
      it('should error when the backup key is unfunded (cannot pay gas)', async function () {
        await tavaxCoin
          .recover({
            userKey:
              '{"iv":"ntd9/urFjryqxd4rzREB2Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
              ':"ccm","adata":"","cipher":"aes","salt":"LTqZ47b1BwE=","ct":"JSbJIBTkHoKR3L\n' +
              'oT2QTkDx3X1OBIPxiSL6WoMiIrKA+aKTgmutXnWC2GTEIyfbLeajw6D2UZ+U0Y8viv7mgITgSz1\n' +
              'u9Gdj97Btm8WsZ0e+KmsbdB/gYucCZoPUZCFqG4bEkdfZ8ZvDI9XvVv4xPzNb/AoSijosA="}',
            backupKey:
              '{"iv":"Axs+G9gsZ5PENUHx1YY5cg==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
              ':"ccm","adata":"","cipher":"aes","salt":"awQshUvFi7Q=","ct":"sWQ0bHmruUTI8C\n' +
              'lwGneHObdNfo3WQ/mrz3p84Fo07HgizvgLd+E3wFA3Z1LRbHozRjfstV/qJMRqrFvEgKOcG+SKd\n' +
              'gx6BbmXWfKhFHEerSYluBgU5OrXMfOkbExnMywEWrCKEvoNL+wyNHoRaMNbbDogo36J8PE="}',
            walletContractAddress: '0x22c1ab44371985e49294d1a40e92c8ad00f5be8e',
            // walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
            walletPassphrase: 'Ghghjkg!455544llll',
            recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
          })
          .should.be.rejectedWith(
            'Backup key address 0xdfd95d01fc9c2cb744e2852256385bbe6d87b72b has balance 0 Gwei.This address must have a balance of at least 10000000 Gwei to perform recoveries. Try sending some AVAX to this address then retry.'
          );
      });

      it('should build recovery tx', async function () {
        const recovery = await tavaxCoin.recover({
          userKey:
            '{"iv":"o27pBl7IP+ibe39xYg/cXg==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
            ':"ccm","adata":"","cipher":"aes","salt":"992R6padf2I=","ct":"6wkn1PdwtWcCWR\n' +
            'VdOdaiGMCMS5RhurGI9eF4tdgzaMzOpgw56eYRmKTzldj5Vh1Cnz6RoqFlVSfnwR+tFjOyqDn3O\n' +
            '8K3NUD5YlMGoCdfvcrCbPF3tCdKl2DyoLv+ZWPo5sKVjjgUOZgI7pn7iBtXRDvqaWylawY="}',
          backupKey:
            '{"iv":"mwj9ld8svgRBsWS+5NZQqA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
            ':"ccm","adata":"","cipher":"aes","salt":"XuMxbqa/yNg=","ct":"lqLnjsVSBR/4ue\n' +
            'ztYahAvEEV+ltDXLoyIEMCmFMycba+3mPtiAM8HrF/84AzJOjwKyvK1pm+CFuuWCTXssAQxRCuc\n' +
            'HujrBvrKunY4hfIJHJsyBr+l1PNNSUB/aYL1aW/n7tdvwL8fOCNqFqEPBCbxXoOlSgCAUw="}',
          walletContractAddress: '0xe0b1fe098050f2745b450de419b5cafc7e826699',
          walletPassphrase: 'Ghghjkg!455544llll',
          recoveryDestination: '0xb5bff3a87cd71d2ed96ce41d05e6206600802854',
          gasPrice: '30000000000',
        });

        // id and tx will always be different because of expireTime
        recovery.should.not.be.undefined();
        recovery.should.have.property('id');
        recovery.should.have.property('tx');
      });
    });

    describe('Unsigned Sweep', function () {
      const walletContractAddress = '0xe0b1fe098050f2745b450de419b5cafc7e826699';

      it('should build unsigned sweep tx', async function () {
        const recoveryDestination = '0xb5bff3a87cd71d2ed96ce41d05e6206600802854';
        const recovery = await tavaxCoin.recover({
          userKey:
            'xpub661MyMwAqRbcG9dxXhJyHz4GjqTjUCAUMuF4tpCq3LTJf43QXa5sT81QsJ5VMdK8vnAK56gi7qy2cZ2dzYQfy7YP7x4uHQpuRViAv9CNbtS',
          backupKey:
            'xpub661MyMwAqRbcGrB1HmLowEQgbVxCPomJHWAkvundcB5gGteXtLLfEKmvSB9dKvRmh3LxpL2yvgqy37Z3ydqvHoViMWa2dwX3huwmmBuip7J',
          walletContractAddress,
          walletPassphrase: 'Ghghjkg!455544llll',
          recoveryDestination,
          gasPrice: '30000000000',
        });

        // id and tx will always be different because of expireTime
        recovery.should.not.be.undefined();
        recovery.should.have.properties('tx', 'userKey', 'backupKey');
        recovery.recipients.length.should.equal(1);
        recovery.recipients[0].address.should.equal(recoveryDestination);
        recovery.walletContractAddress.should.equal(walletContractAddress);
      });

      it('should add a second signature', async function () {
        // const txPrebuild = {
        //   txHex: '0xf9024e808506fc23ac008307a12094e0b1fe098050f2745b450de419b5cafc7e82669980b9022439125215000000000000000000000000b5bff3a87cd71d2ed96ce41d05e6206600802854000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000631905fa00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010439125215000000000000000000000000b5bff3a87cd71d2ed96ce41d05e6206600802854000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000631905fa000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830150f58080',
        //   userKey: 'xpub661MyMwAqRbcG9dxXhJyHz4GjqTjUCAUMuF4tpCq3LTJf43QXa5sT81QsJ5VMdK8vnAK56gi7qy2cZ2dzYQfy7YP7x4uHQpuRViAv9CNbtS',
        //   backupKey: 'xpub661MyMwAqRbcGrB1HmLowEQgbVxCPomJHWAkvundcB5gGteXtLLfEKmvSB9dKvRmh3LxpL2yvgqy37Z3ydqvHoViMWa2dwX3huwmmBuip7J',
        //   coin: 'tavaxc',
        //   gasPrice: '30000000000',
        //   gasLimit: '500000',
        //   recipients: [{
        //     "address": "0xb5bff3a87cd71d2ed96ce41d05e6206600802854",
        //     "amount": "0"
        //   }],
        //   walletContractAddress: '0xe0b1fe098050f2745b450de419b5cafc7e826699',
        //   amount: '0',
        //   backupKeyNonce: 0,
        //   expireTime: 1600800540,
        //   contractSequenceId: 1,
        //   nextContractSequenceId: 1,
        // };
        const txPrebuild = {
          // tx: "0xf9024e808506fc23ac008307a12094e0b1fe098050f2745b450de419b5cafc7e82669980b9022439125215000000000000000000000000b5bff3a87cd71d2ed96ce41d05e6206600802854000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000631a172300000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010439125215000000000000000000000000b5bff3a87cd71d2ed96ce41d05e6206600802854000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000631a1723000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830150f58080",
          txHex:
            '0xf9024e808506fc23ac008307a12094e0b1fe098050f2745b450de419b5cafc7e82669980b9022439125215000000000000000000000000b5bff3a87cd71d2ed96ce41d05e6206600802854000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000631a172300000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010439125215000000000000000000000000b5bff3a87cd71d2ed96ce41d05e6206600802854000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000631a1723000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830150f58080',
          userKey:
            'xpub661MyMwAqRbcG9dxXhJyHz4GjqTjUCAUMuF4tpCq3LTJf43QXa5sT81QsJ5VMdK8vnAK56gi7qy2cZ2dzYQfy7YP7x4uHQpuRViAv9CNbtS',
          backupKey:
            'xpub661MyMwAqRbcGrB1HmLowEQgbVxCPomJHWAkvundcB5gGteXtLLfEKmvSB9dKvRmh3LxpL2yvgqy37Z3ydqvHoViMWa2dwX3huwmmBuip7J',
          coin: 'tavaxc',
          gasPrice: '30000000000',
          gasLimit: '500000',
          recipients: [
            {
              address: '0xb5bff3a87cd71d2ed96ce41d05e6206600802854',
              amount: '0',
            },
          ],
          walletContractAddress: '0xe0b1fe098050f2745b450de419b5cafc7e826699',
          amount: '0',
          backupKeyNonce: 0,
          recipient: {
            address: '0xb5bff3a87cd71d2ed96ce41d05e6206600802854',
            amount: '0',
          },
          expireTime: 1662654243,
          contractSequenceId: 3,
          nextContractSequenceId: 3,
        };
        const gasPrice = 300000000000;
        const gasLimit = 500000;
        // const prv = 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2'; // placeholder test prv
        const userPrv =
          'xprv9s21ZrQH143K3fZVRfmxvr7YBodF4jSczgKU6RoDUzvKnFiFz2mcuKgw1zYgvTGtLMBPAPonv5GzHnDXQK5Vk8BRHcN76TGgLwcNcFTy4kC';
        const backupPrv =
          'xprv9s21ZrQH143K4N6YBjooa6Tx3U7hzM3SvHFA8XP23qYhQ6KPLo2QgXTSasVpiMY4F6gMrstXBHRDso5WE7Gn37yZnW5qTRJZU6FPeXx1B69';
        const params = {
          txPrebuild,
          prv: userPrv,
        };
        // sign transaction once
        const halfSigned = await tavaxCoin.signTransaction(params);

        const wrapper = {} as AvaxSignTransactionOptions;
        wrapper.txPrebuild = halfSigned;
        wrapper.txPrebuild.recipients = halfSigned.halfSigned.recipients;
        wrapper.txPrebuild.gasPrice = gasPrice.toString();
        wrapper.txPrebuild.gasLimit = gasLimit.toString();
        wrapper.isLastSignature = true;
        wrapper.walletContractAddress = walletContractAddress;
        wrapper.prv = backupPrv;

        // sign transaction twice with the "isLastSignature" flag
        const finalSignedTx = await tavaxCoin.signTransaction(wrapper);
        finalSignedTx.should.have.property('txHex');
        const txBuilder = tavaxCoin.getTransactionBuilder() as TransactionBuilder;
        txBuilder.from(finalSignedTx.txHex);
        const rebuiltTx = await txBuilder.build();
        rebuiltTx.signature.length.should.equal(2);
        outputs.length.should.equal(1);
        outputs[0].address.should.equal(txPrebuild.recipients[0].address);
        outputs[0].amount.should.equal(txPrebuild.recipients[0].amount);
      });
    });
  });
});
