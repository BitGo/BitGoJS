import { bls12_381 as bls } from '@noble/curves/bls12-381';

/**
 * Whether the input is a valid BLS private key
 *
 * @param {string} prv a private key to validate
 * @returns {boolean} Whether the input is a valid private key or not
 */
export function isValidBLSPrivateKey(prv: string): boolean {
  try {
    return bls.fields.Fr.isValid(BigInt('0x' + prv));
  } catch (e) {
    return false;
  }
}

/**
 * Whether input is a valid BLS public key
 *
 * @param {string} pub the public key to validate
 * @returns {boolean} Whether input is a valid public key or not
 */
export function isValidBLSPublicKey(pub: string): boolean {
  try {
    const strippedHex = pub.startsWith('0x') ? pub.slice(2) : pub; // strip 0x prefix
    bls.G1.ProjectivePoint.fromHex(strippedHex).assertValidity();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Whether input is a valid BLS signature
 *
 * @param {string} sig the signature to validate
 * @returns {boolean} Whether input is a valid signature or not
 */
export function isValidBLSSignature(sig: string): boolean {
  try {
    bls.G2.ProjectivePoint.fromHex(sig).assertValidity();
    return true;
  } catch (e) {
    return false;
  }
}
