import * as assert from 'assert';

import { parsePayGoAttestation } from '../../src/paygo/index.js';
import { generatePayGoAttestationProof } from '../../src/testutil/index.js';
import { NIL_UUID } from '../../src/paygo/attestation.js';

const addressFromPubKeyBase58 = 'bitgoAddressToExtract';
const bufferAddressPubKeyB58 = Buffer.from(addressFromPubKeyBase58);

describe('parsePayGoAttestationProof with prefix', () => {
  it('should extractAddressBufferFromPayGoAttestationProof properly', function () {
    const paygoAttestationProof = generatePayGoAttestationProof(NIL_UUID, bufferAddressPubKeyB58);
    const { entropy, address, uuid } = parsePayGoAttestation(paygoAttestationProof);
    assert.ok(address.equals(bufferAddressPubKeyB58));
    assert.deepStrictEqual(uuid.toString(), NIL_UUID);
    assert.deepStrictEqual(entropy.length, 64);
  });

  it('should extract the paygo address paygo attestation proof given a non nilUUID', function () {
    const paygoAttestationProof = generatePayGoAttestationProof(
      '12345678-1234-4567-6890-231928472123',
      bufferAddressPubKeyB58
    );
    const { entropy, address, uuid } = parsePayGoAttestation(paygoAttestationProof);
    assert.ok(address.equals(bufferAddressPubKeyB58));
    assert.deepStrictEqual(uuid.toString('utf-8'), '12345678-1234-4567-6890-231928472123');
    assert.deepStrictEqual(entropy.length, 64);
  });

  it('should not extract the correct address given a uuid of wrong format', function () {
    const paygoAttestationProof = generatePayGoAttestationProof(
      '000000000000000-000000-0000000-000000-0000000000000000',
      bufferAddressPubKeyB58
    );
    const { address } = parsePayGoAttestation(paygoAttestationProof);
    assert.ok(!address.equals(bufferAddressPubKeyB58));
  });

  it('should throw an error if the paygo attestation proof is too short', function () {
    assert.throws(
      () => parsePayGoAttestation(Buffer.from('shortproof-shrug', 'utf-8')),
      'PayGo attestation proof is too short to contain a valid address.'
    );
  });
});

describe('parsePayGoAttestation without prefix', function () {
  it('should extract the parts of the proof without the prefix automatically', function () {
    const payGoAttestationProof = generatePayGoAttestationProof(NIL_UUID, bufferAddressPubKeyB58, false);
    const { entropy, address, uuid } = parsePayGoAttestation(payGoAttestationProof);
    assert.ok(address.equals(bufferAddressPubKeyB58));
    assert.deepStrictEqual(uuid.toString(), NIL_UUID);
    assert.deepStrictEqual(entropy.length, 64);
  });
});
