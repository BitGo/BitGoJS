import * as bitcoin from 'bitcoinjs-lib'
/**
 * 
 * @param message 
 * @returns 
 */
function getVarInt(message: Buffer): number | BigInt | undefined {
    const varInt = message[0];
    // https://en.bitcoin.it/wiki/Protocol_documentation
    if (varInt < 0xFD) return message.readUint8(1);
    if (varInt === 0xFD) {
        return message.readUint16LE(1);
    }
    if (varInt === 0xFE) {
        return message.readUInt32LE(1);
    }
    if (varInt === 0xFF) {
        return message.readBigUint64LE(1);
    }
    return undefined;
}

/**
 * 
 * This function takes in the attestation proof of a PayGo address of the from
 * 0x18Bitcoin Signed Message:\n<varint_length><ENTROPY><ADDRESS><UUID> and returns
 * the address given its length.
 * 
 * @param message 
 * @param adressProofLength 
 */
export default function extractAddressFromPayGoAttestationProof(message: any, adressProofLength: number): string {
    const signedMessageDecoded = bitcoin.crypto.;
    return "";
}