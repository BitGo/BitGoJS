import { TransferContract } from '../../../../src/coin/trx/iface';
import Utils from '../../../../src/coin/trx/utils';
import * as should from 'should';

describe('Tron library should', function() {
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
  const sig = '0a9944316924ec7fba4895f1ea1e7cc95f9e2b828ae268a48a8dbeddef40c6f5e127170a95aed9f3f5425b13058d0cb6ef1f5c2213190e482e87043691f22e6800';
  const tx = { visible: false,
    txID:
     'ee0bbf72b238361577a9dc41d79f7a74f6ba9efe472c21bfd3e7dc850c9e9020',
    raw_data:
     { contract:
        [ { parameter:
             { value:
                { amount: 10,
                  owner_address: '41e5e00fc1cdb3921b8340c20b2b65b543c84aa1dd',
                  to_address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577' },
               type_url: 'type.googleapis.com/protocol.TransferContract' },
            type: 'TransferContract' } ],
       ref_block_bytes: '5123',
       ref_block_hash: '52a26dea963a47bc',
       expiration: 1569463320000,
       timestamp: 1569463261623 },
    raw_data_hex:
     '0a025123220852a26dea963a47bc40c0fbb6dad62d5a65080112610a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412300a1541e5e00fc1cdb3921b8340c20b2b65b543c84aa1dd1215412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577180a70b7b3b3dad62d',
    signature:
     [ ]
    };

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
  })

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

  it('detect an address', () => {
    const addrDetect = Utils.isHexAddress(Utils.getHexAddressFromBase58Address(base58));
    should.equal(addrDetect, true);
  });

  it('sign a transaction', () => {
    const prvArray = Utils.getByteArrayFromHexAddress(prv);
    const signedTx = Utils.signTransaction(prvArray, tx);
    should.equal(signedTx.signature[0], sig);
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

  it('should return transaction data', () => {
    const data = Utils.decodeRawTransaction(tx.raw_data_hex);
    should.equal(data.timestamp, tx.raw_data.timestamp);
    should.equal(data.expiration, tx.raw_data.expiration);
    should.exist(data.contracts);
  });

  it('should decode a transfer contract', () => {
    const parsedTx = Utils.decodeTransferContract(tx.raw_data_hex) as TransferContract;

    const toAddress = Utils.getBase58AddressFromHex(tx.raw_data.contract[0].parameter.value.to_address);
    const ownerAddress = Utils.getBase58AddressFromHex(tx.raw_data.contract[0].parameter.value.owner_address);
    const amount = tx.raw_data.contract[0].parameter.value.amount;

    should.equal(parsedTx.toAddress, toAddress);
    should.equal(parsedTx.ownerAddress, ownerAddress);
    should.equal(parsedTx.amount, amount);
  });
});
