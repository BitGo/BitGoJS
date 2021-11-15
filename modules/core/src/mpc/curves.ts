const sodium = require('libsodium-wrappers-sumo');
import { randomBytes as cryptoRandomBytes } from 'crypto';
import * as BigNum from 'bn.js';


export enum BinaryOperation {
      scalarAdd = 'scalarAdd',
      scalarSubtract = 'scalarSubtract',
      scalarMultiply = 'scalarMultiply',
  }

export enum UnaryOperation {
      scalarNegate = 'scalarNegate',
      scalarInvert = 'scalarInvert',
      pointBaseMultiply = 'pointBaseMultiply',
  }

  
/**
 * Ed25519 EdDSA curve static class.
 */
export class Ed25519Curve {

  // TODO: scalarAdd point operations
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}


  public static async scalarRandom(): Promise<number> {
    await sodium.ready;
    const random_buffer = cryptoRandomBytes(64);
    const result_buffer = Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(random_buffer));
    return result_buffer.readUInt32LE(0);
  }
  
  public static async scalarReduce(a: BigNum): Promise<number> {
    await sodium.ready;
    const a_buffer = a.toBuffer('le', 64);
    const result_buffer = Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(a_buffer));
    return result_buffer.readUInt32LE(0);
  }

  public static async binaryOperation(a: number, b: number, operation: BinaryOperation): Promise<number> {
    await sodium.ready;
    const a_buffer = Buffer.alloc(32);
    const b_buffer = Buffer.alloc(32);
    a_buffer.writeUInt32LE(a, 0);
    b_buffer.writeUInt32LE(b, 0);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let sodium_function = (_a, _b): Uint8Array => {
      return new Uint8Array();
    };
    switch (operation) {
      case BinaryOperation.scalarAdd:
        sodium_function = sodium.crypto_core_ed25519_scalar_add;
        break;
      case BinaryOperation.scalarSubtract:
        sodium_function = sodium.crypto_core_ed25519_scalar_sub;
        break;
      case BinaryOperation.scalarMultiply:
        sodium_function = sodium.crypto_core_ed25519_scalar_mul;
        break;
    }
    const result_buffer = Buffer.from(sodium_function(a_buffer, b_buffer));
    return result_buffer.readUInt32LE(0);
  }

  public static async unaryOperation(a: number, operation: UnaryOperation): Promise<number> {
    await sodium.ready;
    const a_buffer = Buffer.alloc(32);
    a_buffer.writeUInt32LE(a, 0);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let sodium_function = (_a): Uint8Array => {
      return new Uint8Array();
    };
    switch (operation) {
      case UnaryOperation.scalarNegate:
        sodium_function = sodium.crypto_core_ed25519_scalar_negate;
        break;
      case UnaryOperation.scalarInvert:
        sodium_function = sodium.crypto_core_ed25519_scalar_invert;
        break;
      case UnaryOperation.pointBaseMultiply:
        sodium_function = sodium.crypto_scalarmult_ed25519_base_noclamp;
        break;
    }
    const result_buffer = Buffer.from(sodium_function(a_buffer));
    return result_buffer.readUInt32LE(0);
  }

  public static async pointAdd(p: number, q: number): Promise<number> {
    await sodium.ready;
    const p_buffer = Buffer.alloc(32);
    const q_buffer = Buffer.alloc(32);
    p_buffer.writeUInt32LE(p, 0);
    q_buffer.writeUInt32LE(q, 0);
    const result_buffer = Buffer.from(sodium.crypto_core_ed25519_add(p_buffer, q_buffer));
    return result_buffer.readUInt32LE(0);
  }

  public static async pointMultiply(point: number, n: number): Promise<number> {
    await sodium.ready;
    const point_buffer = Buffer.alloc(32);
    const n_buffer = Buffer.alloc(32);
    point_buffer.writeUInt32LE(point, 0);
    n_buffer.writeUInt32LE(n, 0);
    const result_buffer = Buffer.from(sodium.crypto_scalarmult_ed25519_noclamp(point_buffer, n_buffer));
    return result_buffer.readUInt32LE(0);
  }

  public static async verify(y: Buffer, message: Buffer, signature: Buffer): Promise<boolean> {
    await sodium.ready;
    const combinedBuffer = Buffer.concat([signature, message]);
    return sodium.crypto_sign_open(combinedBuffer, y);
  }
}
