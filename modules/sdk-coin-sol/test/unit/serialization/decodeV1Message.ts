import 'should';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { decodeV1Message, encodeV1Message } from '../../../src/lib/serialization/codecs/v1/message';
import { encodeConfigMaskAndValues } from '../../../src/lib/serialization/codecs/v1/config';

const A = '3h1zGmCwsRJn5kU4LdYD8QfUoXjW8YqZcZsRsYxVvNpq';
const B = '9xQeWvGcCvsftH8sN4jWQcBpkT2yLdMfZqNpVxKjRwSb';
const BLOCKHASH = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

function sampleMessage(): Uint8Array {
  const config = encodeConfigMaskAndValues({
    computeUnitLimit: 200_000,
    heapSize: 32_768,
    loadedAccountsDataSizeLimit: 65_536,
    priorityFee: 5_000,
  });
  return encodeV1Message({
    header: { numSignerAccounts: 1, numReadonlySignerAccounts: 0, numReadonlyNonSignerAccounts: 1 },
    configMask: config.mask,
    configValues: config.values,
    blockhash: BLOCKHASH,
    staticAccounts: [A, B],
    compiledInstructions: [{ programAddressIndex: 1, accountIndices: [0, 1], data: new Uint8Array([1, 2, 3]) }],
  });
}

describe('decodeV1Message', () => {
  it('round-trips an encoded v1 message', () => {
    const bytes = sampleMessage();
    const decoded = decodeV1Message(bytes);
    decoded.header.numSignerAccounts.should.equal(1);
    decoded.header.numReadonlySignerAccounts.should.equal(0);
    decoded.header.numReadonlyNonSignerAccounts.should.equal(1);
    decoded.configMask.should.equal(0b11 | 0b100 | 0b1000 | 0b10000);
    decoded.configValues.should.eql([
      { kind: 'u64', value: 5_000n },
      { kind: 'u32', value: 200_000 },
      { kind: 'u32', value: 65_536 },
      { kind: 'u32', value: 32_768 },
    ]);
    decoded.blockhash.should.equal(BLOCKHASH);
    decoded.staticAccounts.should.eql([A, B]);
    decoded.compiledInstructions.should.eql([
      { programAddressIndex: 1, accountIndices: [0, 1], data: new Uint8Array([1, 2, 3]) },
    ]);
    decoded.byteLength.should.equal(bytes.length);
  });

  it('rejects an unknown config mask bit', () => {
    const bytes = sampleMessage();
    bytes[4] = 0xff;
    (() => decodeV1Message(bytes)).should.throw(BuildTransactionError, { message: /Unknown config mask/ });
  });

  it('rejects an out-of-range program index', () => {
    const bytes = sampleMessage();
    const programIdxByte = 42 + 2 * 32 + 4 + 8 + 4 + 4;
    bytes[programIdxByte] = 0xff;
    (() => decodeV1Message(bytes)).should.throw(BuildTransactionError, { message: /program index/ });
  });

  it('rejects a truncated message', () => {
    const bytes = sampleMessage();
    (() => decodeV1Message(bytes.subarray(0, bytes.length - 1))).should.throw(BuildTransactionError);
  });
});
