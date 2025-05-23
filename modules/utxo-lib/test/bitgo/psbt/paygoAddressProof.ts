import * as assert from 'assert'
import { decodeProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import { KeyValue } from 'bip174/src/lib/interfaces';
import { checkForOutput } from 'bip174/src/lib/utils';

import { bip32, networks, testutil } from '../../../src'
import { addPaygoAddressProof, verifyPaygoAddressProof, getPaygoAddressProofIndex, psbtIncludesPaygoAddressProof } from "../../../src/bitgo/psbt/paygoAddressProof";
import { inputScriptTypes, outputScriptTypes } from '../../../src/testutil';
import { ProprietaryKeySubtype, PSBT_PROPRIETARY_IDENTIFIER, RootWalletKeys } from '../../../src/bitgo';


const network = networks.bitcoin;
const keys = [1,2,3].map((v) => bip32.fromSeed(Buffer.alloc(16, `test/2/${v}`), network))
const rootWalletKeys = new RootWalletKeys([keys[0], keys[1], keys[2]])
const dummyKey1 = rootWalletKeys.deriveForChainAndIndex(50, 200);
const dummyKey2 = rootWalletKeys.deriveForChainAndIndex(60, 201);
const dumm1yXPubs = dummyKey1.publicKeys;
const dummy1PubKey = dummyKey1.user.publicKey;

const psbtInputs = inputScriptTypes.map((scriptType) => ({scriptType, value: BigInt(1000)}))
const psbtOutputs = outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900)}))
const sig = dummyKey1.user.privateKey!;
const sig2 = dummyKey2.user.privateKey!;

function getTestPsbt() {
    return testutil.constructPsbt(
        psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned'
    )
}

describe('addPaygoAddressProof and verifyPaygoAddressProof', () => {
    function getPaygoProprietaryKey(proprietaryKeyVals: KeyValue[]) {
        return proprietaryKeyVals.map(({key, value}) => {
            return { key: decodeProprietaryKey(key), value };
        }).filter((keyValue) => {
            return keyValue.key.identifier === PSBT_PROPRIETARY_IDENTIFIER && keyValue.key.subtype === ProprietaryKeySubtype.PAYGO_ADDRESS_PROOF
        });
    }

    it("should fail a proof verification if the proof isn't valid", () => {
        const outputIndex = 0;
        const psbt = getTestPsbt();
        addPaygoAddressProof(psbt, outputIndex, Buffer.from(sig), dummy1PubKey);
        const output = checkForOutput(psbt.data.outputs, outputIndex);
        const proofInPsbt = getPaygoProprietaryKey(output.unknownKeyVals!);
        assert(proofInPsbt.length === 1)
        assert.throws(() => verifyPaygoAddressProof(psbt, 0, dummyKey2.user.publicKey), (e: any) => e.message === 'Cannot verify the paygo address signature with the provided pubkey.');
    });

    it("should add and verify a valid paygo address proof on the PSBT", () => {
        const outputIndex = 0;
        const psbt = getTestPsbt();
        addPaygoAddressProof(psbt, outputIndex, Buffer.from(sig), dummy1PubKey);
        // should verify function return a boolean? that way we can assert
        // if this is verified, throws an error otherwise or false + error msg as an object
        verifyPaygoAddressProof(psbt, outputIndex, dummy1PubKey);
    });

    it("should throw an error if there are multiple PayGo proprietary keys in the PSBT", () => {
        const outputIndex = 0;
        const psbt = getTestPsbt();
        addPaygoAddressProof(psbt, outputIndex, Buffer.from(sig), dummy1PubKey);
        addPaygoAddressProof(psbt, outputIndex, Buffer.from(sig2), dummy1PubKey);
        const output = checkForOutput(psbt.data.outputs, outputIndex);
        const proofInPsbt = getPaygoProprietaryKey(output.unknownKeyVals!);
        assert(proofInPsbt.length !== 0)
        assert(proofInPsbt.length <= 1)
        assert.throws(() => verifyPaygoAddressProof(psbt, outputIndex, dummy1PubKey), (e: any) => e.message === 'There are multiple paygo address proofs encoded in the PSBT. Something went wrong.');
    });
});


describe('verifyPaygoAddressProof', () => {
    it('should throw an error if there is no PayGo address in PSBT', () => {
        const psbt = getTestPsbt();
        assert.throws(() => verifyPaygoAddressProof(psbt, 0, dummy1PubKey), (e: any) => e.message === 'here is no paygo address proof encoded in the PSBT.');
    });
});

describe('getPaygoAddressProofIndex', () => {
    it('should get PayGo address proof index from PSBT if there is one', () => {
        const psbt = getTestPsbt();
        const outputIndex = 0;
        addPaygoAddressProof(psbt, outputIndex, Buffer.from(sig), dummy1PubKey);
        assert(psbtIncludesPaygoAddressProof(psbt));
        assert(getPaygoAddressProofIndex(psbt) === 1)
    });

    it("should return undefined if there is no PayGo address proof in PSBT", () => {
        const psbt = getTestPsbt();
        assert(getPaygoAddressProofIndex(psbt) === undefined)
        assert(!psbtIncludesPaygoAddressProof(psbt))
    });
});