import { BaseMessage, MessageOptions, MessageStandardType, Signature } from '@bitgo/sdk-core';
import * as CardanoSL from '@emurgo/cardano-serialization-lib-nodejs';
import { constructCSLCoseObjects, coseObjectsOutputToBuffer, createCSLSigStructure } from './utils';

/**
 * Implementation of Message for CIP8 standard
 */
export class Cip8Message extends BaseMessage {
  constructor(options: MessageOptions) {
    super({
      ...options,
      type: MessageStandardType.CIP8,
    });
  }

  /**
   * Returns the hash of the CIP-8 prefixed message
   */
  async getSignablePayload(): Promise<string | Buffer> {
    const { addressCborBytes } = this.validateAndGetCommonSetup();
    const { sigStructureCborBytes } = createCSLSigStructure(addressCborBytes, this.payload);
    this.signablePayload = Buffer.from(sigStructureCborBytes);
    return this.signablePayload;
  }

  /*
   * Returns broadcastable signatures in COSE format according to CIP8 standard
   *
   * This method transforms the internal signatures into a format suitable for broadcasting
   * by constructing COSE (CBOR Object Signing and Encryption) objects that comply with
   * the CIP8 message signing specification.
   *
   * @returns Array of signatures with COSE-formatted signature data and public keys
   * @throws Error if required setup validation fails
   */
  getBroadcastableSignatures(): Signature[] {
    if (!this.signatures.length) {
      return [];
    }

    const signature = this.signatures[0].signature;
    const publicKeyHex = this.signatures[0].publicKey.pub;

    const { addressCborBytes } = this.validateAndGetCommonSetup();
    const { protectedHeaderCborBytes, payloadBytes } = createCSLSigStructure(addressCborBytes, this.payload);

    const coseObjectsOutput = constructCSLCoseObjects(
      protectedHeaderCborBytes,
      payloadBytes,
      signature,
      CardanoSL.PublicKey.from_bytes(Buffer.from(publicKeyHex, 'hex'))
    );
    const coseObjectsBuffer = coseObjectsOutputToBuffer(coseObjectsOutput);
    return [
      {
        signature: coseObjectsBuffer,
        publicKey: {
          pub: publicKeyHex,
        },
      },
    ];
  }

  /**
   * Verifies the encoded payload against the provided metadata
   * @param messageEncodedHex The hex-encoded message to verify
   * @param metadata Metadata containing signer addresses
   * @returns True if the encoded payload matches the expected format, false otherwise
   */
  async verifyEncodedPayload(messageEncodedHex: string, metadata?: Record<string, unknown>): Promise<boolean> {
    if (!metadata) {
      throw new Error('Metadata is required for verifying the encoded payload');
    }
    const signers = metadata.signers as string[];
    if (signers.length === 0) {
      throw new Error('At least one signer address is required in metadata for verification');
    }
    this.addSigner(signers[0]);
    const signablePayload = await this.getSignablePayload();
    let signablePayloadHex: string;
    if (Buffer.isBuffer(signablePayload)) {
      signablePayloadHex = signablePayload.toString('hex');
    } else {
      signablePayloadHex = signablePayload;
    }
    return signablePayloadHex === messageEncodedHex;
  }

  /**
   * Validates required fields and returns common setup objects
   * @private
   */
  private validateAndGetCommonSetup() {
    if (!this.payload) {
      throw new Error('Payload is required to build a CIP8 message');
    }
    if (!this.signers || this.signers.length === 0) {
      throw new Error('A signer address is required to build a CIP8 message');
    }

    let cslAddress: CardanoSL.Address;
    try {
      cslAddress = CardanoSL.Address.from_bech32(this.signers[0]);
    } catch (error) {
      // Convert string errors to proper Error objects
      if (typeof error === 'string') {
        throw new Error(`Invalid signer address: ${error}`);
      }
      throw error;
    }

    const addressCborBytes = cslAddress.to_bytes();
    return { addressCborBytes };
  }
}
