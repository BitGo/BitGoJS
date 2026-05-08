import { Vet } from './vet';
import { coins, tokens, VetNFTCollectionConfig } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';

export class VetNFTCollection extends Vet {
  public readonly nftCollectionConfig: VetNFTCollectionConfig;

  constructor(bitgo: BitGoBase, nftCollectionConfig: VetNFTCollectionConfig) {
    const staticsCoin = nftCollectionConfig.network === 'Mainnet' ? coins.get('vet') : coins.get('tvet');
    super(bitgo, staticsCoin);
    this.nftCollectionConfig = nftCollectionConfig;
  }

  static createNFTCollectionConstructor(config: VetNFTCollectionConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new VetNFTCollection(bitgo, config);
  }
  static createNFTCollectionConstructors(
    nftCollectionConfigs: VetNFTCollectionConfig[] = [
      ...tokens.bitcoin.vet.nftCollections,
      ...tokens.testnet.vet.nftCollections,
    ]
  ): NamedCoinConstructor[] {
    const nftCollectionCtors: NamedCoinConstructor[] = [];
    for (const config of nftCollectionConfigs) {
      const nftCollectionConstructor = VetNFTCollection.createNFTCollectionConstructor(config);
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
    return 'Vet NFT Collection';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.nftCollectionConfig.decimalPlaces);
  }
}
