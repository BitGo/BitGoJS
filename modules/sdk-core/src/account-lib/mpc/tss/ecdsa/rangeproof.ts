/**
 * Zero Knowledge Range Proofs as described in (Two-party generation of DSA signatures)[1].
 * [1]: https://reitermk.github.io/papers/2004/IJIS.pdf
 */
import { EcdsaRangeProof, randomPositiveCoPrimeTo } from '@bitgo/sdk-lib-mpc';

const {
  generateSafePrimes,
  generateNtilde,
  generateNtildeProof,
  verifyNtildeProof,
  prove,
  proveWithCheck,
  verify,
  verifyWithCheck,
} = EcdsaRangeProof;

/**
 * @deprecated Use EcdsaRangeProof from sdk-lib-mpc instead
 */
export {
  generateSafePrimes,
  randomPositiveCoPrimeTo,
  generateNtilde,
  generateNtildeProof,
  verifyNtildeProof,
  prove,
  proveWithCheck,
  verify,
  verifyWithCheck,
};
