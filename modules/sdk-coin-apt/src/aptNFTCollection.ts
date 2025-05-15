import { Apt } from './apt';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { AptNFTCollectionConfig, coins, tokens } from '@bitgo/statics';

export class AptNFTCollection extends Apt {
  public readonly nftCollectionConfig: AptNFTCollectionConfig;

  constructor(bitgo: BitGoBase, nftCollectionConfig: AptNFTCollectionConfig) {
    const staticsCoin = nftCollectionConfig.network === 'Mainnet' ? coins.get('apt') : coins.get('tapt');
    super(bitgo, staticsCoin);
    this.nftCollectionConfig = nftCollectionConfig;
  }

  static createNFTCollectionConstructor(config: AptNFTCollectionConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new AptNFTCollection(bitgo, config);
  }
  static createNFTCollectionConstructors(
    nftCollectionConfigs: AptNFTCollectionConfig[] = [
      ...tokens.bitcoin.apt.nftCollections,
      ...tokens.testnet.apt.nftCollections,
    ]
  ): NamedCoinConstructor[] {
    const nftCollectionCtors: NamedCoinConstructor[] = [];
    for (const config of nftCollectionConfigs) {
      const nftCollectionConstructor = AptNFTCollection.createNFTCollectionConstructor(config);
      nftCollectionCtors.push({ name: config.type, coinConstructor: nftCollectionConstructor });
    }
    return nftCollectionCtors;
  }

  get name(): string {
    return this.nftCollectionConfig.name;
  }

  get coin(): string {
    return this.nftCollectionConfig.coin;
  }

  get network(): string {
    return this.nftCollectionConfig.network;
  }

  get nftCollectionId(): string {
    return this.nftCollectionConfig.nftCollectionId;
  }

  getChain(): string {
    return this.nftCollectionConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Apt NFT Collection';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.nftCollectionConfig.decimalPlaces);
  }
}
