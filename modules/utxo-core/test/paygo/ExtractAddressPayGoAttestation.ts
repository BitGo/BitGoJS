import * as assert from 'assert';

import { extractMsgBufferFromPayGoAttestationProof } from '../../src/paygo';
import { generatePayGoAttestationProof } from '../../src/testutil';

const addressFromPubKeyBase58 = 'bitgoAddressToExtract';
const bufferAddressPubKeyB58 = Buffer.from(addressFromPubKeyBase58);

describe('extractAddressBufferFromPayGoAttestationProof', () => {
  it('should extractAddressBufferFromPayGoAttestationProof properly', () => {
    const paygoAttestationProof = generatePayGoAttestationProof(
      '00000000-0000-0000-0000-000000000000',
      bufferAddressPubKeyB58
    );
    const { entropy, address, uuid } = extractMsgBufferFromPayGoAttestationProof(paygoAttestationProof);
    assert.deepStrictEqual(Buffer.compare(address, bufferAddressPubKeyB58), 0);
    assert.deepStrictEqual(uuid.toString(), '00000000-0000-0000-0000-000000000000');
    assert.deepStrictEqual(entropy.length, 64);
  });

  it('should extract the paygo address paygo attestation proof given a non nilUUID', () => {
    const paygoAttestationProof = generatePayGoAttestationProof(
      '12345678-1234-4567-6890-231928472123',
      bufferAddressPubKeyB58
    );
    const { entropy, address, uuid } = extractMsgBufferFromPayGoAttestationProof(paygoAttestationProof);
    assert.deepStrictEqual(Buffer.compare(address, bufferAddressPubKeyB58), 0);
    assert.deepStrictEqual(uuid.toString(), '12345678-1234-4567-6890-231928472123');
    assert.deepStrictEqual(entropy.length, 64);
  });

  it('should not extract the correct address given a uuid of wrong format', () => {
    const paygoAttestationProof = generatePayGoAttestationProof(
      '000000000000000-000000-0000000-000000-0000000000000000',
      bufferAddressPubKeyB58
    );
    const { address } = extractMsgBufferFromPayGoAttestationProof(paygoAttestationProof);
    assert.notDeepStrictEqual(Buffer.compare(address, bufferAddressPubKeyB58), 0);
  });

  it('should throw an error if the paygo attestation proof is too short', () => {
    assert.throws(
      () => extractMsgBufferFromPayGoAttestationProof(Buffer.from('shortproof-shrug')),
      'PayGo attestation proof is too short to contain a valid address.'
    );
  });
});
