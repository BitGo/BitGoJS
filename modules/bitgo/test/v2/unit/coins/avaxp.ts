import { TestBitGo } from '../../../lib/test_bitgo';
import { AvaxP, TavaxP } from '../../../../src/v2/coins';
import { getBuilder, AvaxP as AvaxPAccountLib, BaseCoin } from '@bitgo/account-lib';
import * as secp256k1 from 'secp256k1';
import * as bip32 from 'bip32';
import { Wallet } from '../../../../src';
import * as nock from 'nock';
import { common } from '@bitgo/sdk-core';

nock.enableNetConnect();

describe('Avalanche P-Chain', function () {
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
    bitgo = new TestBitGo({ env: 'test' });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo.initializeTestVars();
  });

  beforeEach(() => {
    tavaxCoin = bitgo.coin('tavaxp') as TavaxP;
    avaxCoin = bitgo.coin('avaxp') as AvaxP;
  });

  after(function () {
    nock.cleanAll();
  });

  describe('Instantiate', () => {
    it('should instantiate the coin', function () {
      let localBasecoin = bitgo.coin('tavaxp');
      localBasecoin.should.be.an.instanceof(TavaxP);

      localBasecoin = bitgo.coin('avaxp');
      localBasecoin.should.be.an.instanceof(AvaxP);
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
});
