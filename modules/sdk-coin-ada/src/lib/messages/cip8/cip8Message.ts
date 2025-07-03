import { BaseMessage, MessageOptions, MessageStandardType, Signature } from '@bitgo/sdk-core';
import * as CardanoSL from '@emurgo/cardano-serialization-lib-nodejs';
import { constructCSLCoseObjects, coseObjectsOutputToBuffer, createCSLSigStructure } from './utils';
import { Encoder } from 'cbor-x';

/**
 * Implementation of Message for CIP8 standard
 */
export class Cip8Message extends BaseMessage {
  private readonly cborEncoder: Encoder = new Encoder({ mapsAsObjects: false });

  constructor(options: MessageOptions) {
    super({
      ...options,
      type: MessageStandardType.CIP8,
    });
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

  /**
   * Returns the hash of the EIP-191 prefixed message
   */
  async getSignablePayload(): Promise<string | Buffer> {
    if (!this.signablePayload) {
      this.signablePayload = this.buildSignablePayload();
    }
    return this.signablePayload;
  }

  /**
   * Builds the signable payload for a CIP8 message
   * @returns The signable payload as a Buffer
   */
  buildSignablePayload(): string | Buffer {
    const { addressCborBytes } = this.validateAndGetCommonSetup();
    const { sigStructureCborBytes } = createCSLSigStructure(addressCborBytes, this.payload, this.cborEncoder);
    return Buffer.from(sigStructureCborBytes);
  }

  getBroadcastableSignatures(): Signature[] {
    if (!this.signatures.length) {
      return [];
    }

    const signature = this.signatures[0].signature;
    const publicKeyHex = this.signatures[0].publicKey.pub;

    const { addressCborBytes } = this.validateAndGetCommonSetup();
    const { protectedHeaderCborBytes, payloadBytes } = createCSLSigStructure(
      addressCborBytes,
      this.payload,
      this.cborEncoder
    );

    const coseObjectsOutput = constructCSLCoseObjects(
      protectedHeaderCborBytes,
      payloadBytes,
      signature,
      CardanoSL.PublicKey.from_bytes(Buffer.from(publicKeyHex, 'hex')),
      this.cborEncoder
    );
    const coseObjectsBuffer = coseObjectsOutputToBuffer(coseObjectsOutput, this.cborEncoder);
    return [
      {
        signature: coseObjectsBuffer,
        publicKey: {
          pub: publicKeyHex,
        },
      },
    ];
  }
}
