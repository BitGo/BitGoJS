import * as assert from 'assert';
import { decodeProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import { KeyValue } from 'bip174/src/lib/interfaces';
import { checkForOutput } from 'bip174/src/lib/utils';

import { bip32, crypto, networks, testutil } from '../../../src';
import { generatePayGoAttestationProof, inputScriptTypes, outputScriptTypes } from '../../../src/testutil';
import { ProprietaryKeySubtype, PSBT_PROPRIETARY_IDENTIFIER, RootWalletKeys } from '../../../src/bitgo';
import { toBase58Check } from '../../../src/address';
import {
  addPaygoAddressProof,
  verifyPaygoAddressProof,
  getPaygoAddressProofOutputIndex,
  psbtOutputIncludesPaygoAddressProof,
} from '../../../src/bitgo/psbt/paygoAddressProof';

const network = networks.bitcoin;
const keys = [1, 2, 3].map((v) => bip32.fromSeed(Buffer.alloc(16, `test/2/${v}`), network));
const rootWalletKeys = new RootWalletKeys([keys[0], keys[1], keys[2]]);
// const dummyKey1 = rootWalletKeys.deriveForChainAndIndex(50, 200);
const dummyKey2 = rootWalletKeys.deriveForChainAndIndex(60, 201);

const psbtInputs = inputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(1000) }));
const psbtOutputs = outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900) }));
// const dummy1PubKey = dummyKey1.user.publicKey;
// This generatePayGoAttestationProof function should be returning the bitcoin signed message
const sig2 = dummyKey2.user.privateKey!;

// wallet pub and priv key for tbtc
const attestationPubKey =
  'xpub661MyMwAqRbcFU2Qx7pvGmmiQpVj8NcR7dSVpgqNChMkQyobpVWWERcrTb47WicmXwkhAY2VrC3hb29s18FDQWJf5pLm3saN6uLXAXpw1GV';
const attestationPrvKey = 'red';
const nilUUID = '00000000-0000-0000-0000-000000000000';
const address = toBase58Check(
  crypto.hash160(Buffer.from(attestationPubKey)),
  networks.bitcoin.pubKeyHash,
  networks.bitcoin
);
const addressProofBuffer = generatePayGoAttestationProof(Buffer.from(attestationPrvKey), nilUUID, address);

function getTestPsbt() {
  return testutil.constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
}

describe('addPaygoAddressProof and verifyPaygoAddressProof', () => {
  function getPaygoProprietaryKey(proprietaryKeyVals: KeyValue[]) {
    return proprietaryKeyVals
      .map(({ key, value }) => {
        return { key: decodeProprietaryKey(key), value };
      })
      .filter((keyValue) => {
        return (
          keyValue.key.identifier === PSBT_PROPRIETARY_IDENTIFIER &&
          keyValue.key.subtype === ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF
        );
      });
  }

  it("should fail a proof verification if the proof isn't valid", () => {
    const outputIndex = 0;
    const psbt = getTestPsbt();
    addPaygoAddressProof(psbt, outputIndex, Buffer.from(addressProofBuffer), Buffer.from(attestationPubKey));
    const output = checkForOutput(psbt.data.outputs, outputIndex);
    const proofInPsbt = getPaygoProprietaryKey(output.unknownKeyVals!);
    assert(proofInPsbt.length === 1);
    assert.throws(
      () => verifyPaygoAddressProof(psbt, 0, dummyKey2.user.publicKey),
      (e: any) => e.message === 'Cannot verify the paygo address signature with the provided pubkey.'
    );
  });

  it('should add and verify a valid paygo address proof on the PSBT', () => {
    const outputIndex = 0;
    const psbt = getTestPsbt();
    addPaygoAddressProof(psbt, outputIndex, Buffer.from(addressProofBuffer), Buffer.from(attestationPubKey));
    // should verify function return a boolean? that way we can assert
    // if this is verified, throws an error otherwise or false + error msg as an object
    verifyPaygoAddressProof(psbt, outputIndex, Buffer.from(attestationPubKey));
  });

  it('should throw an error if there are multiple PayGo proprietary keys in the PSBT', () => {
    const outputIndex = 0;
    const psbt = getTestPsbt();
    addPaygoAddressProof(psbt, outputIndex, Buffer.from(addressProofBuffer), Buffer.from(attestationPubKey));
    addPaygoAddressProof(psbt, outputIndex, Buffer.from(sig2), Buffer.from(attestationPubKey));
    const output = checkForOutput(psbt.data.outputs, outputIndex);
    const proofInPsbt = getPaygoProprietaryKey(output.unknownKeyVals!);
    assert(proofInPsbt.length !== 0);
    assert(proofInPsbt.length <= 1);
    assert.throws(
      () => verifyPaygoAddressProof(psbt, outputIndex, Buffer.from(attestationPubKey)),
      (e: any) => e.message === 'There are multiple paygo address proofs encoded in the PSBT. Something went wrong.'
    );
  });
});

describe('verifyPaygoAddressProof', () => {
  it('should throw an error if there is no PayGo address in PSBT', () => {
    const psbt = getTestPsbt();
    assert.throws(
      () => verifyPaygoAddressProof(psbt, 0, Buffer.from(attestationPubKey)),
      (e: any) => e.message === 'here is no paygo address proof encoded in the PSBT.'
    );
  });
});

describe('getPaygoAddressProofIndex', () => {
  it('should get PayGo address proof index from PSBT if there is one', () => {
    const psbt = getTestPsbt();
    const outputIndex = 0;
    addPaygoAddressProof(psbt, outputIndex, Buffer.from(addressProofBuffer), Buffer.from(attestationPubKey));
    assert(psbtOutputIncludesPaygoAddressProof(psbt));
    assert(getPaygoAddressProofOutputIndex(psbt) === 0);
  });

  it('should return undefined if there is no PayGo address proof in PSBT', () => {
    const psbt = getTestPsbt();
    assert(getPaygoAddressProofOutputIndex(psbt) === undefined);
    assert(!psbtOutputIncludesPaygoAddressProof(psbt));
  });

  it('should return an error and fail if we have multiple PayGo address in the PSBT in the same output index', () => {
    const psbt = getTestPsbt();
    const outputIndex = 0;
    addPaygoAddressProof(psbt, outputIndex, Buffer.from(addressProofBuffer), Buffer.from(attestationPubKey));
    addPaygoAddressProof(
      psbt,
      outputIndex,
      Buffer.from(addressProofBuffer),
      Buffer.from('xpub12345abcdef29a028510d3b2d4')
    );
    assert.throws(
      () => getPaygoAddressProofOutputIndex(psbt),
      (e: any) => e.message === 'There are multiple PayGo addresses in the PSBT output 0.'
    );
  });
});
