import 'should';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { parseWireTransaction, validateRawTransactionV1 } from '../../../src/lib/serialization/parseWireTransaction';
import { encodeV1Message } from '../../../src/lib/serialization/codecs/v1/message';
import { encodeConfigMaskAndValues } from '../../../src/lib/serialization/codecs/v1/config';
import { serializeWireTransaction } from '../../../src/lib/serialization/wire-transaction';

const BLOCKHASH = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
const kp = nacl.sign.keyPair();
const A = bs58.encode(kp.publicKey);
const B = bs58.encode(nacl.sign.keyPair().publicKey);

function sampleMessage(): Uint8Array {
  const config = encodeConfigMaskAndValues({
    computeUnitLimit: 200_000,
    heapSize: null,
    loadedAccountsDataSizeLimit: null,
    priorityFee: 5_000,
  });
  return encodeV1Message({
    header: { numSignerAccounts: 1, numReadonlySignerAccounts: 0, numReadonlyNonSignerAccounts: 1 },
    configMask: config.mask,
    configValues: config.values,
    blockhash: BLOCKHASH,
    staticAccounts: [A, B],
    compiledInstructions: [{ programAddressIndex: 1, accountIndices: [0, 1], data: new Uint8Array([1]) }],
  });
}

function sign(messageBytes: Uint8Array): Uint8Array[] {
  return [nacl.sign.detached(messageBytes, kp.secretKey)];
}

describe('parseWireTransaction', () => {
  it('splits a signed v1 transaction into message + signatures + signer pubkeys', () => {
    const messageBytes = sampleMessage();
    const signatures = sign(messageBytes);
    const wire = serializeWireTransaction(messageBytes, signatures);
    const parsed = parseWireTransaction(wire);
    parsed.messageBytes.should.eql(messageBytes);
    parsed.signatures.length.should.equal(1);
    parsed.signatures[0].should.eql(signatures[0]);
    parsed.signerPublicKeys.should.eql([A]);
  });

  it('rejects a wire tx whose tail is not the expected number of signatures', () => {
    const messageBytes = sampleMessage();
    const wire = serializeWireTransaction(messageBytes, sign(messageBytes));
    const truncated = wire.subarray(0, wire.length - 1);
    (() => parseWireTransaction(truncated)).should.throw(BuildTransactionError);
  });

  it('rejects a non-v1 wire tx', () => {
    const bytes = new Uint8Array([0x00, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    (() => parseWireTransaction(bytes)).should.throw(BuildTransactionError, { message: /version prefix/ });
  });
});

describe('validateRawTransactionV1', () => {
  it('accepts a fully signed, valid v1 transaction', () => {
    const messageBytes = sampleMessage();
    const wire = serializeWireTransaction(messageBytes, sign(messageBytes));
    (() => validateRawTransactionV1(wire)).should.not.throw();
  });

  it('rejects a tampered signature', () => {
    const messageBytes = sampleMessage();
    const wire = serializeWireTransaction(messageBytes, sign(messageBytes));
    const tampered = new Uint8Array(wire);
    tampered[tampered.length - 1] ^= 0xff;
    (() => validateRawTransactionV1(tampered)).should.throw(BuildTransactionError, { message: /verification failed/ });
  });

  it('rejects when a required signature is missing', () => {
    const config = encodeConfigMaskAndValues({
      computeUnitLimit: 200_000,
      heapSize: null,
      loadedAccountsDataSizeLimit: null,
      priorityFee: 5_000,
    });
    const msg = encodeV1Message({
      header: { numSignerAccounts: 1, numReadonlySignerAccounts: 0, numReadonlyNonSignerAccounts: 1 },
      configMask: config.mask,
      configValues: config.values,
      blockhash: BLOCKHASH,
      staticAccounts: [A, B],
      compiledInstructions: [{ programAddressIndex: 1, accountIndices: [0, 1], data: new Uint8Array([1]) }],
    });
    (() => validateRawTransactionV1(msg)).should.throw(BuildTransactionError, { message: /signature bytes/ });
  });
});
