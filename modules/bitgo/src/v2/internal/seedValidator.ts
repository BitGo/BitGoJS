import * as stellar from 'stellar-sdk';
import * as _ from 'lodash';
import { CoinFamily } from '@bitgo/statics';
import { Hbar, Algo } from '@bitgo/account-lib';

/**
 * This classes intention is to guess/verify what seeds come from where.
 */
export class SeedValidator {
  /**
   * Try to guess what kind of seed this could be
   * @param seed
   * @returns {string} - returns undefined if the coin type is undetectable. returns
   * the coin family otherwise.
   */
  static getCoinFamilyFromSeed(seed: string): CoinFamily | undefined {
    let coin: CoinFamily | undefined = undefined;

    // if this can be implemented in more than one competing seed format, that could be an issue
    if (!SeedValidator.hasCompetingSeedFormats(seed)) {
      // ordering generally matters here - hbar is the least permissive for seed checking, algo and
      // stellar have checksums. coin is guaranteed to be mutually exclusive by the
      // competing seed format check

      if (Algo.algoUtils.isValidSeed(seed)) coin = CoinFamily.ALGO;
      if (stellar.StrKey.isValidEd25519SecretSeed(seed)) coin = CoinFamily.XLM;
      if (SeedValidator.isValidHbarSeedFormat(seed)) coin = CoinFamily.HBAR;
    }

    return coin;
  }

  /**
   * Checks whether this is a valid seed for this coin family type.
   * @param seed - seed
   * @param coinFamily - the coinFamily of the coin we're working with
   */
  static isValidEd25519SeedForCoin(seed: string, coinFamily: CoinFamily): boolean {
    const guessedCoin = SeedValidator.getCoinFamilyFromSeed(seed);
    return coinFamily === guessedCoin;
  }

  /**
   * We need to ensure there is no overlap for any two seeds we put into this function. This functions
   * intention is for gating whether this seed could possibly match two formats or is invalid itself.
   * @param seed
   */
  static hasCompetingSeedFormats(seed: string): boolean {
    const isAlgoSeed = Algo.algoUtils.isValidSeed(seed);
    const isStellarSeed = stellar.StrKey.isValidEd25519SecretSeed(seed);
    const isHbarSeed = SeedValidator.isValidHbarSeedFormat(seed);

    return _.sum([isAlgoSeed, isStellarSeed, isHbarSeed]) !== 1;
  }

  /**
   * Checks if this is a valid Hbar prv. These can be encoded differently.
   * @param seed
   */
  static isValidHbarSeedFormat(seed: string): boolean {
    try {
      Hbar.Utils.createRawKey(seed);
    } catch {
      return false;
    }
    return true;
  }
}
