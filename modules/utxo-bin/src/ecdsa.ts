const BN = require('bn.js');
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');
const n = secp256k1.curve.n;
const nDiv2 = n.shrn(1);

export function isHighS(s: Buffer): boolean {
  return new BN(s).cmp(nDiv2) > 0;
}
