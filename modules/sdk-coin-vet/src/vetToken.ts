import { Vet } from './vet';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { VetTokenConfig, coins, tokens } from '@bitgo/statics';

export class VetToken extends Vet {
  public readonly tokenConfig: VetTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: VetTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('vet') : coins.get('tvet');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: VetTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new VetToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.vet.tokens, ...tokens.testnet.vet.tokens]) {
      const tokenConstructor = VetToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  get name(): string {
    return this.tokenConfig.name;
  }

  get coin(): string {
    return this.tokenConfig.coin;
  }

  get network(): string {
    return this.tokenConfig.network;
  }

  get contractAddress(): string {
    return this.tokenConfig.contractAddress;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Vet Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
