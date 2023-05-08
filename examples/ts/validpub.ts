import {assertIsBuffer} from "ethereumjs-util/src/helpers";
import {publicKeyVerify} from "ethereum-cryptography/secp256k1";


export const isValidPublic = function (publicKey: Buffer, sanitize: boolean = false): boolean {
    assertIsBuffer(publicKey)
    console.log("in is valid public")
    if (publicKey.length === 64) {
        // Convert to SEC1 for secp256k1
        console.log("pub key length correct")
        return publicKeyVerify(Buffer.concat([Buffer.from([4]), publicKey]))
    }

    if (!sanitize) {
        return false
    }

    return publicKeyVerify(publicKey)
}

const validPub =
    '03100d7a8834d3514701c140c60c9f847d905ced8d4c10143b24d2876fe6c3aeed29e4c4cbc124ec3ccb48074100cdb6a601684cbf102544898e148431a07bca1f';

const valid = isValidPublic(Buffer.from(validPub, 'hex'), true);

console.log("valid?", valid)
