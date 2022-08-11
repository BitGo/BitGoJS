import { AcalaSpecNameType } from '@bitgo/statics';
import { TypeRegistry, getRegistry } from '@acala-network/txwrapper-acala';
import { Material } from './iface';

export class SingletonRegistry {
  private static instance: TypeRegistry;
  private static material: Material;

  static getInstance(material): TypeRegistry {
    if (material !== SingletonRegistry.material) {
      SingletonRegistry.material = material;
      SingletonRegistry.instance = getRegistry({
        chainName: material.chainName,
        specName: material.specName as AcalaSpecNameType,
        specVersion: material.specVersion,
        metadataRpc: material.metadata as `0x${string}`,
      });
    }
    return SingletonRegistry.instance;
  }
}
