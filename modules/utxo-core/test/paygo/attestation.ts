import assert from 'assert';

import { createPayGoAttestationBuffer } from '../../src/paygo/attestation';
import { generatePayGoAttestationProof } from '../../src/testutil';

import { addressProofEntropy, addressProofMsgBuffer, addressToVerify, network } from './psbt/payGoAddressProof';

describe('createPayGoAttestationBuffer', () => {
  it('should create a PayGo Attestation proof matching with original proof', () => {
    const payGoAttestationProof = createPayGoAttestationBuffer(addressToVerify, addressProofEntropy, network);
    assert.strictEqual(payGoAttestationProof.toString(), addressProofMsgBuffer.toString());
    assert(Buffer.compare(payGoAttestationProof, addressProofMsgBuffer) === 0);
  });

  it('should create a PayGo Attestation proof that does not match with different uuid', () => {
    const addressProofBufferDiffUuid = generatePayGoAttestationProof(
      '00000000-0000-0000-0000-000000000001',
      Buffer.from(addressToVerify)
    );
    const payGoAttestationProof = createPayGoAttestationBuffer(addressToVerify, addressProofEntropy, network);
    assert.notStrictEqual(payGoAttestationProof.toString(), addressProofBufferDiffUuid.toString());
    assert(Buffer.compare(payGoAttestationProof, addressProofBufferDiffUuid) !== 0);
  });
});
