import { describe, it } from 'node:test';
import assert from 'assert';
import { Interface, Utils } from '../../src';

import { UnsignedTransferContractTx, SignedAccountPermissionUpdateContractTx } from '../resources';
import { tokenMainnetContractAddresses, tokenTestnetContractAddresses } from '../../src/lib/utils';

describe('Util library should', function () {
  // arbitrary text
  const arr = [127, 255, 31, 192, 3, 126, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const hex = '7FFF1FC0037E0000000000000000000000000000000000000000000000000000';
  const txt = 'arbitrary string to sign';
  const signedString =
    '0x9424113f32c17b6ffbeee024e1a54b6991d756e82f66cca16a41231fdfa270d03b08e833f5dbbd5cc86896c2e5ea6c74d2e292cda21f717164f994fcdf28486d1b';

  // prv-pub-address hex
  const prv = 'FB3AA887E0BE3FAC9D75E661DAFF4A7FE0E91AAB13DA9775CD8586D7CB9B7640';
  const pub =
    '046EBFB90C396B4A3B992B727CB4714A32E2A6DE43FDB3EC266286AC2246D8FD1E23E12C0DEB752C631A9011BBF8B56E2FBAA20E99D3952F0A558D11F96E7C1C5D';
  const addressHex = '412C2BA4A9FF6C53207DC5B686BFECF75EA7B80577';
  const base58 = 'TDzm1tCXM2YS1PDa3GoXSvxdy4AgwVbBPE';
  const addrBytes = [65, 44, 43, 164, 169, 255, 108, 83, 32, 125, 197, 182, 134, 191, 236, 247, 94, 167, 184, 5, 119];

  // tx information
  it('be able to convert hex to bytes', () => {
    const ba = Utils.getByteArrayFromHexAddress(hex);
    assert.deepStrictEqual(ba, arr);
  });

  it('be able to convert hex with 0x to bytes ', () => {
    const ba = Utils.getByteArrayFromHexAddress('0x' + hex);
    assert.deepStrictEqual(ba, arr);
  });

  it('be able to convert hex to bytes', () => {
    const hs = Utils.getHexAddressFromByteArray(arr);
    assert.equal(hs, hex);
  });

  it('get a pub from a prv', () => {
    const derivedPub = Utils.getPubKeyFromPriKey(Buffer.from(prv, 'hex'));
    const derivedPubHex = Utils.getHexAddressFromByteArray(derivedPub);
    assert.equal(derivedPubHex, pub);
  });

  it('get an hex address from a prv', () => {
    const addr = Utils.getAddressFromPriKey(Buffer.from(prv, 'hex'));
    const hexAddr = Utils.getHexAddressFromByteArray(addr);
    assert.equal(hexAddr, addressHex);
  });

  it('get an base58 address', () => {
    const addr = Utils.getAddressFromPriKey(Buffer.from(prv, 'hex'));
    const addr58 = Utils.getBase58AddressFromByteArray(addr);
    assert.equal(addr58, base58);
  });

  it('get an base58 address from hex', () => {
    const addr58 = Utils.getBase58AddressFromHex(addressHex);
    assert.equal(addr58, base58);
  });

  it('get hex from base58 address', () => {
    const hexAddr = Utils.getHexAddressFromBase58Address(base58);
    assert.equal(hexAddr, addressHex);
  });

  it('validate a hex string', () => {
    const hex = ['0xaffd', '0x11'];
    hex.map((hex) => {
      assert.ok(Utils.isValidHex(hex));
    });

    const invalidHex = ['0xa11', '0xFFdYYY', '0x', ''];
    invalidHex.map((hex) => {
      assert.strictEqual(Utils.isValidHex(hex), false);
    });
  });

  it('sign a string', () => {
    const hexText = Buffer.from(txt).toString('hex');
    const signed = Utils.signString(hexText, prv);

    assert.equal(signedString, signed);
  });

  it('should calculate an address from a pub', () => {
    const pubBytes = Utils.getByteArrayFromHexAddress(pub);
    const bytes = Utils.getRawAddressFromPubKey(pubBytes);
    assert.deepStrictEqual(bytes, addrBytes);
  });

  it('should verify a signed message', () => {
    const hexEncodedMessage = Buffer.from(txt).toString('hex');
    assert.strictEqual(Utils.verifySignature(hexEncodedMessage, base58, signedString, true), true);
  });

  it('should fail to verify a signed message if the message is not in hex', () => {
    assert.throws(() => Utils.verifySignature(txt, base58, signedString, true));
  });

  it('should fail to verify a signed message if the address is not in base58', () => {
    const hexEncodedString = Buffer.from(txt).toString('hex');
    assert.throws(() => Utils.verifySignature(hexEncodedString, addressHex, signedString, true));
  });

  it('should fail to verify a signed message if the signature is not in hex', () => {
    const hexEncodedString = Buffer.from(txt).toString('hex');
    assert.throws(() => Utils.verifySignature(hexEncodedString, base58, 'abc', true));
  });

  it('should return transaction data', () => {
    const data = Utils.decodeRawTransaction(UnsignedTransferContractTx.tx.raw_data_hex);
    assert.equal(data.timestamp, UnsignedTransferContractTx.tx.raw_data.timestamp);
    assert.equal(data.expiration, UnsignedTransferContractTx.tx.raw_data.expiration);
    assert.ok(data.contracts);
  });

  it('should decode a transfer contract', () => {
    const tx = UnsignedTransferContractTx.tx;
    const rawTx = Utils.decodeRawTransaction(tx.raw_data_hex);
    const value = UnsignedTransferContractTx.tx.raw_data.contract[0].parameter.value;
    const parsedContract = Utils.decodeTransferContract(
      rawTx.contracts[0].parameter.value
    ) as Interface.TransferContract[];

    const toAddress = Utils.getBase58AddressFromHex(value.to_address);
    const ownerAddress = Utils.getBase58AddressFromHex(value.owner_address);
    const amount = value.amount;

    assert.equal(parsedContract[0].parameter.value.to_address, toAddress);
    assert.equal(parsedContract[0].parameter.value.owner_address, ownerAddress);
    assert.equal(parsedContract[0].parameter.value.amount, amount);
  });

  it('should decode an AccountPermissionUpdate Contract', () => {
    const tx = SignedAccountPermissionUpdateContractTx;
    const value = tx.raw_data.contract[0].parameter.value;
    const rawTx = Utils.decodeRawTransaction(tx.raw_data_hex);
    const parsedTx = Utils.decodeAccountPermissionUpdateContract(
      rawTx.contracts[0].parameter.value
    ) as Interface.AccountPermissionUpdateContract;
    const ownerAddress = Utils.getBase58AddressFromHex(value.owner_address);
    assert.equal(parsedTx.ownerAddress, ownerAddress);
    assert.equal(parsedTx.owner.type, 0);
    assert.equal(parsedTx.owner.threshold, 2);
    assert.equal(parsedTx.actives.length, 1);
    assert.equal(parsedTx.actives[0].type, 2);
    assert.equal(parsedTx.actives[0].threshold, 2);
  });

  it('should encode and decode data parameters for transfer', () => {
    const types = ['address', 'uint256'];
    const amount = '2000000000000000000000';
    const values = [addressHex, amount];
    const methodId = '0xa9059cbb';
    const data = Utils.encodeDataParams(types, values, methodId);
    assert.equal(
      data,
      'a9059cbb0000000000000000000000002c2ba4a9ff6c53207dc5b686bfecf75ea7b8057700000000000000000000000000000000000000000000006c6b935b8bbd400000'
    );

    const decodedData = Utils.decodeDataParams(
      types,
      'a9059cbb0000000000000000000000002c2ba4a9ff6c53207dc5b686bfecf75ea7b8057700000000000000000000000000000000000000000000006c6b935b8bbd400000'
    );
    assert.equal(decodedData[0], addressHex.toLocaleLowerCase());
    assert.equal(decodedData[1].toString(), amount);
  });

  it('should correctly map testnet and mainnet tokens', () => {
    assert.strictEqual(tokenMainnetContractAddresses.includes('TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S'), true);
    assert.strictEqual(tokenTestnetContractAddresses.includes('TGkfUshdbAiNj5G1mynp2meq2BfF6XSGPf'), true);
  });
});
