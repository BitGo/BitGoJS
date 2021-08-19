import { TestBitGo } from '../../../lib/test_bitgo';
import { AvaxC, TavaxC } from '../../../../src/v2/coins';
import { getBuilder, AvaxC as AvaxCAccountLib, BaseCoin } from '@bitgo/account-lib';

describe('Avalanche C-Chain', function () {
  let bitgo;
  let tavaxCoin;
  let avaxCoin;

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
  });

  beforeEach(() => {
    tavaxCoin = bitgo.coin('tavaxc') as TavaxC;
    avaxCoin = bitgo.coin('avaxc') as AvaxC;
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
      builder.type(BaseCoin.TransactionType.Send);
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

    it('should sign an unsigned mainnet tx', async function () {

      const builder = getBuilder('avaxc') as AvaxCAccountLib.TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      builder.counter(1);
      builder.type(BaseCoin.TransactionType.Send);
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
});
