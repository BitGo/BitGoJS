import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { Coin } from '@cosmjs/stargate';

export class Utils extends CosmosUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidValidatorAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidContractAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  validateAmount(amount: Coin): void {
    throw new Error('Method not implemented.');
  }
}

const utils = new Utils();

export default utils;
