import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import * as bitcoinMessage from 'bitcoinjs-message';
import { decodeProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import { KeyValue } from 'bip174/src/lib/interfaces';
import { checkForOutput } from 'bip174/src/lib/utils';

import {
  addPaygoAddressProof,
  getPaygoAddressProofOutputIndex,
  psbtOutputIncludesPaygoAddressProof,
  verifyPaygoAddressProof,
} from '../../../src/paygo/psbt/PayGoUtils';
import { generatePayGoAttestationProof } from '../../../src/testutil/generatePayGoAttestationProof.utils';

// To construct our PSBTs
const network = utxolib.networks.bitcoin;
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
const attestationPubKey = dummyPub1.user.publicKey;
const attestationPrvKey = dummyPub1.user.privateKey!;

// UUID structure
const nilUUID = '00000000-0000-0000-0000-000000000000';

// our xpub converted to base58 address
const addressToVerify = utxolib.address.toBase58Check(
  utxolib.crypto.hash160(Buffer.from(dummyPub1.backup.publicKey)),
  utxolib.networks.bitcoin.pubKeyHash,
  utxolib.networks.bitcoin
);

// this should be retuning a Buffer
const addressProofBuffer = generatePayGoAttestationProof(nilUUID, Buffer.from(addressToVerify));
// signature with the given msg addressProofBuffer
const sig = bitcoinMessage.sign(addressProofBuffer, attestationPrvKey!, true, network.messagePrefix);

function getTestPsbt() {
  return utxolib.testutil.constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
}

describe('addPaygoAddressProof and verifyPaygoAddressProof', () => {
  function getPaygoProprietaryKey(proprietaryKeyVals: KeyValue[]) {
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

  it("should fail a proof verification if the proof isn't valid", () => {
    const outputIndex = 0;
    const psbt = getTestPsbt();
    addPaygoAddressProof(psbt, outputIndex, sig, Buffer.from(attestationPubKey));
    const output = checkForOutput(psbt.data.outputs, outputIndex);
    const proofInPsbt = getPaygoProprietaryKey(output.unknownKeyVals!);
    assert(proofInPsbt.length === 1);
    assert.throws(
      () => verifyPaygoAddressProof(psbt, 0, Buffer.from('Random Signed Message'), attestationPubKey),
      (e: any) => e.message === 'Cannot verify the paygo address signature with the provided pubkey.'
    );
  });

  it('should add and verify a valid paygo address proof on the PSBT', () => {
    const psbt = getTestPsbt();
    psbt.addOutput({ script: utxolib.address.toOutputScript(addressToVerify, network), value: BigInt(10000) });
    const outputIndex = psbt.data.outputs.length - 1;
    addPaygoAddressProof(psbt, outputIndex, sig, Buffer.from(attestationPubKey));
    verifyPaygoAddressProof(psbt, outputIndex, Buffer.from(addressProofBuffer), attestationPubKey);
  });

  it('should throw an error if there are multiple PayGo proprietary keys in the PSBT', () => {
    const outputIndex = 0;
    const psbt = getTestPsbt();
    addPaygoAddressProof(psbt, outputIndex, sig, Buffer.from(attestationPubKey));
    addPaygoAddressProof(psbt, outputIndex, Buffer.from('signature2'), Buffer.from('fakepubkey2s'));
    const output = checkForOutput(psbt.data.outputs, outputIndex);
    const proofInPsbt = getPaygoProprietaryKey(output.unknownKeyVals!);
    assert(proofInPsbt.length !== 0);
    assert(proofInPsbt.length > 1);
    assert.throws(
      () => verifyPaygoAddressProof(psbt, outputIndex, addressProofBuffer, attestationPubKey),
      (e: any) => e.message === 'There are multiple paygo address proofs encoded in the PSBT. Something went wrong.'
    );
  });
});

describe('verifyPaygoAddressProof', () => {
  it('should throw an error if there is no PayGo address in PSBT', () => {
    const psbt = getTestPsbt();
    assert.throws(
      () => verifyPaygoAddressProof(psbt, 0, addressProofBuffer, attestationPubKey),
      (e: any) => e.message === 'There is no paygo address proof encoded in the PSBT at output 0.'
    );
  });
});

describe('getPaygoAddressProofIndex', () => {
  it('should get PayGo address proof index from PSBT if there is one', () => {
    const psbt = getTestPsbt();
    const outputIndex = 0;
    addPaygoAddressProof(psbt, outputIndex, sig, Buffer.from(attestationPubKey));
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
    addPaygoAddressProof(psbt, outputIndex, sig, Buffer.from(attestationPubKey));
    addPaygoAddressProof(psbt, outputIndex, sig, Buffer.from('xpub12345abcdef29a028510d3b2d4'));
    assert.throws(
      () => getPaygoAddressProofOutputIndex(psbt),
      (e: any) => e.message === 'There are multiple PayGo addresses in the PSBT output 0.'
    );
  });
});
