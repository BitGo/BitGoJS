const EC = require('elliptic').ec;
import { TransferContract, AccountPermissionUpdateContract } from '../../../../src/coin/trx/iface';
import { Utils } from '../../../../src/coin/trx/index';

import * as should from 'should';
import { UnsignedTransferContractTx, SignedAccountPermissionUpdateContractTx } from '../../../resources/trx';

describe('Util library should', function() {
  // arbitrary text
  const arr = [ 127, 255, 31, 192, 3, 126, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
  const hex = '7FFF1FC0037E0000000000000000000000000000000000000000000000000000';
  const txt = 'arbitrary string to sign';
  const signedString = '0x9424113f32c17b6ffbeee024e1a54b6991d756e82f66cca16a41231fdfa270d03b08e833f5dbbd5cc86896c2e5ea6c74d2e292cda21f717164f994fcdf28486d1b';

  // prv-pub-address hex
  const prv = 'FB3AA887E0BE3FAC9D75E661DAFF4A7FE0E91AAB13DA9775CD8586D7CB9B7640';
  const pub = '046EBFB90C396B4A3B992B727CB4714A32E2A6DE43FDB3EC266286AC2246D8FD1E23E12C0DEB752C631A9011BBF8B56E2FBAA20E99D3952F0A558D11F96E7C1C5D';
  const addressHex = '412C2BA4A9FF6C53207DC5B686BFECF75EA7B80577';
  const base58 = 'TDzm1tCXM2YS1PDa3GoXSvxdy4AgwVbBPE';
  const addrBytes = [ 65, 44, 43, 164, 169, 255, 108, 83, 32, 125, 197, 182,134,191,236,247,94,167,184,5,119 ];

  it('generate a valid account', () => {
    const seed = Buffer.alloc(32);
    const account = Utils.generateAccount(seed);
    account.privateKey.should.equal('82A34E3867EA7EA4E67E27865D500AE84E98D07AB1BAB06526F0A5A5FDCC3EBA');
    account.publicKey.should.equal('04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355');
    account.address.base58.should.equal('TXQo5GgQQJYVzreX5yzqqVnzBQP5Ek2iQW');
    account.address.hex.should.equal('41EB317B9F2E0891D66C061DDC3F5EE7ED42D70A44');
  });

  it('generate a valid random account when no seed is provided', () => {
    const account = Utils.generateAccount();
    should.exists(account.privateKey);
    should.exists(account.publicKey);
    should.exists(account.address.base58);
    should.exists(account.address.hex);

    validateKeyPair(account.publicKey, account.privateKey).should.be.true();
  });

  it('should fail to create an account with an invalid seed', () => {
    const seed = Buffer.alloc(8); //  Seed should be at least 128 bits, 16 bytes
    should.throws(() => Utils.generateAccount(seed));
  });

  // tx information
  it('be able to convert hex to bytes', () => {
    const ba = Utils.getByteArrayFromHexAddress(hex);
    should.deepEqual(ba, arr);
  });

  it('be able to convert hex to bytes', () => {
    const hs = Utils.getHexAddressFromByteArray(arr);
    should.equal(hs, hex);
  });

  it('get a pub from a prv', () => {
    const derivedPub = Utils.getPubKeyFromPriKey(Buffer.from(prv, 'hex'));
    const derivedPubHex = Utils.getHexAddressFromByteArray(derivedPub);
    should.equal(derivedPubHex, pub);
  });

  it('get an hex address from a prv', () => {
    const addr = Utils.getAddressFromPriKey(Buffer.from(prv, 'hex'));
    const hexAddr = Utils.getHexAddressFromByteArray(addr);
    should.equal(hexAddr, addressHex);
  });

  it('get an base58 address', () => {
    const addr = Utils.getAddressFromPriKey(Buffer.from(prv, 'hex'));
    const addr58 = Utils.getBase58AddressFromByteArray(addr);
    should.equal(addr58, base58);
  });

  it('get an base58 address from hex', () => {
    const addr58 = Utils.getBase58AddressFromHex(addressHex);
    should.equal(addr58, base58);
  });

  it('get hex from base58 address', () => {
    const hexAddr = Utils.getHexAddressFromBase58Address(base58);
    should.equal(hexAddr, addressHex);
  });

  it('validate a hex string', () => {
    const hex = ['0xaffd', '0x11'];
    hex.map((hex) => { should(Utils.isValidHex(hex)).ok(); });

    const invalidHex = ['0xa11', '0xFFdYYY', '0x', ''];
    invalidHex.map((hex) => { should(Utils.isValidHex(hex)).equal(false); });
  });

  it('sign a string', () => {
    const hexText = Buffer.from(txt).toString('hex');
    const prvArray = Utils.getByteArrayFromHexAddress(prv);
    const signed = Utils.signString(hexText, prvArray);

    should.equal(signedString, signed);
  });

  it('should calculate an address from a pub', () => {
    const pubBytes = Utils.getByteArrayFromHexAddress(pub);
    const bytes = Utils.getRawAddressFromPubKey(pubBytes);
    should.deepEqual(bytes, addrBytes);
  });

  it('should verify a signed message', () => {
    const hexEncodedMessage = Buffer.from(txt).toString('hex');
    should.ok(Utils.verifySignature(hexEncodedMessage, base58, signedString, true));
  });

  it('should fail to verify a signed message if the message is not in hex', () => {
    should.throws(() => Utils.verifySignature(txt, base58, signedString, true));
  });

  it('should fail to verify a signed message if the address is not in base58', () => {
    const hexEncodedString = Buffer.from(txt).toString('hex');
    should.throws(() => Utils.verifySignature(hexEncodedString, addressHex, signedString, true));
  });

  it('should fail to verify a signed message if the signature is not in hex', () => {
    const hexEncodedString = Buffer.from(txt).toString('hex');
    should.throws(() => Utils.verifySignature(hexEncodedString, base58, 'abc', true));
  });

  it('should return transaction data', () => {
    const data = Utils.decodeRawTransaction(UnsignedTransferContractTx.tx.raw_data_hex);
    should.equal(data.timestamp, UnsignedTransferContractTx.tx.raw_data.timestamp);
    should.equal(data.expiration, UnsignedTransferContractTx.tx.raw_data.expiration);
    should.exist(data.contracts);
  });

  it('should decode a transfer contract', () => {
    const tx = UnsignedTransferContractTx.tx;
    const rawTx = Utils.decodeRawTransaction(tx.raw_data_hex);
    const value = UnsignedTransferContractTx.tx.raw_data.contract[0].parameter.value;
    const parsedContract = Utils.decodeTransferContract(rawTx.contracts[0].parameter.value) as TransferContract[];

    const toAddress = Utils.getBase58AddressFromHex(value.to_address);
    const ownerAddress = Utils.getBase58AddressFromHex(value.owner_address);
    const amount = value.amount;

    should.equal(parsedContract[0].parameter.value.to_address, toAddress);
    should.equal(parsedContract[0].parameter.value.owner_address, ownerAddress);
    should.equal(parsedContract[0].parameter.value.amount, amount);
  });

   it('should decode an AccountPermissionUpdate Contract', () => {
     const tx = SignedAccountPermissionUpdateContractTx.tx;
     const value = tx.raw_data.contract[0].parameter.value;
     const rawTx = Utils.decodeRawTransaction(tx.raw_data_hex);
     const parsedTx = Utils.decodeAccountPermissionUpdateContract(rawTx.contracts[0].parameter.value) as AccountPermissionUpdateContract;
     const ownerAddress = Utils.getBase58AddressFromHex(value.owner_address);
     should.equal(parsedTx.ownerAddress, ownerAddress);
     should.equal(parsedTx.owner.type, 0);
     should.equal(parsedTx.owner.threshold, 2);
     parsedTx.actives.length.should.equal(1);
     should.equal(parsedTx.actives[0].type, 2);
     should.equal(parsedTx.actives[0].threshold, 2);
   });


  /**
   * Validate the public key is a valid point on secp256k1 elliptic curve and that it has been derived
   * from the private key.
   *
   * @param pub Account private key
   * @param prv Account private key
   * @return whether or not the pub and priv are valid
   */
  function validateKeyPair(pub: string, prv: string): boolean {
    const bufPub = Buffer.from(pub, 'hex');
    const bufPrv = Buffer.from(prv, 'hex');

    const ec = new EC('secp256k1');
    const kp = ec.keyPair({ priv: bufPrv, pub: bufPub });

    const validation = kp.validate();
    if (validation.reason || !validation.result) {
      throw new Error('Failed to validate generated keys.');
    }

    return kp.validate().result;
  }
});
