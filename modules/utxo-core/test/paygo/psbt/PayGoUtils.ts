import assert from 'assert';

import * as bitcoinMessage from 'bitcoinjs-message';
import { decodeProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import { KeyValue } from 'bip174/src/lib/interfaces';
import { checkForOutput } from 'bip174/src/lib/utils';
import { bitgo, networks, testutil, bip32, crypto, address } from '@bitgo/utxo-lib';

import {
  addPaygoAddressProof,
  getPaygoAddressProofOutputIndex,
  psbtOutputIncludesPaygoAddressProof,
  verifyPaygoAddressProof,
} from '../../../src/paygo/psbt/PayGoUtils';
import { generatePayGoAttestationProof } from '../../../src/testutil/generatePayGoAttestationProof.utils';

// To construct our PSBTs
const network = networks.bitcoin;
const keys = [1, 2, 3].map((v) => bip32.fromSeed(Buffer.alloc(16, `test/2/${v}`), network));
const rootWalletKeys = new bitgo.RootWalletKeys([keys[0], keys[1], keys[2]]);
const psbtInputs = testutil.inputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(1000) }));
const psbtOutputs = testutil.outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900) }));
const dummyPub1 = rootWalletKeys.deriveForChainAndIndex(50, 200);
// wallet pub and priv key for tbtc
const attestationPubKey = dummyPub1.user.publicKey;
const attestationPrvKey = dummyPub1.user.privateKey!;
// const attestationPubKey =
//   'xpub661MyMwAqRbcFU2Qx7pvGmmiQpVj8NcR7dSVpgqNChMkQyobpVWWERcrTb47WicmXwkhAY2VrC3hb29s18FDQWJf5pLm3saN6uLXAXpw1GV';
// const attestationPrvKey = '3FlzrW1WuPbab2GWGyx+k/pHUNefDlw3SV0NQHLrWA+YEzqbvEQmosFGXMslYqtgpeIy6HiEoEvKzbNKM7yGY8GQHv7E++/sQRFDprOyklaW7GVyC2yEZe/LdaEfBvxf2VHBmu2hYubjsdHYF5+RQ3FhnyaNT+0=';
// const keypair = ECPair.fromPrivateKey(Buffer.from(attestationPrvKey));

// UUID structure
const nilUUID = '00000000-0000-0000-0000-000000000000';

// our xpub converted to base58 address
const addressFromPubkey = address.toBase58Check(
  crypto.hash160(Buffer.from(attestationPubKey)),
  networks.bitcoin.pubKeyHash,
  networks.bitcoin
);
// this should be retuning a Buffer
const addressProofBuffer = generatePayGoAttestationProof(nilUUID, Buffer.from(addressFromPubkey));
// signature with the given msg addressProofBuffer
// console.log(attestationPrvKey)
const sig = bitcoinMessage.sign(addressProofBuffer, attestationPrvKey!);

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
          keyValue.key.identifier === bitgo.PSBT_PROPRIETARY_IDENTIFIER &&
          keyValue.key.subtype === bitgo.ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF
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
      () => verifyPaygoAddressProof(psbt, 0, Buffer.from('Random Signed Message')),
      (e: any) => e.message === 'Cannot verify the paygo address signature with the provided pubkey.'
    );
  });

  it('should add and verify a valid paygo address proof on the PSBT', () => {
    const outputIndex = 0;
    const psbt = getTestPsbt();
    addPaygoAddressProof(psbt, outputIndex, sig, Buffer.from(attestationPubKey));
    verifyPaygoAddressProof(psbt, outputIndex, Buffer.from(addressProofBuffer));
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
      () => verifyPaygoAddressProof(psbt, outputIndex, addressProofBuffer),
      (e: any) => e.message === 'There are multiple paygo address proofs encoded in the PSBT. Something went wrong.'
    );
  });
});

describe('verifyPaygoAddressProof', () => {
  it('should throw an error if there is no PayGo address in PSBT', () => {
    const psbt = getTestPsbt();
    assert.throws(
      () => verifyPaygoAddressProof(psbt, 0, addressProofBuffer),
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
