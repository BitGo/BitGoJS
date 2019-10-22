import { TransferContract } from '../../../../src/coin/trx/iface';
import { getByteArrayFromHexAddress, getBase58AddressFromHex, decodeTransferContract, decodeRawTransaction, getRawAddressFromPubKey, signString, signTransaction, isHexAddress, getHexAddressFromBase58Address, getBase58AddressFromByteArray, getPubKeyFromPriKey, getHexAddressFromByteArray, getAddressFromPriKey } from '../../../../src/coin/trx/utils';
import * as should from 'should';
import { UnsignedTransferContractTx } from './mock';

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
  const addrBytes = [ 65, 44, 43, 164, 169, 255, 108, 83, 32, 125, 197, 182,134,191,236,247,94,167,184,5,119 ]

  // tx information
  it('be able to convert hex to bytes', () => {
    const ba = getByteArrayFromHexAddress(hex);
    should.deepEqual(ba, arr);
  });

  it('be able to convert hex to bytes', () => {
    const hs = getHexAddressFromByteArray(arr);
    should.equal(hs, hex);
  });

  it('get a pub from a prv', () => {
    const derivedPub = getPubKeyFromPriKey(Buffer.from(prv, 'hex'));
    const derivedPubHex = getHexAddressFromByteArray(derivedPub);
    should.equal(derivedPubHex, pub);
  })

  it('get an hex address from a prv', () => {
    const addr = getAddressFromPriKey(Buffer.from(prv, 'hex'));
    const hexAddr = getHexAddressFromByteArray(addr);
    should.equal(hexAddr, addressHex);
  });

  it('get an base58 address', () => {
    const addr = getAddressFromPriKey(Buffer.from(prv, 'hex'));
    const addr58 = getBase58AddressFromByteArray(addr);
    should.equal(addr58, base58);
  });

  it('get an base58 address from hex', () => {
    const addr58 = getBase58AddressFromHex(addressHex);
    should.equal(addr58, base58);
  });

  it('get hex from base58 address', () => {
    const hexAddr = getHexAddressFromBase58Address(base58);
    should.equal(hexAddr, addressHex);
  });

  it('detect an address', () => {
    const addrDetect = isHexAddress(getHexAddressFromBase58Address(base58));
    should.equal(addrDetect, true);
  });

  it('sign a transaction', () => {
    const prvArray = getByteArrayFromHexAddress(prv);
    const signedTx = signTransaction(prvArray, UnsignedTransferContractTx.tx);
    should.equal(signedTx.signature[0], UnsignedTransferContractTx.sig);
  });

  it('sign a string', () => {
    const hexText = Buffer.from(txt).toString('hex');
    const prvArray = getByteArrayFromHexAddress(prv);
    const signed = signString(hexText, prvArray);

    should.equal(signedString, signed);
  });

  it('should calculate an address from a pub', () => {
    const pubBytes = getByteArrayFromHexAddress(pub);
    const bytes = getRawAddressFromPubKey(pubBytes);
    should.deepEqual(bytes, addrBytes);
  });

  it('should return transaction data', () => {
    const data = decodeRawTransaction(UnsignedTransferContractTx.tx.raw_data_hex);
    should.equal(data.timestamp, UnsignedTransferContractTx.tx.raw_data.timestamp);
    should.equal(data.expiration, UnsignedTransferContractTx.tx.raw_data.expiration);
    should.exist(data.contracts);
  });

  it('should decode a transfer contract', () => {
    const parsedTx = decodeTransferContract(UnsignedTransferContractTx.tx.raw_data_hex) as TransferContract;

    const toAddress = getBase58AddressFromHex(UnsignedTransferContractTx.tx.raw_data.contract[0].parameter.value.to_address);
    const ownerAddress = getBase58AddressFromHex(UnsignedTransferContractTx.tx.raw_data.contract[0].parameter.value.owner_address);
    const amount = UnsignedTransferContractTx.tx.raw_data.contract[0].parameter.value.amount;

    should.equal(parsedTx.toAddress, toAddress);
    should.equal(parsedTx.ownerAddress, ownerAddress);
    should.equal(parsedTx.amount, amount);
  });
});
