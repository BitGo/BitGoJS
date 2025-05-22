import * as assert from 'assert'
import { testutil, networks } from 'modules/utxo-lib/src';
import { addPaygoAddressProof, verifyPaygoAddressProof, getPaygoAddressProofIndex } from "modules/utxo-lib/src/bitgo/psbt/paygoAddressProof";
import { getDefaultWalletKeys, inputScriptTypes, outputScriptTypes } from 'modules/utxo-lib/src/testutil';

import { SignatureTargetType } from './Psbt';
import { PSBT_PROPRIETARY_IDENTIFIER, UtxoPsbt } from 'modules/utxo-lib/src/bitgo';
import { decodeProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import { KeyValue } from 'bip174/src/lib/interfaces';

const network = networks.bitcoin;
const rootWalletKeys = getDefaultWalletKeys();

const psbtInputs = inputScriptTypes.map((scriptType) => ({scriptType, value: BigInt(1000)}))
const psbtOutputs = outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900)}))
const sig = 'paygoaddresssig'

function getTestPsbt(inputs: testutil.Input[], outputs: testutil.Output[], signed: SignatureTargetType) {
    return testutil.constructPsbt(
        inputs, outputs, network, rootWalletKeys, signed
    )
}

function addPaygoAddressProofToPsbt(index: number, hasInput: boolean, hasOutput: boolean): UtxoPsbt {
    // will update this function accordingly, just have this for now to help to simple testing
    const psbt = getTestPsbt(hasInput ? psbtInputs : [], hasOutput ? psbtOutputs : [], hasInput && hasOutput ? 'unsigned' : 'fullsigned');
    addPaygoAddressProof(psbt, index, Buffer.from(sig));
    return psbt;
}

describe('addPaygoAddressProof function', () => {
    function getPaygoProprietaryKey(proprietaryKeyVals: KeyValue[]) {
        return proprietaryKeyVals.map(({key, value}) => {
            return { key: decodeProprietaryKey(key), value };
        }).filter((keyValue) => {
            return keyValue.key.identifier === PSBT_PROPRIETARY_IDENTIFIER && keyValue.value === Buffer.from(sig)
        });
    }
    it('should add PayGo Address proof to empty PSBT', () => {
        const inputIndex = 0;
        const psbt = getTestPsbt([], [], 'unsigned');
        // better sig test replacement, i just have random string as test
        addPaygoAddressProof(psbt, inputIndex, Buffer.from(sig));
        const proprietaryKeyVals = psbt.data.globalMap.unknownKeyVals;
        assert(proprietaryKeyVals)
        // I assume that the proprietaryKeyVal should be properly added
        // to the unknownKeyVals globalmap
        const proofInPsbt = getPaygoProprietaryKey(proprietaryKeyVals)
        assert(proofInPsbt.length === 1);
    });

    it('should add Paygo Adress Proof to non-empty PSBT', () => {
        const inputIndex = 0;
        const psbt = getTestPsbt(psbtInputs, psbtOutputs, 'fullsigned');
        addPaygoAddressProof(psbt, inputIndex, Buffer.from(sig));
        const proprietaryKeyVals = psbt.data.globalMap.unknownKeyVals;
        assert(proprietaryKeyVals);
        const proofInPsbt = getPaygoProprietaryKey(proprietaryKeyVals);
        assert(proofInPsbt.length === 1);
    });

    // do we have an error check with the original addProprietaryKeyValToInput
    // to see if there are duplicates of the same? if not I will add the test case here.
})


describe('verifyPaygoAddressProof', () => {
    const pubkey = 'pubkeytestforpaygopsbt'

    it('should verify a valid PayGo address proof', () => {
        const indexInput = 0;
        const psbt = addPaygoAddressProofToPsbt(indexInput, false, false);
        verifyPaygoAddressProof(psbt, 0, Buffer.from(pubkey))
        // nothing happens if verification is successful
    });

    it('should throw an error if there is no PayGo address in PSBT', () => {
        const psbt = getTestPsbt(psbtInputs, psbtOutputs, 'fullsigned');
        assert.throws(() => verifyPaygoAddressProof(psbt, 0, Buffer.from(pubkey)), (e: any) => e.message === 'here is no paygo address proof encoded in the PSBT.')
    });

    it('should throw an error if there is multiple PayGo address in PSBT', () => {
        const psbt = getTestPsbt(psbtInputs, psbtOutputs, 'fullsigned');
        const sig2 = 'paygoaddresssig2'
        addPaygoAddressProof(psbt, 0, Buffer.from(sig))
        addPaygoAddressProof(psbt, 1, Buffer.from(sig2))
        assert.throws(() => verifyPaygoAddressProof(psbt, 0, Buffer.from(pubkey)), (e: any) => e.message === 'There are multiple paygo address proofs encoded in the PSBT. Something went wrong.')
    });

    // Once we think of what message should be signing, we can generate a test case
    // to test this error message properly
    it('should throw an error if the verification fails', () => {
        const psbt = addPaygoAddressProofToPsbt(0, false, false);
        assert.throws(() => verifyPaygoAddressProof(psbt, 0, Buffer.from(pubkey + 's')), (e: any) => e.message === 'Cannot verify the paygo address signature with the provided pubkey.')  
    });
});

describe('getPaygoAddressProofIndex', () => {
    it('should get PayGo address proof index from PSBT', () => {
    });
});