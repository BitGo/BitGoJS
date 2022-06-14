import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { AvaxC, TavaxC } from '../../../../src/v2/coins';
import { getBuilder, AvaxC as AvaxCAccountLib } from '@bitgo/account-lib';
import * as secp256k1 from 'secp256k1';
import * as bip32 from 'bip32';
import * as nock from 'nock';
import { common, TransactionType, Wallet } from '@bitgo/sdk-core';

nock.enableNetConnect();

describe('Avalanche C-Chain', function () {
  let bitgo;
  let tavaxCoin;
  let avaxCoin;
  let hopTxBitgoSignature;

  const address1 = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const address2 = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
  const hopContractAddress = '0x47ce7cc86efefef19f8fb516b11735d183da8635';
  const hopDestinationAddress = '0x9c7e8ce6825bD48278B3Ab59228EE26f8BE7925b';
  const hopTx = '0xf86b808504a817c8ff8252ff949c7e8ce6825bd48278b3ab59228ee26f8be7925b87038d7ea4c68000801ca011bc22c664570133dfca4f08a0b8d02339cf467046d6a4152f04f368d0eaf99ea01d6dc5cf0c897c8d4c3e1df53d0d042784c424536a4cc5b802552b7d64fee8b5';
  const hopTxid = '0x4af65143bc77da2b50f35b3d13cacb4db18f026bf84bc0743550bc57b9b53351';
  const userReqSig = '0x404db307f6147f0d8cd338c34c13906ef46a6faa7e0e119d5194ef05aec16e6f3d710f9b7901460f97e924066b62efd74443bd34402c6d40b49c203a559ff2c8';


  before(function () {
    const bitgoKeyXprv = 'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    hopTxBitgoSignature = '0xaa' + Buffer.from(secp256k1.ecdsaSign(Buffer.from(hopTxid.slice(2), 'hex'), bitgoKey.privateKey).signature).toString('hex');

    const env = 'test';
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
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

  describe('Instantiate', () => {
    it('should instantiate the coin', function () {
      let localBasecoin = bitgo.coin('tavaxc');
      localBasecoin.should.be.an.instanceof(TavaxC);

      localBasecoin = bitgo.coin('avaxc');
      localBasecoin.should.be.an.instanceof(AvaxC);
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
      tAvaxKeyPair.prv.should.equals('xprv9s21ZrQH143K2MJE1yvV8UhjfLQcaDPPipMYvfYjrPbHLptLsnt1FbbCrCT9E5LCmRrS593YZ1CKgf3rf3C2hYTynZN5au3VvBvLcWh8sV2');
      tAvaxKeyPair.pub!.should.equals('xpub661MyMwAqRbcEqNh81TVVceUDNF6yg7F63H9j3xMQj8GDdDVRLCFoPughSdgGs4X1n89iPXFKPMy3f45Y7E63kXGAZKuZ1fhLqsKtkoB3yZ');
      tAvaxKeyPair.should.deepEqual(avaxKeyPair);
    });
  });

  describe('keys validations success cases', () => {

    it('validate valid eth uncompressed public key', () => {
      const uncompressedPublicKey = '043BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E227874E8075353564D83047566EEA6CF5A7313816AF004DDA8CA529DE8C94BC6A';
      tavaxCoin.isValidPub(uncompressedPublicKey).should.be.true();
      avaxCoin.isValidPub(uncompressedPublicKey).should.be.true();
    });

    it('validate valid eth compressed public key', () => {
      const compressedPublicKey = '023BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E2';
      tavaxCoin.isValidPub(compressedPublicKey).should.be.true();
      avaxCoin.isValidPub(compressedPublicKey).should.be.true();
    });

    it('validate valid extended public key', () => {
      const extendedPublicKey = 'xpub661MyMwAqRbcEqNh81TVVceUDNF6yg7F63H9j3xMQj8GDdDVRLCFoPughSdgGs4X1n89iPXFKPMy3f45Y7E63kXGAZKuZ1fhLqsKtkoB3yZ';
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
      const uncompressedPublicKey = '043BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E227874E8075353564D83047566EEA6CF5A7313816AF004DDA8CA529DE8C94BC6A';

      tavaxCoin.isValidPub(uncompressedPublicKey.slice(1)).should.be.false();
      avaxCoin.isValidPub(uncompressedPublicKey.slice(1)).should.be.false();
    });

    it('validate eth compressed public key too short', () => {
      const compressedPublicKey = '023BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E2';

      tavaxCoin.isValidPub(compressedPublicKey.slice(1)).should.be.false();
      avaxCoin.isValidPub(compressedPublicKey.slice(1)).should.be.false();
    });

    it('validate invalid extended private key', () => {
      const extendedPublicKey = 'xpub661MyMwAqRbcEqNh81TVVceUDNF6yg7F63H9j3xMQj8GDdDVRLCFoPughSdgGs4X1n89iPXFKPMy3f45Y7E63kXGAZKuZ1fhLqsKtkoB3yZ';

      tavaxCoin.isValidPub(extendedPublicKey.substr(0, extendedPublicKey.length - 1)).should.be.false();
      avaxCoin.isValidPub(extendedPublicKey.substr(0, extendedPublicKey.length - 1)).should.be.false();
    });

    it('validate eth address too short', () => {
      const address = '0x1374a2046661f914d1687d85dbbceb9ac7910a29';

      tavaxCoin.isValidAddress(address.slice(1)).should.be.false();
      avaxCoin.isValidAddress(address.slice(1)).should.be.false();
    });

    it('validate eth uncompressed public key too long', () => {
      const uncompressedPublicKey = '043BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E227874E8075353564D83047566EEA6CF5A7313816AF004DDA8CA529DE8C94BC6A';

      tavaxCoin.isValidPub(uncompressedPublicKey + '00').should.be.false();
      avaxCoin.isValidPub(uncompressedPublicKey + '00').should.be.false();
    });

    it('validate eth compressed public key too long', () => {
      const compressedPublicKey = '023BE650E2C11F36D201C9173BE37BC028AF495CF78CA05F78FEE192F5D339A9E2';

      tavaxCoin.isValidPub(compressedPublicKey + '00').should.be.false();
      avaxCoin.isValidPub(compressedPublicKey + '00').should.be.false();
    });

    it('validate extended public key too long', () => {
      const extendedPublicKey = 'xpub661MyMwAqRbcEqNh81TVVceUDNF6yg7F63H9j3xMQj8GDdDVRLCFoPughSdgGs4X1n89iPXFKPMy3f45Y7E63kXGAZKuZ1fhLqsKtkoB3yZ';

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

      const builder = getBuilder('tavaxc') as AvaxCAccountLib.TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      builder.counter(1);
      builder.type(TransactionType.Send);
      builder.contract(account_1.address);
      builder
        .transfer()
        .amount('1')
        .to(account_2.address)
        .expirationTime(10000)
        .contractSequenceId(1);

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

      const builder = getBuilder('tavaxc') as AvaxCAccountLib.TransactionBuilder;
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
      builder
        .transfer()
        .amount('1')
        .to(account_2.address)
        .expirationTime(10000)
        .contractSequenceId(1);

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

      const builder = getBuilder('avaxc') as AvaxCAccountLib.TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      builder.counter(1);
      builder.type(TransactionType.Send);
      builder.contract(account_1.address);
      builder
        .transfer()
        .amount('1')
        .to(account_2.address)
        .expirationTime(10000)
        .contractSequenceId(1);

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

      await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('missing params');
    });

    it('should reject txPrebuild that is both batch and hop', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }, { amount: '2500000000000', address: address2 }],
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

      await tavaxCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('tx cannot be both a batch and hop transaction');
    });

    it('should reject a txPrebuild with more than one recipient', async function () {
      const wallet = new Wallet(bitgo, tavaxCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }, { amount: '2500000000000', address: address2 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }, { amount: '2500000000000', address: address2 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'tavaxc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await tavaxCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
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

      await tavaxCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
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

      await tavaxCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client');
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

      await tavaxCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('destination address in normal txPrebuild does not match that in txParams supplied by client');
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

      await tavaxCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('coin in txPrebuild did not match that in txParams supplied by client');
    });
  });
});
