import assert from 'assert';
import crypto from 'crypto';

import * as utxolib from '@bitgo/utxo-lib';
import { decodeProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import { KeyValue } from 'bip174/src/lib/interfaces';
import { checkForOutput } from 'bip174/src/lib/utils';

import {
  addPayGoAddressProof,
  getPayGoAddressProofOutputIndex,
  psbtOutputIncludesPaygoAddressProof,
  verifyPayGoAddressProof,
} from '../../../src/paygo/psbt/payGoAddressProof';
import { generatePayGoAttestationProof } from '../../../src/testutil/generatePayGoAttestationProof.utils';
import { parseVaspProof } from '../../../src/testutil/parseVaspProof';
import { signMessage } from '../../../src/bip32utils';
import { NIL_UUID } from '../../../src/paygo/attestation';

// To construct our PSBTs
export const network = utxolib.networks.bitcoin;
const keys = [1, 2, 3].map((v) => utxolib.bip32.fromSeed(Buffer.alloc(16, `test/2/${v}`), network));
const rootWalletKeys = new utxolib.bitgo.RootWalletKeys([keys[0], keys[1], keys[2]]);

// PSBT INPUTS AND OUTPUTS
const psbtInputs = utxolib.testutil.inputScriptTypes.map((scriptType) => ({
  scriptType,
  value: BigInt(1000),
}));
const psbtOutputs = utxolib.testutil.outputScriptTypes.map((scriptType) => ({
  scriptType,
  value: BigInt(900),
}));

// wallet pub and priv key for tbtc
const dummyPub1 = rootWalletKeys.deriveForChainAndIndex(50, 200);
export const attestationPubKey = dummyPub1.user.publicKey;
export const attestationPrvKey = dummyPub1.user.privateKey!;

// our xpub converted to base58 address
export const addressToVerify = utxolib.address.toBase58Check(
  utxolib.crypto.hash160(Buffer.from(dummyPub1.backup.publicKey)),
  utxolib.networks.bitcoin.pubKeyHash,
  utxolib.networks.bitcoin
);

// this should be retuning a Buffer
export const addressProofBuffer = generatePayGoAttestationProof(NIL_UUID, Buffer.from(addressToVerify));
export const addressProofMsgBuffer = parseVaspProof(addressProofBuffer);
// We know that that the entropy is a set 64 bytes.
export const addressProofEntropy = addressProofMsgBuffer.subarray(0, 65);

// signature with the given msg addressProofBuffer
export const sig = signMessage(addressProofMsgBuffer.toString(), attestationPrvKey!, network);

function getTestPsbt() {
  return utxolib.testutil.constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
}

describe('addPaygoAddressProof and verifyPaygoAddressProof', () => {
  function getPayGoProprietaryKey(proprietaryKeyVals: KeyValue[]) {
    return proprietaryKeyVals
      .map(({ key, value }) => {
        return { key: decodeProprietaryKey(key), value };
      })
      .filter((keyValue) => {
        return (
          keyValue.key.identifier === utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER &&
          keyValue.key.subtype === utxolib.bitgo.ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF
        );
      });
  }

  it('should add and verify a valid paygo address proof on the PSBT', () => {
    const psbt = getTestPsbt();
    psbt.addOutput({ script: utxolib.address.toOutputScript(addressToVerify, network), value: BigInt(10000) });
    const outputIndex = psbt.data.outputs.length - 1;
    addPayGoAddressProof(psbt, outputIndex, sig, addressProofEntropy);
    verifyPayGoAddressProof(psbt, outputIndex, attestationPubKey);
  });

  it('should throw an error if there are multiple PayGo proprietary keys in the PSBT', () => {
    const outputIndex = 0;
    const psbt = getTestPsbt();
    addPayGoAddressProof(psbt, outputIndex, sig, addressProofEntropy);
    addPayGoAddressProof(psbt, outputIndex, Buffer.from('signature2'), crypto.randomBytes(64));
    const output = checkForOutput(psbt.data.outputs, outputIndex);
    const proofInPsbt = getPayGoProprietaryKey(output.unknownKeyVals!);
    assert(proofInPsbt.length !== 0);
    assert(proofInPsbt.length > 1);
    assert.throws(
      () => verifyPayGoAddressProof(psbt, outputIndex, attestationPubKey),
      (e: any) => e.message === 'There are multiple paygo address proofs encoded in the PSBT. Something went wrong.'
    );
  });
});

describe('verifyPaygoAddressProof', () => {
  it('should throw an error if there is no PayGo address in PSBT', () => {
    const psbt = getTestPsbt();
    assert.throws(
      () => verifyPayGoAddressProof(psbt, 0, attestationPubKey),
      (e: any) => e.message === 'There is no paygo address proof encoded in the PSBT at output 0.'
    );
  });
});

describe('getPaygoAddressProofIndex', () => {
  it('should get PayGo address proof index from PSBT if there is one', () => {
    const psbt = getTestPsbt();
    const outputIndex = 0;
    addPayGoAddressProof(psbt, outputIndex, sig, Buffer.from(attestationPubKey));
    assert(psbtOutputIncludesPaygoAddressProof(psbt));
    assert(getPayGoAddressProofOutputIndex(psbt) === 0);
  });

  it('should return undefined if there is no PayGo address proof in PSBT', () => {
    const psbt = getTestPsbt();
    assert(getPayGoAddressProofOutputIndex(psbt) === undefined);
    assert(!psbtOutputIncludesPaygoAddressProof(psbt));
  });

  it('should return an error and fail if we have multiple PayGo address in the PSBT in the same output index', () => {
    const psbt = getTestPsbt();
    const outputIndex = 0;
    addPayGoAddressProof(psbt, outputIndex, sig, addressProofEntropy);
    addPayGoAddressProof(psbt, outputIndex, sig, crypto.randomBytes(64));
    assert.throws(
      () => getPayGoAddressProofOutputIndex(psbt),
      (e: any) => e.message === 'There are multiple PayGo addresses in the PSBT output 0.'
    );
  });
});
