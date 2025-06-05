import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { extractAddressBufferFromPayGoAttestationProof } from '../src/ExtractAddressPayGoAttestation';

const addressFromPubKeyBase58 = 'bitgoAddressToExtract';
const bufferAddressPubKeyB58 = Buffer.from(addressFromPubKeyBase58);

describe('extractAddressBufferFromPayGoAttestationProof', () => {
  it('should extractAddressBufferFromPayGoAttestationProof properly', () => {
    const paygoAttestationProof = utxolib.testutil.generatePayGoAttestationProof(
      '00000000-0000-0000-0000-000000000000',
      bufferAddressPubKeyB58
    );
    const addressFromProof = extractAddressBufferFromPayGoAttestationProof(paygoAttestationProof);
    assert.deepStrictEqual(Buffer.compare(addressFromProof, bufferAddressPubKeyB58), 0);
  });

  it('should extract the paygo address paygo attestation proof given a non nilUUID', () => {
    const paygoAttestationProof = utxolib.testutil.generatePayGoAttestationProof(
      '12345678-1234-4567-6890-231928472123',
      bufferAddressPubKeyB58
    );
    const addressFromProof = extractAddressBufferFromPayGoAttestationProof(paygoAttestationProof);
    assert.deepStrictEqual(Buffer.compare(addressFromProof, bufferAddressPubKeyB58), 0);
  });

  it('should not extract the correct address given a uuid of wrong format', () => {
    const paygoAttestationProof = utxolib.testutil.generatePayGoAttestationProof(
      '000000000000000-000000-0000000-000000-0000000000000000',
      bufferAddressPubKeyB58
    );
    const addressFromProof = extractAddressBufferFromPayGoAttestationProof(paygoAttestationProof);
    assert.notDeepStrictEqual(Buffer.compare(addressFromProof, bufferAddressPubKeyB58), 0);
  });

  it('should throw an error if the paygo attestation proof is too short', () => {
    assert.throws(
      () => extractAddressBufferFromPayGoAttestationProof(Buffer.from('shortproof-shrug')),
      'PayGo attestation proof is too short to contain a valid address.'
    );
  });
});
