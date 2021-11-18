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


  public static async scalarRandom(): Promise<BigNum> {
    await sodium.ready;
    const random_buffer = cryptoRandomBytes(64);
    const result_buffer = Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(random_buffer));
    return new BigNum(result_buffer);
  }
  
  public static async scalarReduce(a: BigNum): Promise<BigNum> {
    await sodium.ready;
    const a_buffer = a.toBuffer('le', 64);
    const result_buffer = Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(a_buffer));
    return new BigNum(result_buffer);
  }

  public static async binaryOperation(a: BigNum, b: BigNum, operation: BinaryOperation): Promise<BigNum> {
    await sodium.ready;
    const a_buffer = a.toBuffer('le', 32);
    const b_buffer = b.toBuffer('le', 32);
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
    return new BigNum(result_buffer);
  }

  public static async unaryOperation(a: BigNum, operation: UnaryOperation): Promise<BigNum> {
    await sodium.ready;
    const a_buffer = a.toBuffer('le', 32);
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
    return new BigNum(result_buffer);
  }

  public static async pointAdd(p: BigNum, q: BigNum): Promise<BigNum> {
    await sodium.ready;
    const p_buffer = p.toBuffer('le', 32);
    const q_buffer = q.toBuffer('le', 32);
    const result_buffer = Buffer.from(sodium.crypto_core_ed25519_add(p_buffer, q_buffer));
    return new BigNum(result_buffer);
  }

  public static async pointMultiply(point: BigNum, n: BigNum): Promise<BigNum> {
    await sodium.ready;
    const point_buffer = point.toBuffer('le', 32);
    const n_buffer = n.toBuffer('le', 32);
    const result_buffer = Buffer.from(sodium.crypto_scalarmult_ed25519_noclamp(point_buffer, n_buffer));
    return new BigNum(result_buffer);
  }

  public static async isValidPoint(point: BigNum): Promise<boolean> {
    await sodium.ready;
    const point_buffer = point.toBuffer('le', 32);
    return sodium.crypto_core_ed25519_is_valid_point(point_buffer);
  }

  public static async verify(y: Buffer, message: Buffer, signature: Buffer): Promise<boolean> {
    await sodium.ready;
    const combinedBuffer = Buffer.concat([signature, message]);
    return sodium.crypto_sign_open(combinedBuffer, y);
  }
}
